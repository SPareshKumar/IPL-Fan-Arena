'use client'

import { useState } from 'react'
import { getMatchRosterAndStats, updateManualScores } from '@/src/app/actions/admin'
import { toast } from 'sonner'
import { Database, Save } from 'lucide-react'

type Match = { id: number; team1: string; team2: string; match_time: string }
type Player = { id: number; name: string; team: string; role: string }

export default function AdminStatsManager({ matches }: { matches: Match[] }) {
  const [selectedMatch, setSelectedMatch] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [scores, setScores] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Fires when you pick a match from the dropdown
  async function handleMatchChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const matchId = e.target.value
    setSelectedMatch(matchId)
    
    if (!matchId) {
      setPlayers([])
      return
    }

    setIsLoading(true)
    const { players: fetchedPlayers, existingStats } = await getMatchRosterAndStats(Number(matchId))
    setPlayers(fetchedPlayers)
    
    // Pre-fill inputs with any existing database scores
    const initialScores: Record<number, number> = {}
    existingStats.forEach((stat: { player_id: number; fantasy_points: number }) => {
      initialScores[stat.player_id] = stat.fantasy_points
    })
    setScores(initialScores)
    setIsLoading(false)
  }

  // Updates the specific player's score in state as you type
  function handleScoreChange(playerId: number, value: string) {
    setScores(prev => ({ ...prev, [playerId]: Number(value) || 0 }))
  }

  // Fires when you click the giant Save button
  async function handleSave() {
    if (!selectedMatch) return
    setIsLoading(true)
    
    // Package it into the exact array shape our Server Action expects
    const payload = players.map(p => ({
      playerId: p.id,
      points: scores[p.id] || 0
    }))

    const result = await updateManualScores(Number(selectedMatch), payload)
    
    if (result.error) toast.error(result.error)
    else toast.success('Leaderboards instantly updated!')
    
    setIsLoading(false)
  }

  return (
    <div className="mt-10 bg-ipl-card border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="text-ipl-accent" /> Manual Override Engine
        </h2>
        
        <select 
          value={selectedMatch} 
          onChange={handleMatchChange}
          className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-ipl-gold focus:outline-none w-64"
        >
          <option value="">-- Select Match to Grade --</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>{m.team1} vs {m.team2}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-gray-400 text-center py-10 animate-pulse">Fetching database records...</p>}

      {!isLoading && players.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between bg-black/40 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors">
                <div>
                  <div className="font-bold text-white">{player.name}</div>
                  <div className="text-xs text-gray-500">{player.team} • {player.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={scores[player.id] === undefined ? '' : scores[player.id]}
                    onChange={(e) => handleScoreChange(player.id, e.target.value)}
                    placeholder="0"
                    className="w-20 bg-gray-900 border border-gray-700 rounded p-2 text-right text-ipl-gold font-black focus:border-ipl-gold focus:ring-1 focus:ring-ipl-gold outline-none"
                  />
                  <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-ipl-gold hover:bg-ipl-gold-hover text-black font-black py-4 rounded-xl transition-all hover:scale-[1.01]"
          >
            <Save size={20} />
            OVERRIDE AND PUSH SCORES
          </button>
        </div>
      )}

      {!isLoading && selectedMatch && players.length === 0 && (
        <p className="text-center text-gray-500 py-10 border border-dashed border-gray-800 rounded-xl">
          No players found for these teams.
        </p>
      )}
    </div>
  )
}