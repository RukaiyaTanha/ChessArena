// Chess piece types
export const PIECES = {
  KING: 'king',
  QUEEN: 'queen',
  ROOK: 'rook',
  BISHOP: 'bishop',
  KNIGHT: 'knight',
  PAWN: 'pawn'
};

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Initial chess board setup
export const getInitialBoard = () => {
  // Initialize 8x8 board with empty marker (Firebase-compatible)
  const board = Array(8).fill(null).map(() => 
    Array(8).fill(null).map(() => ({ empty: true }))
  );
  
  // Black pieces
  board[0] = [
    { type: PIECES.ROOK, color: COLORS.BLACK },
    { type: PIECES.KNIGHT, color: COLORS.BLACK },
    { type: PIECES.BISHOP, color: COLORS.BLACK },
    { type: PIECES.QUEEN, color: COLORS.BLACK },
    { type: PIECES.KING, color: COLORS.BLACK },
    { type: PIECES.BISHOP, color: COLORS.BLACK },
    { type: PIECES.KNIGHT, color: COLORS.BLACK },
    { type: PIECES.ROOK, color: COLORS.BLACK }
  ];
  board[1] = Array.from({ length: 8 }, () => ({ type: PIECES.PAWN, color: COLORS.BLACK }));
  
  // White pieces
  board[6] = Array.from({ length: 8 }, () => ({ type: PIECES.PAWN, color: COLORS.WHITE }));
  board[7] = [
    { type: PIECES.ROOK, color: COLORS.WHITE },
    { type: PIECES.KNIGHT, color: COLORS.WHITE },
    { type: PIECES.BISHOP, color: COLORS.WHITE },
    { type: PIECES.QUEEN, color: COLORS.WHITE },
    { type: PIECES.KING, color: COLORS.WHITE },
    { type: PIECES.BISHOP, color: COLORS.WHITE },
    { type: PIECES.KNIGHT, color: COLORS.WHITE },
    { type: PIECES.ROOK, color: COLORS.WHITE }
  ];
  
  return board;
};

// Helper to check if a square is empty
const isEmpty = (piece) => {
  return !piece || piece.empty === true;
};

// Check if a position is within board bounds
const isValidPosition = (row, col) => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

// Get possible moves for a piece
export const getPossibleMoves = (board, fromRow, fromCol) => {
  const piece = board[fromRow][fromCol];
  if (isEmpty(piece)) return [];
  
  const moves = [];
  
  switch (piece.type) {
    case PIECES.PAWN:
      moves.push(...getPawnMoves(board, fromRow, fromCol, piece.color));
      break;
    case PIECES.ROOK:
      moves.push(...getRookMoves(board, fromRow, fromCol, piece.color));
      break;
    case PIECES.KNIGHT:
      moves.push(...getKnightMoves(board, fromRow, fromCol, piece.color));
      break;
    case PIECES.BISHOP:
      moves.push(...getBishopMoves(board, fromRow, fromCol, piece.color));
      break;
    case PIECES.QUEEN:
      moves.push(...getQueenMoves(board, fromRow, fromCol, piece.color));
      break;
    case PIECES.KING:
      moves.push(...getKingMoves(board, fromRow, fromCol, piece.color));
      break;
    default:
      break;
  }
  
  return moves;
};

const getPawnMoves = (board, row, col, color) => {
  const moves = [];
  const direction = color === COLORS.WHITE ? -1 : 1;
  const startRow = color === COLORS.WHITE ? 6 : 1;
  
  // Move forward one square
  if (isValidPosition(row + direction, col) && isEmpty(board[row + direction][col])) {
    moves.push([row + direction, col]);
    
    // Move forward two squares from starting position
    if (row === startRow && isEmpty(board[row + 2 * direction][col])) {
      moves.push([row + 2 * direction, col]);
    }
  }
  
  // Capture diagonally
  [-1, 1].forEach(offset => {
    const newRow = row + direction;
    const newCol = col + offset;
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!isEmpty(targetPiece) && targetPiece.color !== color) {
        moves.push([newRow, newCol]);
      }
    }
  });
  
  return moves;
};

const getRookMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  directions.forEach(([dRow, dCol]) => {
    let newRow = row + dRow;
    let newCol = col + dCol;
    
    while (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (isEmpty(targetPiece)) {
        moves.push([newRow, newCol]);
      } else {
        if (targetPiece.color !== color) {
          moves.push([newRow, newCol]);
        }
        break;
      }
      newRow += dRow;
      newCol += dCol;
    }
  });
  
  return moves;
};

const getKnightMoves = (board, row, col, color) => {
  const moves = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  knightMoves.forEach(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (isEmpty(targetPiece) || targetPiece.color !== color) {
        moves.push([newRow, newCol]);
      }
    }
  });
  
  return moves;
};

const getBishopMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  directions.forEach(([dRow, dCol]) => {
    let newRow = row + dRow;
    let newCol = col + dCol;
    
    while (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (isEmpty(targetPiece)) {
        moves.push([newRow, newCol]);
      } else {
        if (targetPiece.color !== color) {
          moves.push([newRow, newCol]);
        }
        break;
      }
      newRow += dRow;
      newCol += dCol;
    }
  });
  
  return moves;
};

const getQueenMoves = (board, row, col, color) => {
  return [...getRookMoves(board, row, col, color), ...getBishopMoves(board, row, col, color)];
};

const getKingMoves = (board, row, col, color) => {
  const moves = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];
  
  directions.forEach(([dRow, dCol]) => {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (isEmpty(targetPiece) || targetPiece.color !== color) {
        moves.push([newRow, newCol]);
      }
    }
  });
  
  return moves;
};

// Validate if a move is legal
export const isValidMove = (board, fromRow, fromCol, toRow, toCol) => {
  const piece = board[fromRow][fromCol];
  if (isEmpty(piece)) return false;
  
  const possibleMoves = getPossibleMoves(board, fromRow, fromCol);
  return possibleMoves.some(([row, col]) => row === toRow && col === toCol);
};

// Make a move on the board
export const makeMove = (board, fromRow, fromCol, toRow, toCol) => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[fromRow][fromCol];
  
  // Check for pawn promotion
  if (piece.type === PIECES.PAWN) {
    if ((piece.color === COLORS.WHITE && toRow === 0) ||
        (piece.color === COLORS.BLACK && toRow === 7)) {
      newBoard[toRow][toCol] = { type: PIECES.QUEEN, color: piece.color };
      newBoard[fromRow][fromCol] = { empty: true };
      return newBoard;
    }
  }
  
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = { empty: true };
  return newBoard;
};

// Find king position
const findKing = (board, color) => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!isEmpty(piece) && piece.type === PIECES.KING && piece.color === color) {
        return [row, col];
      }
    }
  }
  return null;
};

// Check if a position is under attack
const isUnderAttack = (board, row, col, attackerColor) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!isEmpty(piece) && piece.color === attackerColor) {
        const moves = getPossibleMoves(board, r, c);
        if (moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Check if current player is in check
export const isInCheck = (board, color) => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const opponentColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  return isUnderAttack(board, kingPos[0], kingPos[1], opponentColor);
};

// Check if current player is in checkmate
export const isCheckmate = (board, color) => {
  if (!isInCheck(board, color)) return false;
  
  // Try all possible moves to see if any can get out of check
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!isEmpty(piece) && piece.color === color) {
        const moves = getPossibleMoves(board, row, col);
        for (const [toRow, toCol] of moves) {
          const newBoard = makeMove(board, row, col, toRow, toCol);
          if (!isInCheck(newBoard, color)) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
};

// Check if game is stalemate
export const isStalemate = (board, color) => {
  if (isInCheck(board, color)) return false;
  
  // Check if player has any legal moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!isEmpty(piece) && piece.color === color) {
        const moves = getPossibleMoves(board, row, col);
        for (const [toRow, toCol] of moves) {
          const newBoard = makeMove(board, row, col, toRow, toCol);
          if (!isInCheck(newBoard, color)) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
};

// Get piece Unicode symbol
export const getPieceSymbol = (type, color) => {
  const symbols = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟'
    }
  };
  
  return symbols[color][type] || '';
};
