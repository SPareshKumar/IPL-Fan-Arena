'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Minus, UserCircle } from 'lucide-react'
import { lockTeam } from '@/src/app/actions/team' 
import { useRouter } from 'next/navigation' 

type Player = { id: number; name: string; team: string; role: string }

export default function DraftInterface({ 
  players, 
  lobbyType,
  lobbyId,
  targetId 
}: { 
  players: Player[]; 
  lobbyType: string;
  lobbyId: string;
  targetId: number; 
}) {
  const [squad, setSquad] = useState<Player[]>([])
  const [captainId, setCaptainId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // --- NEW STATE FOR FILTERS & TABS ---
  const [activeRole, setActiveRole] = useState<'BAT' | 'AR' | 'BOWL'>('BAT')
  const [activeTeam, setActiveTeam] = useState<string>('BOTH')

  // Extract unique team names from the player list
  const teamNames = useMemo(() => Array.from(new Set(players.map(p => p.team))), [players])

  // --- DYNAMIC LOBBY RULES ---
  const REQUIRED_SQUAD_SIZE = lobbyType === 'tournament' ? 11 : 5
  const MAX_BAT = lobbyType === 'tournament' ? 4 : 2
  const MAX_AR = lobbyType === 'tournament' ? 3 : 1
  const MAX_BOWL = lobbyType === 'tournament' ? 4 : 2

  const handleLockTeam = async () => {
    if (squad.length !== REQUIRED_SQUAD_SIZE || !captainId) return
    setIsSubmitting(true)
    
    const playerIds = squad.map(p => p.id)
    const result = await lockTeam(lobbyId, targetId, playerIds, captainId)
    
    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else {
      toast.success('Team Locked Successfully!')
      router.refresh() 
    }
  }

  const batsmen = squad.filter(p => p.role === 'BAT')
  const allRounders = squad.filter(p => p.role === 'AR')
  const bowlers = squad.filter(p => p.role === 'BOWL')

  const togglePlayer = (player: Player) => {
    const isSelected = squad.some(p => p.id === player.id)

    if (isSelected) {
      setSquad(squad.filter(p => p.id !== player.id))
      if (captainId === player.id) setCaptainId(null) 
      return
    }

    if (squad.length >= REQUIRED_SQUAD_SIZE) return toast.error(`Squad full! You can only pick ${REQUIRED_SQUAD_SIZE} players.`)
    if (player.role === 'BAT' && batsmen.length >= MAX_BAT) return toast.error(`Maximum ${MAX_BAT} Batsmen allowed!`)
    if (player.role === 'AR' && allRounders.length >= MAX_AR) return toast.error(`Maximum ${MAX_AR} All-Rounders allowed!`)
    if (player.role === 'BOWL' && bowlers.length >= MAX_BOWL) return toast.error(`Maximum ${MAX_BOWL} Bowlers allowed!`)

    setSquad([...squad, player])
  }

  // --- FILTER THE PLAYER LIST ---
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesRole = p.role === activeRole
      const matchesTeam = activeTeam === 'BOTH' || p.team === activeTeam
      return matchesRole && matchesTeam
    })
  }, [players, activeRole, activeTeam])

  const PitchPlayer = ({ player }: { player: Player }) => (
    <div className="relative flex flex-col items-center group">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 bg-ipl-card shadow-lg">
        <span className="text-xs font-bold text-gray-300">{player.team}</span>
      </div>
      <div className="mt-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white whitespace-nowrap">
        {player.name}
      </div>
      <button 
        onClick={() => setCaptainId(captainId === player.id ? null : player.id)}
        className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-sm border transition-all ${
          captainId === player.id 
            ? 'bg-ipl-gold border-yellow-200 text-black scale-110 shadow-[0_0_10px_rgba(234,179,8,0.8)]' 
            : 'bg-gray-800 border-gray-600 text-gray-400 opacity-100 md:opacity-0 md:group-hover:opacity-100'
        }`}
      >
        <span className="text-[10px] font-black">C</span>
      </button>
    </div>
  )

  return (
    <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
      
      {/* LEFT SIDE: PLAYER POOL */}
      <div className="order-2 lg:order-1 flex flex-col h-[calc(100vh-80px)] border-r border-gray-800 bg-ipl-bg pt-6 px-4 md:px-6">
        
        {/* Header & Warning */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white flex items-center justify-between">
            Draft Players
            <span className="bg-gray-800 text-ipl-gold px-3 py-1 rounded-full text-sm font-bold">
              {squad.length}/{REQUIRED_SQUAD_SIZE} Selected
            </span>
          </h2>
          {/* RESTORED WARNING MESSAGE */}
          <p className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs font-semibold text-yellow-500">
            ⚠️ Once locked, your team cannot be changed. Squads must be locked before match start.
          </p>
        </div>

        {/* TEAM FILTER (Pill Toggle) */}
        <div className="mb-4 flex w-full rounded-xl bg-gray-900/80 p-1 border border-gray-800">
          <button
            onClick={() => setActiveTeam('BOTH')}
            className={`flex-1 rounded-lg py-2 text-xs md:text-sm font-bold transition-all ${
              activeTeam === 'BOTH' ? 'bg-ipl-gold text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            BOTH TEAMS
          </button>
          {teamNames.map(team => (
            <button
              key={team}
              onClick={() => setActiveTeam(team)}
              className={`flex-1 rounded-lg py-2 text-xs md:text-sm font-bold transition-all ${
                activeTeam === team ? 'bg-ipl-gold text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {team}
            </button>
          ))}
        </div>

        {/* ROLE TABS */}
        <div className="mb-2 flex gap-2 border-b border-gray-800 pb-2">
          {[
            { id: 'BAT', label: `BATSMEN (${batsmen.length}/${MAX_BAT})` },
            { id: 'AR', label: `ALL-ROUND (${allRounders.length}/${MAX_AR})` },
            { id: 'BOWL', label: `BOWLERS (${bowlers.length}/${MAX_BOWL})` }
          ].map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id as 'BAT' | 'AR' | 'BOWL')}
              className={`relative flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${
                activeRole === role.id ? 'text-ipl-gold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {role.label}
              {activeRole === role.id && (
                <div className="absolute bottom-[-9px] left-0 h-[2px] w-full bg-ipl-gold shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
              )}
            </button>
          ))}
        </div>
        
        {/* LIST OF PLAYERS */}
        <div 
          key={`${activeRole}-${activeTeam}`} 
          className="flex-1 overflow-y-auto pr-2 pb-6 space-y-3 custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {filteredPlayers.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-gray-500">
              <UserCircle size={40} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">No players found in this category.</p>
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isSelected = squad.some(p => p.id === player.id)
              return (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between rounded-lg border p-3 md:p-4 transition-all ${
                    isSelected ? 'border-ipl-gold bg-ipl-gold/10' : 'border-gray-800 bg-ipl-card hover:border-gray-600'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-white text-sm md:text-base">{player.name}</h3>
                    <div className="mt-1 flex gap-2 text-xs font-medium">
                      <span className="text-gray-400">{player.team}</span>
                      <span className="text-ipl-accent">{player.role}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => togglePlayer(player)}
                    className={`rounded-md p-2 transition-colors ${
                      isSelected ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-ipl-gold/20 text-ipl-gold hover:bg-ipl-gold/30'
                    }`}
                  >
                    {isSelected ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDE: THE CRICKET PITCH (Unchanged) */}
      <div className="order-1 lg:order-2 relative flex flex-col h-[calc(100vh-80px)] border-l-8 border-ipl-bg bg-pitch-green p-6 shadow-2xl">
        
        <div className="pointer-events-none absolute inset-4 rounded-[100px] border border-white/20"></div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-32 -translate-x-1/2 -translate-y-1/2 border border-white/20 bg-[#e4d5b7]/5"></div>

        <div className="relative z-10 flex h-full flex-col justify-between py-10">
          
          <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">
            {batsmen.map(p => <PitchPlayer key={p.id} player={p} />)}
            {batsmen.length === 0 && <span className="text-white/30 font-medium">Select Batsmen (Max {MAX_BAT})</span>}
          </div>

          <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">
            {allRounders.map(p => <PitchPlayer key={p.id} player={p} />)}
            {allRounders.length === 0 && <span className="text-white/30 font-medium">Select All-Rounder (Max {MAX_AR})</span>}
          </div>

          <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">
            {bowlers.map(p => <PitchPlayer key={p.id} player={p} />)}
            {bowlers.length === 0 && <span className="text-white/30 font-medium">Select Bowlers (Max {MAX_BOWL})</span>}
          </div>

        </div>

        <div className="absolute bottom-6 left-1/2 z-20 w-full max-w-sm -translate-x-1/2 px-4">
          <button 
            onClick={handleLockTeam}
            disabled={squad.length < REQUIRED_SQUAD_SIZE || !captainId || isSubmitting}
            className="w-full rounded-xl bg-ipl-gold py-4 font-black tracking-widest text-black shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? 'LOCKING...' : squad.length < REQUIRED_SQUAD_SIZE ? `SELECT ${REQUIRED_SQUAD_SIZE - squad.length} MORE PLAYERS` : !captainId ? 'CHOOSE A CAPTAIN' : 'LOCK TEAM'}
          </button>
        </div>
      </div>
    </main>
  )
}