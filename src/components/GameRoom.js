import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '../firebase';
import { 
  getInitialBoard, 
  getPossibleMoves, 
  isValidMove, 
  makeMove, 
  isInCheck, 
  isCheckmate, 
  isStalemate,
  getPieceSymbol,
  COLORS
} from '../utils/chessLogic';
import Chat from './Chat';

function GameRoom({ roomId, playerColor, user, onLeaveGame }) {
  const [board, setBoard] = useState(getInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(COLORS.WHITE);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, check, checkmate, stalemate
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [roomData, setRoomData] = useState(null);

  // Load game state from Firebase
  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        if (data.board) {
          console.log('📋 Board loaded from Firebase:', data.board);
          console.log('Board row count:', data.board.length);
          console.log('Sample empty square:', data.board[2]?.[0]);
          console.log('Sample piece square:', data.board[0]?.[0]);
          setBoard(data.board);
        }
        if (data.currentTurn) {
          setCurrentTurn(data.currentTurn);
        }
        if (data.moveHistory) {
          setMoveHistory(data.moveHistory);
        }
        if (data.gameStatus) {
          setGameStatus(data.gameStatus);
        }
        if (data.players?.white?.timeRemaining !== undefined) {
          setWhiteTime(data.players.white.timeRemaining);
        }
        if (data.players?.black?.timeRemaining !== undefined) {
          setBlackTime(data.players.black.timeRemaining);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  const updatePlayerStats = useCallback(async (winnerColor) => {
    // Fetch fresh room data to avoid stale closures
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const data = snapshot.val();
    
    if (!data) return;

    const whiteUid = data.players?.white?.uid;
    const blackUid = data.players?.black?.uid;

    if (winnerColor === 'white' && whiteUid) {
      const userRef = ref(database, `users/${whiteUid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      await set(userRef, {
        ...userData,
        wins: (userData.wins || 0) + 1
      });

      if (blackUid) {
        const blackRef = ref(database, `users/${blackUid}`);
        const blackSnapshot = await get(blackRef);
        const blackData = blackSnapshot.val();
        await set(blackRef, {
          ...blackData,
          losses: (blackData.losses || 0) + 1
        });
      }
    } else if (winnerColor === 'black' && blackUid) {
      const userRef = ref(database, `users/${blackUid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();
      await set(userRef, {
        ...userData,
        wins: (userData.wins || 0) + 1
      });

      if (whiteUid) {
        const whiteRef = ref(database, `users/${whiteUid}`);
        const whiteSnapshot = await get(whiteRef);
        const whiteData = whiteSnapshot.val();
        await set(whiteRef, {
          ...whiteData,
          losses: (whiteData.losses || 0) + 1
        });
      }
    } else if (winnerColor === 'draw') {
      // Handle draw
      if (whiteUid) {
        const whiteRef = ref(database, `users/${whiteUid}`);
        const whiteSnapshot = await get(whiteRef);
        const whiteData = whiteSnapshot.val();
        await set(whiteRef, {
          ...whiteData,
          draws: (whiteData.draws || 0) + 1
        });
      }
      if (blackUid) {
        const blackRef = ref(database, `users/${blackUid}`);
        const blackSnapshot = await get(blackRef);
        const blackData = blackSnapshot.val();
        await set(blackRef, {
          ...blackData,
          draws: (blackData.draws || 0) + 1
        });
      }
    }
  }, [roomId]);

  // Timer countdown
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(async () => {
      if (currentTurn === COLORS.WHITE) {
        const newTime = whiteTime - 1;
        setWhiteTime(newTime);
        await set(ref(database, `rooms/${roomId}/players/white/timeRemaining`), newTime);
        
        if (newTime <= 0) {
          await set(ref(database, `rooms/${roomId}/gameStatus`), 'timeout');
          await set(ref(database, `rooms/${roomId}/winner`), 'black');
          setGameStatus('timeout');
          await updatePlayerStats('black');
        }
      } else {
        const newTime = blackTime - 1;
        setBlackTime(newTime);
        await set(ref(database, `rooms/${roomId}/players/black/timeRemaining`), newTime);
        
        if (newTime <= 0) {
          await set(ref(database, `rooms/${roomId}/gameStatus`), 'timeout');
          await set(ref(database, `rooms/${roomId}/winner`), 'white');
          setGameStatus('timeout');
          await updatePlayerStats('white');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurn, whiteTime, blackTime, gameStatus, roomId, updatePlayerStats]);

  const handleSquareClick = async (row, col) => {
    console.log('🎯 Square clicked:', { row, col, gameStatus, currentTurn, playerColor });
    console.log('Board structure check:', { boardLength: board.length, rowLength: board[0]?.length });
    
    if (gameStatus !== 'playing') {
      console.log('❌ Game is not in playing state:', gameStatus);
      return;
    }
    if (currentTurn !== playerColor) {
      console.log('❌ Not your turn! Current:', currentTurn, 'You are:', playerColor);
      return;
    }

    const piece = board[row][col];
    console.log('🔍 Piece at clicked square:', { piece, isEmpty: piece?.empty, hasColor: piece?.color, hasType: piece?.type });

    // If a square is already selected
    if (selectedSquare) {
      const [fromRow, fromCol] = selectedSquare;
      
      // Try to make a move
      if (isValidMove(board, fromRow, fromCol, row, col)) {
        console.log('✅ Valid move! Moving piece...');
        const newBoard = makeMove(board, fromRow, fromCol, row, col);
        
        // Check game state
        const nextTurn = currentTurn === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        let newStatus = 'playing';
        let winner = null;

        if (isCheckmate(newBoard, nextTurn)) {
          newStatus = 'checkmate';
          winner = currentTurn;
          await updatePlayerStats(currentTurn);
        } else if (isStalemate(newBoard, nextTurn)) {
          newStatus = 'stalemate';
          await updatePlayerStats('draw');
        } else if (isInCheck(newBoard, nextTurn)) {
          newStatus = 'check';
        }

        // Update Firebase
        const move = {
          from: [fromRow, fromCol],
          to: [row, col],
          piece: board[fromRow][fromCol],
          timestamp: Date.now(),
          player: currentTurn
        };

        const newHistory = [...moveHistory, move];

        await set(ref(database, `rooms/${roomId}/board`), newBoard);
        await set(ref(database, `rooms/${roomId}/currentTurn`), nextTurn);
        await set(ref(database, `rooms/${roomId}/moveHistory`), newHistory);
        await set(ref(database, `rooms/${roomId}/gameStatus`), newStatus);
        if (winner) {
          await set(ref(database, `rooms/${roomId}/winner`), winner);
        }

        setSelectedSquare(null);
        setPossibleMoves([]);
      } else {
        // If clicked on own piece, select it
        if (piece && !piece.empty && piece.color === playerColor) {
          console.log('✅ Selecting your piece:', piece);
          setSelectedSquare([row, col]);
          setPossibleMoves(getPossibleMoves(board, row, col));
        } else {
          console.log('⚠️ Deselecting - not your piece');
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      }
    } else {
      // Select a piece
      if (piece && !piece.empty && piece.color === playerColor) {
        console.log('✅ First selection - your piece:', piece);
        setSelectedSquare([row, col]);
        const moves = getPossibleMoves(board, row, col);
        console.log('Possible moves:', moves);
        setPossibleMoves(moves);
      } else {
        console.log('❌ Cannot select - not your piece or empty square');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSquareColor = (row, col) => {
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col;
    const isPossibleMove = possibleMoves.some(([r, c]) => r === row && c === col);

    if (isSelected) return 'bg-yellow-400';
    if (isPossibleMove) return 'bg-green-400 bg-opacity-50';
    return isLight ? 'bg-amber-100' : 'bg-amber-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">{roomData?.name || 'Chess Game'}</h1>
              <p className="text-gray-300 text-sm">
                You are playing as {playerColor === COLORS.WHITE ? '♔ White' : '♚ Black'}
              </p>
            </div>
            <button
              onClick={onLeaveGame}
              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition"
            >
              Leave Game
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Status */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              {gameStatus === 'checkmate' && (
                <div className="text-center text-white">
                  <h2 className="text-3xl font-bold mb-2">Checkmate!</h2>
                  <p className="text-xl">
                    {roomData?.winner === COLORS.WHITE ? '♔ White' : '♚ Black'} wins!
                  </p>
                </div>
              )}
              {gameStatus === 'stalemate' && (
                <div className="text-center text-white">
                  <h2 className="text-3xl font-bold mb-2">Stalemate!</h2>
                  <p className="text-xl">Game is a draw</p>
                </div>
              )}
              {gameStatus === 'timeout' && (
                <div className="text-center text-white">
                  <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
                  <p className="text-xl">
                    {roomData?.winner === COLORS.WHITE ? '♔ White' : '♚ Black'} wins!
                  </p>
                </div>
              )}
              {gameStatus === 'check' && (
                <div className="text-center text-white">
                  <p className="text-xl font-bold text-yellow-400">Check!</p>
                </div>
              )}
              {gameStatus === 'playing' && (
                <div className="text-center text-white">
                  <p className="text-lg">
                    Current turn: <span className="font-bold">
                      {currentTurn === COLORS.WHITE ? '♔ White' : '♚ Black'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Timers */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 border ${
                currentTurn === COLORS.BLACK ? 'border-yellow-400 border-2' : 'border-white/20'
              }`}>
                <div className="text-white text-center">
                  <p className="text-sm opacity-75">♚ Black</p>
                  <p className="text-3xl font-bold font-mono">{formatTime(blackTime)}</p>
                  <p className="text-xs mt-1">{roomData?.players?.black?.username}</p>
                </div>
              </div>
              <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 border ${
                currentTurn === COLORS.WHITE ? 'border-yellow-400 border-2' : 'border-white/20'
              }`}>
                <div className="text-white text-center">
                  <p className="text-sm opacity-75">♔ White</p>
                  <p className="text-3xl font-bold font-mono">{formatTime(whiteTime)}</p>
                  <p className="text-xs mt-1">{roomData?.players?.white?.username}</p>
                </div>
              </div>
            </div>

            {/* Chess Board */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="aspect-square max-w-2xl mx-auto">
                <div className="grid grid-cols-8 grid-rows-8 gap-0 h-full w-full border-4 border-gray-800 rounded-lg overflow-hidden">
                  {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        className={`${getSquareColor(rowIndex, colIndex)} aspect-square flex items-center justify-center cursor-pointer hover:opacity-80 transition`}
                      >
                        {piece && !piece.empty && (
                          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl select-none">
                            {getPieceSymbol(piece.type, piece.color)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Move History */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-bold mb-3">Move History</h3>
              <div className="max-h-40 overflow-y-auto">
                {moveHistory.length === 0 ? (
                  <p className="text-gray-400 text-sm">No moves yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm text-white">
                    {moveHistory.map((move, idx) => (
                      <div key={idx} className="bg-white/5 rounded px-2 py-1">
                        <span className="font-mono">
                          {idx + 1}. {String.fromCharCode(97 + move.from[1])}{8 - move.from[0]} →{' '}
                          {String.fromCharCode(97 + move.to[1])}{8 - move.to[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <Chat roomId={roomId} user={user} title="Game Chat" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;
