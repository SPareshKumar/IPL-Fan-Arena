'use client'

import { useState } from 'react'
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react'

// Define the exact shape of the complex data the server will hand us
type DraftedPlayer = {
  id: number
  name: string
  team: string
  role: string
  isCaptain: boolean
  pointsScored: number
}

type LeaderboardEntry = {
  userId: string
  name: string
  score: number
  isCurrentUser: boolean
  squad: DraftedPlayer[]
}

export default function LeaderboardRow({ 
  player, 
  index 
}: { 
  player: LeaderboardEntry
  index: number 
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`overflow-hidden rounded-xl border transition-all ${
      player.isCurrentUser 
        ? 'border-ipl-gold bg-ipl-gold/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
        : 'border-gray-800 bg-ipl-card'
    }`}>
      
      {/* THE CLICKABLE HEADER */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-6">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full font-black text-xl ${
            index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
            index === 1 ? 'bg-gray-300 text-black' :
            index === 2 ? 'bg-amber-700 text-white' :
            'bg-gray-800 text-gray-400'
          }`}>
            {index === 0 ? <Trophy size={20} /> : `#${index + 1}`}
          </div>

          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              {player.name}
              {player.isCurrentUser && <span className="text-xs bg-ipl-gold text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>}
            </h3>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
              Tap to view squad {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-3xl font-black text-white">{player.score}</span>
          <span className="text-sm font-medium text-gray-400 ml-1">pts</span>
        </div>
      </div>

      {/* THE EXPANDABLE SQUAD REVEAL */}
      {isExpanded && (
        <div className="border-t border-gray-800/50 bg-black/20 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {player.squad.map(sq => (
              <div key={sq.id} className={`flex items-center justify-between rounded-lg border p-3 ${
                sq.isCaptain ? 'border-ipl-gold/50 bg-ipl-gold/5' : 'border-gray-800 bg-black/40'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{sq.name}</span>
                    {sq.isCaptain && <span className="flex h-5 w-5 items-center justify-center rounded bg-ipl-gold text-[10px] font-black text-black">C</span>}
                  </div>
                  <div className="mt-1 text-xs font-medium text-gray-500">
                    {sq.team} • {sq.role}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-black ${sq.isCaptain ? 'text-ipl-gold' : 'text-gray-300'}`}>
                    {sq.pointsScored}
                  </span>
                  <span className="text-[10px] text-gray-500 block">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}