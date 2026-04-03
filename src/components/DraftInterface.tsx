'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Minus, UserCircle, HelpCircle, X, CheckCircle2, Loader2, ChartBar, Users } from 'lucide-react'
import { lockTeam } from '@/src/app/actions/team' 
import { getMatchPlayerStats } from '@/src/app/actions/stats'
import { useRouter } from 'next/navigation' 

type Player = { id: number; name: string; team: string; role: string }

export default function DraftInterface({ 
  players, 
  lobbyId,
  targetId 
}: { 
  players: Player[]; 
  lobbyId: string;
  targetId: number; 
}) {
  const [squad, setSquad] = useState<Player[]>([])
  const [captainId, setCaptainId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false) 
  const [captainError, setCaptainError] = useState(false) 
  
  // NEW: State for switching between Draft List and Stats Panel
  const [viewMode, setViewMode] = useState<'DRAFT' | 'STATS'>('DRAFT')
  const [statsData, setStatsData] = useState<any[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [statRole, setStatRole] = useState<'BAT' | 'BOWL'>('BAT')

  const router = useRouter()
  const [isPending, startTransition] = useTransition() 

  const [predictions, setPredictions] = useState<Record<string, string>>({
    winner: '',
    sixes: '',
    pp_king: ''
  })

  const [activeRole, setActiveRole] = useState<'BAT' | 'AR' | 'BOWL'>('BAT')
  const [activeTeam, setActiveTeam] = useState<string>('BOTH')

  const teamNames = useMemo(() => Array.from(new Set(players.map(p => p.team))), [players])

  const REQUIRED_SQUAD_SIZE = 5
  const MAX_BAT = 2
  const MAX_AR = 1
  const MAX_BOWL = 2

  const isQuizComplete = predictions.winner && predictions.sixes && predictions.pp_king

  // Fetch stats only when the user switches to the STATS tab for the first time
  useEffect(() => {
    if (viewMode === 'STATS' && statsData.length === 0) {
      setIsLoadingStats(true)
      const playerIds = players.map(p => p.id)
      getMatchPlayerStats(playerIds).then(data => {
        setStatsData(data)
        setIsLoadingStats(false)
      })
    }
  }, [viewMode, players, statsData.length])

  const handleLockTeam = async () => {
    if (squad.length !== REQUIRED_SQUAD_SIZE || !captainId || !isQuizComplete || isSubmitting || isPending) return
    setIsSubmitting(true)
    
    const playerIds = squad.map(p => p.id)
    const result = await lockTeam(lobbyId, targetId, playerIds, captainId, predictions)
    
    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else {
      toast.success('Team & Predictions Locked!')
      setShowQuiz(false)
      startTransition(() => { router.refresh() })
    }
  }

  const isLoading = isSubmitting || isPending;

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
    if (squad.length >= REQUIRED_SQUAD_SIZE) return toast.error(`Squad full!`)
    if (player.role === 'BAT' && batsmen.length >= MAX_BAT) return toast.error(`Max ${MAX_BAT} Batsmen!`)
    if (player.role === 'AR' && allRounders.length >= MAX_AR) return toast.error(`Max ${MAX_AR} All-Rounders!`)
    if (player.role === 'BOWL' && bowlers.length >= MAX_BOWL) return toast.error(`Max ${MAX_BOWL} Bowlers!`)
    
    setSquad([...squad, player])
    setCaptainError(false)
  }

  const filteredPlayers = useMemo(() => {
    return players.filter(p => (p.role === activeRole) && (activeTeam === 'BOTH' || p.team === activeTeam))
  }, [players, activeRole, activeTeam])

  // NEW: Processed stats for the cards
  const displayStats = useMemo(() => {
    if (statRole === 'BAT') {
      return [...statsData].sort((a, b) => (b.runs || 0) - (a.runs || 0)).filter(s => s.runs > 0)
    } else {
      return [...statsData].sort((a, b) => (b.wickets || 0) - (a.wickets || 0)).filter(s => s.wickets > 0)
    }
  }, [statsData, statRole])

  const PitchPlayer = ({ player }: { player: Player }) => (
    <div className="relative flex flex-col items-center group">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 bg-ipl-card shadow-lg">
        <span className="text-xs font-bold text-gray-300">{player.team}</span>
      </div>
      <div className="mt-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white whitespace-nowrap">
        {player.name}
      </div>
      <button 
        onClick={() => {
          setCaptainId(captainId === player.id ? null : player.id)
          setCaptainError(false) 
        }}
        className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-sm border transition-all ${
          captainId === player.id 
            ? 'bg-ipl-gold border-yellow-200 text-black scale-110 shadow-[0_0_10px_rgba(234,179,8,0.8)] z-10'
            : captainError
              ? 'bg-red-600 border-red-300 text-white animate-shake ring-4 ring-red-500/50 scale-110 z-10'
              : squad.length === REQUIRED_SQUAD_SIZE && !captainId
                ? 'bg-gray-800 border-ipl-gold text-ipl-gold animate-pulse ring-2 ring-ipl-gold/50 z-10'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <span className="text-[10px] font-black">C</span>
      </button>
    </div>
  )

  const handleMainButtonClick = () => {
    if (squad.length === REQUIRED_SQUAD_SIZE && !captainId) {
      setCaptainError(true)
      toast.error("Tap the 'C' next to a drafted player to make them your Captain!")
      setTimeout(() => setCaptainError(false), 800)
      return
    }
    setShowQuiz(true)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}} />

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2 relative">
        
        {/* LEFT SIDE: DYNAMIC PANEL (DRAFT OR STATS) */}
        <div className="order-2 lg:order-1 flex flex-col h-[calc(100vh-80px)] border-r border-gray-800 bg-ipl-bg pt-4 px-4 md:px-6">
          
          {/* THE TOGGLE SWITCH - SEPARATED BUTTONS */}
          <div className="mb-6 flex gap-3 md:gap-4 w-full">
            <button 
              onClick={() => setViewMode('DRAFT')} 
              className={`flex-1 flex justify-center items-center gap-2 rounded-xl py-3 md:py-4 text-xs md:text-sm font-black transition-all border ${
                viewMode === 'DRAFT' 
                  ? 'bg-ipl-gold text-black border-ipl-gold shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.02]' 
                  : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600'
              }`}
            >
              <Users size={18} /> DRAFT PLAYERS
            </button>
            <button 
              onClick={() => setViewMode('STATS')} 
              className={`flex-1 flex justify-center items-center gap-2 rounded-xl py-3 md:py-4 text-xs md:text-sm font-black transition-all border ${
                viewMode === 'STATS' 
                  ? 'bg-ipl-gold text-black border-ipl-gold shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.02]' 
                  : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600'
              }`}
            >
              <ChartBar size={18} /> VIEW STATS
            </button>
          </div>

          {/* ========================================= */}
          {/* VIEW 1: DRAFTING INTERFACE */}
          {/* ========================================= */}
          {viewMode === 'DRAFT' && (
            <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in duration-300">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white flex items-center justify-between">
                  Player Pool
                  <span className="bg-gray-800 text-ipl-gold px-3 py-1 rounded-full text-sm font-bold">
                    {squad.length}/{REQUIRED_SQUAD_SIZE} Selected
                  </span>
                </h2>
                {squad.length === REQUIRED_SQUAD_SIZE && !captainId ? (
                  <p className="mt-3 rounded-lg border border-ipl-gold bg-ipl-gold/10 p-3 text-xs font-black text-ipl-gold animate-pulse flex items-center gap-2">
                    👉 Now choose your Captain (C) on the pitch!
                  </p>
                ) : (
                  <p className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs font-semibold text-yellow-500">
                    ⚠️ Once locked, your team cannot be changed.
                  </p>
                )}
              </div>

              {/* TEAM FILTER - SEPARATED BUTTONS */}
          <div className="mb-4 flex gap-2 md:gap-3 w-full">
            <button 
              onClick={() => setActiveTeam('BOTH')} 
              className={`flex-1 rounded-xl py-2 md:py-3 text-xs md:text-sm font-black transition-all border ${
                activeTeam === 'BOTH' 
                  ? 'bg-ipl-gold text-black border-ipl-gold shadow-[0_0_10px_rgba(234,179,8,0.15)] scale-[1.02]' 
                  : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600'
              }`}
            >
              BOTH TEAMS
            </button>
            {teamNames.map(team => (
              <button 
                key={team} 
                onClick={() => setActiveTeam(team)} 
                className={`flex-1 rounded-xl py-2 md:py-3 text-xs md:text-sm font-black uppercase transition-all border ${
                  activeTeam === team 
                    ? 'bg-ipl-gold text-black border-ipl-gold shadow-[0_0_10px_rgba(234,179,8,0.15)] scale-[1.02]' 
                    : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600'
                }`}
              >
                {team}
              </button>
            ))}
          </div>

              <div className="mb-2 flex gap-2 border-b border-gray-800 pb-2">
                {['BAT', 'AR', 'BOWL'].map(role => (
                  <button key={role} onClick={() => setActiveRole(role as any)} className={`relative flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${activeRole === role ? 'text-ipl-gold' : 'text-gray-500 hover:text-gray-300'}`}>
                    {role} {activeRole === role && <div className="absolute bottom-[-9px] left-0 h-[2px] w-full bg-ipl-gold shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 pb-6 grid grid-cols-1 xl:grid-cols-2 gap-3 content-start custom-scrollbar">
                {filteredPlayers.length === 0 ? (
                  <div className="col-span-full flex h-40 flex-col items-center justify-center text-gray-500"><UserCircle size={40} className="mb-2 opacity-20" /><p className="text-sm font-medium">No players found.</p></div>
                ) : (
                  filteredPlayers.map((player) => {
                    const isSelected = squad.some(p => p.id === player.id)
                    return (
                      <div key={player.id} className={`flex items-center justify-between rounded-lg border p-3 md:p-4 transition-all ${isSelected ? 'border-ipl-gold bg-ipl-gold/10' : 'border-gray-800 bg-ipl-card hover:border-gray-600'}`}>
                        <div><h3 className="font-bold text-white text-sm md:text-base">{player.name}</h3><div className="mt-1 flex gap-2 text-xs font-medium"><span className="text-gray-400">{player.team}</span><span className="text-ipl-accent">{player.role}</span></div></div>
                        <button onClick={() => togglePlayer(player)} className={`rounded-md p-2 transition-colors ${isSelected ? 'bg-red-500/20 text-red-400' : 'bg-ipl-gold/20 text-ipl-gold'}`}>{isSelected ? <Minus size={18} /> : <Plus size={18} />}</button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW 2: THE NEW STATS PANEL */}
          {/* ========================================= */}
          {viewMode === 'STATS' && (
            <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in duration-300">
              <div className="mb-4 flex gap-2 border-b border-gray-800 pb-2">
                <button onClick={() => setStatRole('BAT')} className={`relative flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${statRole === 'BAT' ? 'text-ipl-gold' : 'text-gray-500 hover:text-gray-300'}`}>
                  TOP BATTERS
                  {statRole === 'BAT' && <div className="absolute bottom-[-9px] left-0 h-[2px] w-full bg-ipl-gold shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>}
                </button>
                <button onClick={() => setStatRole('BOWL')} className={`relative flex-1 py-3 text-xs md:text-sm font-bold transition-colors ${statRole === 'BOWL' ? 'text-ipl-gold' : 'text-gray-500 hover:text-gray-300'}`}>
                  TOP BOWLERS
                  {statRole === 'BOWL' && <div className="absolute bottom-[-9px] left-0 h-[2px] w-full bg-ipl-gold shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 pb-6 flex flex-col gap-3 custom-scrollbar">
                {isLoadingStats ? (
                  <div className="flex h-40 flex-col items-center justify-center text-gray-500">
                    <Loader2 size={40} className="animate-spin mb-2 opacity-50" />
                    <p className="text-sm font-medium">Loading Database...</p>
                  </div>
                ) : displayStats.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center text-gray-500 text-center">
                    <ChartBar size={40} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium">No top {statRole === 'BAT' ? 'batting' : 'bowling'} stats found for this match.</p>
                  </div>
                ) : (
                  displayStats.map((stat, index) => (
                    <div key={stat.id} className="rounded-xl border border-gray-800 bg-ipl-card p-4 hover:border-gray-600 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <div>
                            <h3 className="font-bold text-white text-base leading-tight">{stat.players.name}</h3>
                            <span className="text-xs font-medium text-gray-400">{stat.players.team}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {/* Conditional Rendering: Only show the stat if it's strictly > 0 */}
                        {stat.runs > 0 && (
                          <div className="rounded bg-gray-900 p-2 text-center border border-gray-800/50">
                            <div className="text-[10px] text-gray-500 uppercase font-black">Runs</div>
                            <div className="font-bold text-white">{stat.runs}</div>
                          </div>
                        )}
                        {stat.batting_avg > 0 && (
                          <div className="rounded bg-gray-900 p-2 text-center border border-gray-800/50">
                            <div className="text-[10px] text-gray-500 uppercase font-black">Avg</div>
                            <div className="font-bold text-white">{stat.batting_avg}</div>
                          </div>
                        )}
                        {stat.strike_rate > 0 && (
                          <div className="rounded bg-gray-900 p-2 text-center border border-gray-800/50">
                            <div className="text-[10px] text-gray-500 uppercase font-black">SR</div>
                            <div className="font-bold text-white">{stat.strike_rate}</div>
                          </div>
                        )}
                        {stat.wickets > 0 && (
                          <div className="rounded bg-gray-900 p-2 text-center border border-gray-800/50">
                            <div className="text-[10px] text-gray-500 uppercase font-black">Wickets</div>
                            <div className="font-bold text-ipl-accent">{stat.wickets}</div>
                          </div>
                        )}
                        {stat.bowling_avg > 0 && (
                          <div className="rounded bg-gray-900 p-2 text-center border border-gray-800/50">
                            <div className="text-[10px] text-gray-500 uppercase font-black">Bowl Avg</div>
                            <div className="font-bold text-white">{stat.bowling_avg}</div>
                          </div>
                        )}
                        {stat.economy > 0 && (
                          <div className="rounded bg-gray-900 p-2 text-center border border-gray-800/50">
                            <div className="text-[10px] text-gray-500 uppercase font-black">Econ</div>
                            <div className="font-bold text-white">{stat.economy}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE: THE CRICKET PITCH (UNTouched!) */}
        {/* ========================================= */}
        <div className="order-1 lg:order-2 relative flex flex-col h-[calc(100vh-80px)] border-l-8 border-ipl-bg bg-pitch-green p-6 shadow-2xl">
          <div className="pointer-events-none absolute inset-4 rounded-[100px] border border-white/20"></div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-32 -translate-x-1/2 -translate-y-1/2 border border-white/20 bg-[#e4d5b7]/5"></div>

          <div className="relative z-10 flex h-full flex-col justify-between py-10">
            <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">{batsmen.map(p => <PitchPlayer key={p.id} player={p} />)}</div>
            <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">{allRounders.map(p => <PitchPlayer key={p.id} player={p} />)}</div>
            <div className="flex min-h-[100px] w-full items-center justify-center gap-4 sm:gap-8">{bowlers.map(p => <PitchPlayer key={p.id} player={p} />)}</div>
          </div>

          <div className="absolute bottom-6 left-1/2 z-20 w-full max-w-sm -translate-x-1/2 px-4">
            <button 
              onClick={handleMainButtonClick}
              disabled={squad.length < REQUIRED_SQUAD_SIZE}
              className={`w-full rounded-xl py-4 font-black tracking-widest shadow-xl transition-all hover:scale-105 disabled:opacity-50 ${
                captainError ? 'bg-red-600 text-white animate-shake' : 'bg-ipl-gold text-black'
              }`}
            >
              {squad.length < REQUIRED_SQUAD_SIZE ? `SELECT ${REQUIRED_SQUAD_SIZE - squad.length} MORE` : !captainId ? 'CHOOSE CAPTAIN' : 'LOCK TEAM'}
            </button>
          </div>
        </div>

        {/* --- THE BONUS QUIZ MODAL --- */}
        {showQuiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-ipl-bg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-ipl-gold flex items-center gap-2">
                  <HelpCircle size={20} /> BONUS PREDICTIONS
                </h2>
                <button onClick={() => setShowQuiz(false)} disabled={isLoading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-xs text-gray-400 mb-6 italic">Earn +10 points for every correct answer!</p>

              <div className="space-y-6">
                  {['winner', 'sixes', 'pp_king'].map((q) => (
                      <div key={q} className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-300">
                              {q === 'winner' ? 'Who will win the match?' : q === 'sixes' ? 'Most Sixes in the match?' : 'Powerplay King?'}
                          </label>
                          <div className="flex gap-2">
                              {[...teamNames, ...(q !== 'winner' ? ['Tie'] : [])].map(opt => (
                                  <button 
                                      key={opt}
                                      disabled={isLoading}
                                      onClick={() => setPredictions(prev => ({...prev, [q]: opt}))}
                                      className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all disabled:opacity-50 ${predictions[q] === opt ? 'bg-ipl-gold text-black border-ipl-gold' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                  >
                                      {opt}
                                  </button>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>

              <button 
                  onClick={handleLockTeam}
                  disabled={!isQuizComplete || isLoading}
                  className="w-full mt-8 rounded-xl bg-ipl-gold py-4 font-black tracking-widest text-black shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                  {isLoading ? (
                      <><Loader2 size={18} className="animate-spin"/> LOCKING...</>
                  ) : isQuizComplete ? (
                      <>CONFIRM & LOCK TEAM <CheckCircle2 size={18}/></>
                  ) : 'ANSWER ALL QUESTIONS'}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}