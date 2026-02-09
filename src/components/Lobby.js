import { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove, get } from 'firebase/database';
import { database } from '../firebase';
import { getInitialBoard } from '../utils/chessLogic';
import { COLORS } from '../utils/chessLogic';
import Chat from './Chat';

function Lobby({ user, onJoinGame }) {
  const [rooms, setRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [timeLimit, setTimeLimit] = useState(600); // 10 minutes default
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomList = Object.entries(data).map(([id, room]) => ({
          id,
          ...room
        }));
        setRooms(roomList);
      } else {
        setRooms([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const createRoom = async () => {
    if (!roomName.trim()) {
      setCreateError('Please enter a room name');
      return;
    }

    setIsCreatingRoom(true);
    setCreateError('');

    try {
      const roomsRef = ref(database, 'rooms');
      const newRoomRef = push(roomsRef);

      await set(newRoomRef, {
        name: roomName,
        host: user.uid,
        hostName: user.displayName,
        createdAt: Date.now(),
        status: 'waiting',
        timeLimit: timeLimit,
        board: getInitialBoard(),
        currentTurn: COLORS.WHITE,
        gameStatus: 'playing',
        moveHistory: [],
        players: {
          white: {
            uid: user.uid,
            username: user.displayName,
            timeRemaining: timeLimit
          }
        }
      });

      // Auto-join the host into the game they created
      const roomId = newRoomRef.key;
      onJoinGame(roomId, COLORS.WHITE);

      setRoomName('');
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Create room error:', error);
      setCreateError(error.message || 'Failed to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const joinRoom = async (roomId) => {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    const room = snapshot.val();

    if (!room) {
      alert('Room no longer exists');
      return;
    }

    if (room.players?.black) {
      alert('Room is full');
      return;
    }

    // Join as black player
    await set(ref(database, `rooms/${roomId}/players/black`), {
      uid: user.uid,
      username: user.displayName,
      timeRemaining: room.timeLimit
    });

    await set(ref(database, `rooms/${roomId}/status`), 'playing');

    onJoinGame(roomId, COLORS.BLACK);
  };

  const deleteRoom = async (roomId) => {
    await remove(ref(database, `rooms/${roomId}`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
              <p className="text-gray-300 mt-1">Welcome, {user.displayName}!</p>
            </div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105"
            >
              + Create Room
            </button>
          </div>
        </div>

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Create New Room</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="My Chess Game"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    Time Limit (seconds per player)
                  </label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={180}>3 minutes</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                    <option value={900}>15 minutes</option>
                    <option value={1800}>30 minutes</option>
                  </select>
                </div>
                {createError && <p className="text-red-400 text-sm">{createError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={createRoom}
                    disabled={isCreatingRoom}
                    className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingRoom ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateRoom(false);
                      setCreateError('');
                    }}
                    className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rooms List */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Available Rooms</h2>
              
              {rooms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No rooms available</p>
                  <p className="text-sm mt-2">Create a room to start playing!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{room.name}</h3>
                          <p className="text-gray-400 text-sm">
                            Host: {room.hostName} • Time: {Math.floor(room.timeLimit / 60)} min
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                              {room.players?.black ? '2/2 Players' : '1/2 Players'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              room.status === 'waiting' ? 'bg-green-500/20 text-green-300' :
                              room.status === 'playing' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {room.status === 'waiting' ? 'Waiting' :
                               room.status === 'playing' ? 'In Progress' : 'Finished'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {room.host === user.uid ? (
                            <button
                              onClick={() => deleteRoom(room.id)}
                              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          ) : room.status === 'waiting' && !room.players?.black ? (
                            <button
                              onClick={() => joinRoom(room.id)}
                              className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                            >
                              Join
                            </button>
                          ) : room.players?.white?.uid === user.uid || room.players?.black?.uid === user.uid ? (
                            <button
                              onClick={() => onJoinGame(room.id, room.players?.white?.uid === user.uid ? 'white' : 'black')}
                              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                            >
                              Rejoin
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <Chat roomId="lobby" user={user} title="Lobby Chat" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
