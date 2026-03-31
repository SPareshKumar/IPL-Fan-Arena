'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CopyInviteCode from '@/src/components/CopyInviteCode'
import { Loader2 } from 'lucide-react' // Added Loader

export default function LobbyGrid({ lobbies }: { lobbies: any[] }) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null) // Track WHICH card was clicked

  if (!lobbies || lobbies.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-dashed border-gray-700 p-6 md:p-10 text-center text-gray-400">
        <p>You aren't in any active lobbies right now.</p>
        <p className="mt-2 text-xs md:text-sm">Create a new one or use a friend's invite code to join!</p>
      </div>
    )
  }

  const filteredLobbies = lobbies.filter(lobby => {
    if (filter === 'all') return true
    return lobby.matches?.status === filter
  })

  // THE FIX: Intercept the click to show a loader before navigating
  const handleNavigation = (e: React.MouseEvent, lobbyId: string) => {
    e.preventDefault() // Stop standard link behavior
    setNavigatingTo(lobbyId) // Set spinner on this specific card
    
    startTransition(() => {
      router.push(`/lobby/${lobbyId}`) // Manually trigger the route change
    })
  }

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
            const isNavigatingHere = isPending && navigatingTo === lobby.id
            
            return (
              // Changed <Link> to an <a> tag with an onClick handler
              <a 
                href={`/lobby/${lobby.id}`} 
                onClick={(e) => handleNavigation(e, lobby.id)} 
                key={lobby.id}
                className={`relative flex h-full cursor-pointer flex-col justify-between rounded-xl border border-gray-800 bg-ipl-card p-5 md:p-6 transition-all hover:border-gray-500 hover:shadow-lg ${isNavigatingHere ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div>
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

                    {/* Stop the copy button from triggering the navigation! */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <CopyInviteCode code={lobby.invite_code} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center justify-end border-t border-gray-800/50 pt-3 md:pt-4 text-xs md:text-sm">
                  {isNavigatingHere ? (
                     <span className="flex items-center gap-2 font-semibold text-gray-400">
                        <Loader2 size={16} className="animate-spin" /> Loading...
                     </span>
                  ) : (
                    <span className="font-semibold text-ipl-gold transition-colors hover:text-white">Enter Match &rarr;</span>
                  )}
                </div>
              </a>
            )
          })
        )}
      </div>
    </div>
  )
}