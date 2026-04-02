'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CopyInviteCode from '@/src/components/CopyInviteCode'
import { Loader2, Trophy } from 'lucide-react' 

type FilterType = 'all' | 'upcoming' | 'live' | 'tournaments' | 'completed'

export default function LobbyGrid({ lobbies }: { lobbies: any[] }) {
  const [filter, setFilter] = useState<FilterType>('all')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null) 

  if (!lobbies || lobbies.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-dashed border-gray-700 p-6 md:p-10 text-center text-gray-400">
        <p>You aren't in any active lobbies right now.</p>
        <p className="mt-2 text-xs md:text-sm">Create a new one or use a friend's invite code to join!</p>
      </div>
    )
  }

  // 1. Process categories for filtering and sorting
  const processedLobbies = lobbies.map(lobby => {
    const isTournament = lobby.lobby_type === 'tournament'
    const matchStatus = lobby.matches?.status || 'completed' // fallback
    const category = isTournament ? 'tournaments' : matchStatus

    return { ...lobby, category }
  })

  // 2. Filter based on pill selection
  const filteredLobbies = processedLobbies.filter(lobby => {
    if (filter === 'all') return true
    return lobby.category === filter
  })

  // 3. Sort logic: Live > Upcoming > Tournaments > Completed
  const sortOrder: Record<string, number> = { 
    'live': 1, 
    'upcoming': 2, 
    'tournaments': 3, 
    'completed': 4 
  }
  
  if (filter === 'all') {
    filteredLobbies.sort((a, b) => (sortOrder[a.category] || 99) - (sortOrder[b.category] || 99))
  }

  const handleNavigation = (e: React.MouseEvent, lobbyId: string) => {
    e.preventDefault() 
    setNavigatingTo(lobbyId) 
    
    startTransition(() => {
      router.push(`/lobby/${lobbyId}`) 
    })
  }

  return (
    <div>
      {/* THE UPDATED PILL SWITCH */}
      <div className="mb-6 flex w-full sm:w-auto overflow-x-auto rounded-xl bg-gray-900/80 p-1 border border-gray-800 custom-scrollbar">
        {(['all', 'upcoming', 'live', 'tournaments', 'completed'] as FilterType[]).map((f) => (
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
            const isNavigatingHere = isPending && navigatingTo === lobby.id
            const isTournament = lobby.lobby_type === 'tournament'
            const match = lobby.matches
            
            return (
              <a 
                href={`/lobby/${lobby.id}`} 
                onClick={(e) => handleNavigation(e, lobby.id)} 
                key={lobby.id}
                className={`relative flex h-full cursor-pointer flex-col justify-between rounded-xl border p-5 md:p-6 transition-all hover:shadow-lg ${
                  isTournament ? 'border-ipl-gold/30 bg-ipl-card hover:border-ipl-gold/60' : 'border-gray-800 bg-ipl-card hover:border-gray-500'
                } ${isNavigatingHere ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="truncate text-lg md:text-xl font-bold">{lobby.name}</h3>
                    {isTournament && <Trophy size={18} className="text-ipl-gold shrink-0 mt-1" />}
                  </div>
                  
                  <div className="mb-4 md:mb-6 space-y-2">
                    {/* Render different info depending on the lobby type */}
                    {isTournament ? (
                       <div className="text-xs md:text-sm font-semibold text-ipl-gold bg-ipl-gold/10 inline-block px-2 py-1 rounded">
                         Tournament Group
                       </div>
                    ) : (
                      match && (
                        <div className="text-xs md:text-sm font-semibold text-gray-300">
                          {match.team1} vs {match.team2}
                        </div>
                      )
                    )}
                    
                    {/* ONLY SHOW MATCH STATUS FOR SINGLE LOBBIES */}
                    {!isTournament && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 mt-2">
                        Match:
                        <span className={`capitalize font-bold flex items-center gap-1 ${
                          lobby.category === 'live' ? 'text-red-500' : 
                          lobby.category === 'completed' ? 'text-green-500' : 
                          'text-blue-400'
                        }`}>
                          {lobby.category === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                          {lobby.category}
                        </span>
                      </div>
                    )}

                    <div onClick={(e) => e.stopPropagation()} className="pt-1">
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
                    <span className="font-semibold text-ipl-gold transition-colors hover:text-white">
                      {isTournament ? 'Enter Group Dashboard →' : 'Enter Match →'}
                    </span>
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