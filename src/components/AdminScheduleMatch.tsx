'use client'

import { useState } from 'react'
import { CalendarPlus, Loader2, X } from 'lucide-react'
import { getAvailableMatches, scheduleTournamentMatch } from '@/src/app/actions/tournament'

export default function AdminScheduleMatch({ lobbyId }: { lobbyId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string>('')

  const handleOpen = async () => {
    setIsOpen(true)
    setIsLoadingMatches(true)
    const available = await getAvailableMatches(lobbyId)
    setMatches(available)
    setIsLoadingMatches(false)
  }

  const handleSchedule = async () => {
    if (!selectedMatch) return
    setIsScheduling(true)
    await scheduleTournamentMatch(lobbyId, parseInt(selectedMatch))
    setIsScheduling(false)
    setIsOpen(false)
  }

  return (
    <>
      <button 
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg bg-ipl-gold px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
      >
        <CalendarPlus size={16} /> Add Match
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-ipl-card p-6 shadow-2xl relative">
            <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-black text-white mb-4">Schedule Next Match</h3>
            
            {isLoadingMatches ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-ipl-gold" size={32} /></div>
            ) : matches.length === 0 ? (
              <div className="text-center text-gray-400 py-6">No upcoming matches available to schedule.</div>
            ) : (
              <div className="space-y-4">
                <select 
                  className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white focus:border-ipl-gold focus:outline-none"
                  value={selectedMatch}
                  onChange={(e) => setSelectedMatch(e.target.value)}
                >
                  <option value="" disabled>Select an upcoming match...</option>
                  {matches.map(m => (
                    <option key={m.id} value={m.id}>
                      {new Date(m.match_time).toLocaleDateString()} - {m.team1} vs {m.team2}
                    </option>
                  ))}
                </select>

                <button 
                  onClick={handleSchedule}
                  disabled={!selectedMatch || isScheduling}
                  className="w-full rounded-xl bg-ipl-gold py-3 font-bold text-black disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isScheduling ? <><Loader2 size={18} className="animate-spin" /> Scheduling...</> : 'Confirm Match'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}