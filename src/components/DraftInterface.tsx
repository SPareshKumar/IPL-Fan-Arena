'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Minus } from 'lucide-react'
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

  // --- DYNAMIC LOBBY RULES ---
  // If it's a tournament, we use 11 players. Otherwise, it defaults to the 5-player single match rules.
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

    // Dynamic constraint checks based on the variables we set above
    if (squad.length >= REQUIRED_SQUAD_SIZE) return toast.error(`Squad full! You can only pick ${REQUIRED_SQUAD_SIZE} players.`)
    if (player.role === 'BAT' && batsmen.length >= MAX_BAT) return toast.error(`Maximum ${MAX_BAT} Batsmen allowed!`)
    if (player.role === 'AR' && allRounders.length >= MAX_AR) return toast.error(`Maximum ${MAX_AR} All-Rounders allowed!`)
    if (player.role === 'BOWL' && bowlers.length >= MAX_BOWL) return toast.error(`Maximum ${MAX_BOWL} Bowlers allowed!`)

    setSquad([...squad, player])
  }

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
            : 'bg-gray-800 border-gray-600 text-gray-400 opacity-0 group-hover:opacity-100'
        }`}
      >
        <span className="text-[10px] font-black">C</span>
      </button>
    </div>
  )

  return (
    <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
      
      {/* LEFT SIDE: PLAYER POOL */}
      <div className="flex flex-col h-[calc(100vh-80px)] border-r border-gray-800 bg-ipl-bg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white flex items-center justify-between">
            Available Roster
            <span className="bg-gray-800 text-ipl-gold px-3 py-1 rounded-full text-sm font-bold">
              Drafted: {squad.length}/{REQUIRED_SQUAD_SIZE}
            </span>
          </h2>
          <p className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs font-semibold text-yellow-500">
            ⚠️ Once locked, your team cannot be changed. Squads must be locked before match start.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {players.map((player) => {
            const isSelected = squad.some(p => p.id === player.id)
            return (
              <div 
                key={player.id} 
                className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                  isSelected ? 'border-ipl-gold bg-ipl-gold/10' : 'border-gray-800 bg-ipl-card hover:border-gray-600'
                }`}
              >
                <div>
                  <h3 className="font-bold text-white">{player.name}</h3>
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
          })}
        </div>
      </div>

      {/* RIGHT SIDE: THE CRICKET PITCH */}
      <div className="relative flex flex-col h-[calc(100vh-80px)] border-l-8 border-ipl-bg bg-pitch-green p-6 shadow-2xl">
        
        <div className="pointer-events-none absolute inset-4 rounded-[100px] border border-white/20"></div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-32 -translate-x-1/2 -translate-y-1/2 border border-white/20 bg-[#e4d5b7]/5"></div>

        <div className="relative z-10 flex h-full flex-col justify-between py-10">
          
          {/* Top Row: Batsmen */}
          {/* Note: gap-12 changed to gap-4 sm:gap-8 so 4 players fit nicely! */}
          <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">
            {batsmen.map(p => <PitchPlayer key={p.id} player={p} />)}
            {batsmen.length === 0 && <span className="text-white/30 font-medium">Select Batsmen (Max {MAX_BAT})</span>}
          </div>

          {/* Middle Row: All-Rounders */}
          <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">
            {allRounders.map(p => <PitchPlayer key={p.id} player={p} />)}
            {allRounders.length === 0 && <span className="text-white/30 font-medium">Select All-Rounder (Max {MAX_AR})</span>}
          </div>

          {/* Bottom Row: Bowlers */}
          <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">
            {bowlers.map(p => <PitchPlayer key={p.id} player={p} />)}
            {bowlers.length === 0 && <span className="text-white/30 font-medium">Select Bowlers (Max {MAX_BOWL})</span>}
          </div>

        </div>

        {/* Submit Button */}
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