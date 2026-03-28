'use client'

import { useState } from 'react'
import { getMatchRosterAndStats, updateManualScores, updateMatchStatus } from '@/src/app/actions/admin'
import { toast } from 'sonner'
import { Database, Save, Activity } from 'lucide-react'

type Match = { id: number; team1: string; team2: string; match_time: string }
type Player = { id: number; name: string; team: string; role: string }

export default function AdminStatsManager({ matches }: { matches: Match[] }) {
  const [selectedMatch, setSelectedMatch] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [scores, setScores] = useState<Record<number, number | string>>({})
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string>>({ winner: '', sixes: '', pp_king: '' })
  const [isLoading, setIsLoading] = useState(false)

  async function handleMatchChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    setSelectedMatch(id)
    if (!id) {
      setPlayers([])
      return
    }
    setIsLoading(true)
    const { players: fetchedPlayers, existingStats, bonusAnswers: existingBonus } = await getMatchRosterAndStats(Number(id))
    
    setPlayers(fetchedPlayers)
    setBonusAnswers(existingBonus || { winner: '', sixes: '', pp_king: '' })
    
    const initialScores: Record<number, number | string> = {}
    existingStats.forEach((stat: any) => {
      initialScores[stat.player_id] = stat.fantasy_points
    })
    setScores(initialScores)
    setIsLoading(false)
  }

  function handleScoreChange(playerId: number, value: string) {
    setScores(prev => ({ ...prev, [playerId]: value === '' ? '' : Number(value) }))
  }

  async function handleSaveAll() {
    if (!selectedMatch) return
    setIsLoading(true)
    const payload = players.map(p => ({
      playerId: p.id,
      points: Number(scores[p.id]) || 0
    }))

    const result = await updateManualScores(Number(selectedMatch), payload, bonusAnswers)
    
    if (result.error) toast.error(result.error)
    else toast.success('Player scores and Bonus answers saved!')
    
    setIsLoading(false)
  }

  async function handleStatusChange(status: string) {
    if (!selectedMatch) return
    setIsLoading(true)
    const result = await updateMatchStatus(Number(selectedMatch), status)
    if (result.error) toast.error(result.error)
    else toast.success(`Match is now: ${status.toUpperCase()}`)
    setIsLoading(false)
  }

  const currentMatch = matches.find(m => m.id === Number(selectedMatch))
  const teams = currentMatch ? [currentMatch.team1, currentMatch.team2] : []

  return (
    <div className="mt-10 bg-ipl-card border border-gray-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="text-ipl-accent" /> Match Stats & Control
        </h2>
        
        <select 
          value={selectedMatch} 
          onChange={handleMatchChange}
          className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-ipl-gold focus:outline-none w-full sm:w-64"
        >
          <option value="">-- Select Match --</option>
          {matches.map(m => <option key={m.id} value={m.id}>{m.team1} vs {m.team2}</option>)}
        </select>
      </div>

      {isLoading && <p className="text-gray-400 text-center py-10 animate-pulse">Processing...</p>}

      {!isLoading && selectedMatch && (
        <div className="space-y-10 animate-in fade-in duration-300">
          
          {/* 1. BONUS QUESTIONS SECTION */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Bonus Answer Keys</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-ipl-gold/5 border border-ipl-gold/20 rounded-xl">
              {['winner', 'sixes', 'pp_king'].map(q => (
                <div key={q}>
                  <label className="text-[10px] font-bold text-ipl-gold uppercase mb-2 block">{q.replace('_', ' ')}</label>
                  <select 
                    value={bonusAnswers[q] || ''} 
                    onChange={(e) => setBonusAnswers(prev => ({...prev, [q]: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-xs text-white outline-none focus:border-ipl-gold"
                  >
                    <option value="">-- Select Result --</option>
                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    {q !== 'winner' && <option value="Tie">Tie</option>}
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* 2. PLAYER SCORES SECTION */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Player Performance Points</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border-b border-gray-800 pb-6">
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-black/40 border border-gray-800 rounded-lg p-3">
                  <div>
                    <div className="font-bold text-white text-sm">{player.name}</div>
                    <div className="text-[10px] text-gray-500">{player.team} • {player.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={scores[player.id] ?? ''}
                      onChange={(e) => handleScoreChange(player.id, e.target.value)}
                      className="w-16 bg-gray-900 border border-gray-700 rounded p-1.5 text-right text-ipl-gold font-bold text-sm"
                    />
                    <span className="text-[10px] text-gray-500 uppercase">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. SAVE BUTTON */}
          <button 
            onClick={handleSaveAll}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-ipl-gold hover:bg-ipl-gold-hover text-black font-black py-4 rounded-xl transition-all shadow-lg"
          >
            <Save size={20} />
            SAVE SCORES & BONUS ANSWERS
          </button>

          {/* 4. MATCH STATUS BUTTONS */}
          <section className="border-t border-gray-800 pt-8">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Match Lifecycle Control</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => handleStatusChange('upcoming')} className="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold text-sm transition-colors">Set UPCOMING</button>
              <button onClick={() => handleStatusChange('live')} className="bg-red-900/40 hover:bg-red-600 border border-red-700 text-white py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Set LIVE
              </button>
              <button onClick={() => handleStatusChange('completed')} className="bg-green-900/40 hover:bg-green-600 border border-green-700 text-white py-3 rounded-lg font-bold text-sm transition-colors">Set COMPLETED</button>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 text-center italic">
              Note: "Set Completed" triggers the final points calculation for all users in all lobbies.
            </p>
          </section>

        </div>
      )}
    </div>
  )
}