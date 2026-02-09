import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import Leaderboard from './components/Leaderboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login'); // login, lobby, game
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setCurrentView('lobby');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user) => {
    setUser(user);
    setCurrentView('lobby');
  };

  const handleJoinGame = (roomId, color) => {
    setCurrentRoomId(roomId);
    setPlayerColor(color);
    setCurrentView('game');
  };

  const handleLeaveGame = () => {
    setCurrentRoomId(null);
    setPlayerColor(null);
    setCurrentView('lobby');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Leaderboard Button (floating) */}
      {user && currentView !== 'login' && (
        <button
          onClick={() => setShowLeaderboard(true)}
          className="fixed top-4 right-4 z-40 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
        >
          🏆 Leaderboard
        </button>
      )}

      {/* Views */}
      {currentView === 'login' && <Login onLogin={handleLogin} />}
      {currentView === 'lobby' && user && (
        <Lobby user={user} onJoinGame={handleJoinGame} />
      )}
      {currentView === 'game' && user && currentRoomId && (
        <GameRoom
          roomId={currentRoomId}
          playerColor={playerColor}
          user={user}
          onLeaveGame={handleLeaveGame}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}

export default App;
