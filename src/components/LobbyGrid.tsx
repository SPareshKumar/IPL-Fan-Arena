'use client'

import { useState } from 'react'
import Link from 'next/link'
import CopyInviteCode from '@/src/components/CopyInviteCode'

export default function LobbyGrid({ lobbies }: { lobbies: any[] }) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all')

  // If the user isn't in ANY lobbies, just show the empty state (no switch)
  if (!lobbies || lobbies.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-dashed border-gray-700 p-6 md:p-10 text-center text-gray-400">
        <p>You aren't in any active lobbies right now.</p>
        <p className="mt-2 text-xs md:text-sm">Create a new one or use a friend's invite code to join!</p>
      </div>
    )
  }

  // Filter the lobbies based on the switch state
  const filteredLobbies = lobbies.filter(lobby => {
    if (filter === 'all') return true
    return lobby.matches?.status === filter
  })

  return (
    <div>
      {/* THE PILL SWITCH */}
      <div className="mb-6 flex w-full sm:w-auto overflow-x-auto rounded-xl bg-gray-900/80 p-1 border border-gray-800 custom-scrollbar">
        {(['all', 'upcoming', 'live', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 sm:flex-none min-w-[80px] px-4 py-2 text-xs md:text-sm font-bold capitalize transition-all rounded-lg ${
              filter === f 
                ? 'bg-ipl-gold text-black shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* THE GRID */}
      <div className="mb-12 md:mb-16 grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
        {filteredLobbies.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 italic border border-gray-800 rounded-xl bg-gray-900/30">
            No {filter} lobbies found.
          </div>
        ) : (
          filteredLobbies.map((lobby) => {
            const match = lobby.matches
            
            return (
              <Link href={`/lobby/${lobby.id}`} key={lobby.id}>
                <div className="flex h-full cursor-pointer flex-col justify-between rounded-xl border border-gray-800 bg-ipl-card p-5 md:p-6 transition-all hover:border-gray-500 hover:shadow-lg">
                  <div>
                    {/* THE FIX: Removed the Single/Tournament badge and simplified the layout */}
                    <div className="mb-4">
                      <h3 className="truncate text-lg md:text-xl font-bold">{lobby.name}</h3>
                    </div>
                    
                    <div className="mb-4 md:mb-6 space-y-2">
                      {match && (
                        <div className="text-xs md:text-sm font-semibold text-gray-300">
                          {match.team1} vs {match.team2}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                        Match:
                        <span className={`capitalize font-bold flex items-center gap-1 ${
                          match?.status === 'live' ? 'text-red-500' : 
                          match?.status === 'completed' ? 'text-green-500' : 
                          'text-blue-400'
                        }`}>
                          {match?.status === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                          {match?.status || 'Unknown'}
                        </span>
                      </div>

                      <CopyInviteCode code={lobby.invite_code} />
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-end border-t border-gray-800/50 pt-3 md:pt-4 text-xs md:text-sm">
                    <span className="font-semibold text-ipl-gold transition-colors hover:text-white">Enter Match &rarr;</span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}