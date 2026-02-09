import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';

function Leaderboard({ onClose }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playerList = Object.entries(data).map(([uid, player]) => ({
          uid,
          ...player,
          winRate: player.wins + player.losses > 0 
            ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)
            : 0,
          totalGames: (player.wins || 0) + (player.losses || 0) + (player.draws || 0)
        }));
        
        // Sort by wins, then by win rate
        playerList.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.winRate - a.winRate;
        });
        
        setPlayers(playerList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-white/20">
        <div className="p-6 border-b border-white/20 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white">🏆 Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          {loading ? (
            <div className="text-center text-white py-12">
              <p className="text-lg">Loading...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-lg">No players yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 px-4 py-2 text-gray-400 text-sm font-semibold">
                <div className="col-span-1">Rank</div>
                <div className="col-span-2">Player</div>
                <div className="col-span-1 text-center">Wins</div>
                <div className="col-span-1 text-center">Losses</div>
                <div className="col-span-1 text-center">Win Rate</div>
              </div>

              {/* Players */}
              {players.map((player, index) => (
                <div
                  key={player.uid}
                  className={`grid grid-cols-6 gap-4 px-4 py-3 rounded-lg ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-700/30 border border-yellow-500/50'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/50'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-500/50'
                      : 'bg-white/5 hover:bg-white/10 transition'
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    <span className="text-white font-bold text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div>
                      <p className="text-white font-semibold">{player.username}</p>
                      <p className="text-gray-400 text-xs">
                        {player.totalGames} game{player.totalGames !== 1 ? 's' : ''} played
                      </p>
                    </div>
                  </div>
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <span className="text-green-400 font-bold">{player.wins || 0}</span>
                  </div>
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <span className="text-red-400 font-bold">{player.losses || 0}</span>
                  </div>
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <span className="text-white font-bold">{player.winRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/20 bg-white/5">
          <p className="text-center text-gray-400 text-sm">
            Rankings updated in real-time • Play more games to climb the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
