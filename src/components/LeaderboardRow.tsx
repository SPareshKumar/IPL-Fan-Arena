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
        className="flex cursor-pointer items-center justify-between p-4 md:p-5 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full font-black text-lg md:text-xl ${
            index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
            index === 1 ? 'bg-gray-300 text-black' :
            index === 2 ? 'bg-amber-700 text-white' :
            'bg-gray-800 text-gray-400'
          }`}>
            {index === 0 ? <Trophy size={18} className="md:w-5 md:h-5" /> : `#${index + 1}`}
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
              <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-full">{player.name}</span>
              {player.isCurrentUser && <span className="shrink-0 text-[10px] md:text-xs bg-ipl-gold text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>}
            </h3>
            <p className="text-xs md:text-sm text-gray-400 mt-1 flex items-center gap-1">
              Tap to view squad {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-2xl md:text-3xl font-black text-white">{player.score}</span>
          <span className="text-xs md:text-sm font-medium text-gray-400 ml-1">pts</span>
        </div>
      </div>

      {/* THE EXPANDABLE SQUAD REVEAL */}
      {isExpanded && (
        <div className="border-t border-gray-800/50 bg-black/20 p-3 md:p-5">
          <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {player.squad.map(sq => (
              <div key={sq.id} className={`flex items-center justify-between rounded-lg border p-2 md:p-3 ${
                sq.isCaptain ? 'border-ipl-gold/50 bg-ipl-gold/5' : 'border-gray-800 bg-black/40'
              }`}>
                {/* min-w-0 allows flex children to truncate properly */}
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="truncate font-bold text-white text-xs md:text-sm">{sq.name}</span>
                    {sq.isCaptain && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-ipl-gold text-[9px] md:text-[10px] font-black text-black">
                        C
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 md:mt-1 text-[9px] md:text-xs font-medium text-gray-500 truncate">
                    {sq.team} • {sq.role}
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <span className={`block font-black text-sm md:text-base ${sq.isCaptain ? 'text-ipl-gold' : 'text-gray-300'}`}>
                    {sq.pointsScored}
                  </span>
                  <span className="block text-[9px] md:text-[10px] text-gray-500 -mt-[2px]">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}