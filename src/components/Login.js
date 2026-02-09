import { useState } from 'react';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../firebase';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: username
      });

      // Create user profile in database
      await set(ref(database, `users/${user.uid}`), {
        username: username,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: Date.now()
      });

      onLogin(user);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">♔ Chess ♚</h1>
          <p className="text-gray-300">Multiplayer Online Game</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-white font-medium mb-2">
              Enter Your Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Player Name"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              maxLength={20}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Logging in...' : 'Enter Game'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-gray-300 text-sm">
          <p>Features: Player vs Player • Real-time • Chat • Timers</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
