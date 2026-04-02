'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus, Trophy, Clock, PlayCircle, CheckCircle2, Loader2, ListOrdered } from 'lucide-react'
import AdminScheduleMatch from './AdminScheduleMatch'

type TabType = 'upcoming' | 'completed' | 'leaderboard'

export default function TournamentHubClient({
  lobbyId,
  lobbyName,
  inviteCode,
  currentUserId,
  isCreator,
  members,
  schedule
}: any) {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [isPending, startTransition] = useTransition()
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null)
  const router = useRouter()

  // Filter the schedule based on the active tab
  const upcomingMatches = schedule.filter((item: any) => item.matches.status === 'upcoming' || item.matches.status === 'live')
  const completedMatches = schedule.filter((item: any) => item.matches.status === 'completed' || item.matches.status === 'locked')

  // THE FIX: Provide visual feedback while Next.js fetches the nested match route
  const handleMatchClick = (e: React.MouseEvent, matchId: number) => {
    e.preventDefault()
    setNavigatingTo(matchId)
    startTransition(() => {
      router.push(`/lobby/${lobbyId}/match/${matchId}`)
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-ipl-bg text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-ipl-card p-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 transition-colors hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ipl-gold flex items-center gap-2">
              <Trophy size={18} /> {lobbyName}
            </h1>
            <span className="text-xs tracking-wider text-gray-400 uppercase">Tournament Mode</span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800 px-4 py-2 font-mono text-sm shadow-inner hidden sm:block">
          Code: <span className="text-ipl-accent">{inviteCode}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl p-4 md:p-6 space-y-6">
        
        <div className="flex items-center justify-between">
          {/* THE PILL SWITCH */}
          <div className="flex w-full sm:w-auto overflow-x-auto rounded-xl bg-gray-900/80 p-1 border border-gray-800 custom-scrollbar">
            {(['upcoming', 'completed', 'leaderboard'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none min-w-[100px] flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-bold capitalize transition-all rounded-lg ${
                  activeTab === tab 
                    ? 'bg-ipl-gold text-black shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab === 'upcoming' && <CalendarPlus size={16} />}
                {tab === 'completed' && <CheckCircle2 size={16} />}
                {tab === 'leaderboard' && <ListOrdered size={16} />}
                {tab}
              </button>
            ))}
          </div>

          {/* Admin Schedule Button */}
          {isCreator && activeTab !== 'leaderboard' && <AdminScheduleMatch lobbyId={lobbyId} />}
        </div>

        {/* --- TAB CONTENT: UPCOMING & COMPLETED MATCHES --- */}
        {(activeTab === 'upcoming' || activeTab === 'completed') && (
          <div className="grid gap-4 animate-in fade-in duration-300">
            {activeTab === 'upcoming' && upcomingMatches.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-700 bg-black/20 p-10 text-center text-gray-500">
                {isCreator ? "Schedule an upcoming match!" : "No upcoming matches scheduled yet."}
              </div>
            )}
            
            {activeTab === 'completed' && completedMatches.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-700 bg-black/20 p-10 text-center text-gray-500">
                No matches have been completed yet.
              </div>
            )}

            {(activeTab === 'upcoming' ? upcomingMatches : completedMatches).map((item: any) => {
              const match = item.matches
              const isLive = match.status === 'live'
              const isNavigatingHere = isPending && navigatingTo === match.id

              return (
                <a 
                  key={match.id} 
                  href={`/lobby/${lobbyId}/match/${match.id}`}
                  onClick={(e) => handleMatchClick(e, match.id)}
                  className={`block group cursor-pointer ${isNavigatingHere ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  <div className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
                    isLive ? 'border-red-900 bg-red-950/20 hover:border-red-500' :
                    activeTab === 'upcoming' ? 'border-ipl-gold/30 bg-ipl-card hover:border-ipl-gold' :
                    'border-gray-800 bg-black/40 hover:border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
  {new Date(match.match_time).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })}
</p>
                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-ipl-gold transition-colors">
                          {match.team1} vs {match.team2}
                        </h3>
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-2">
                        {isLive && <span className="flex items-center gap-1 text-red-500 text-sm font-bold animate-pulse"><PlayCircle size={16}/> LIVE</span>}
                        {match.status === 'upcoming' && <span className="flex items-center gap-1 text-ipl-gold text-sm font-bold"><Clock size={16}/> UPCOMING</span>}
                        {(match.status === 'completed' || match.status === 'locked') && <span className="flex items-center gap-1 text-gray-500 text-sm font-bold"><CheckCircle2 size={16}/> {match.status.toUpperCase()}</span>}
                        
                        {/* Loading Spinner during navigation */}
                        {isNavigatingHere && (
                          <span className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <Loader2 size={14} className="animate-spin" /> Entering...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* --- TAB CONTENT: MASTER LEADERBOARD --- */}
        {activeTab === 'leaderboard' && (
          <div className="rounded-xl border border-gray-800 bg-ipl-card overflow-hidden animate-in fade-in duration-300">
            {members?.map((member: any, index: number) => (
              <div key={member.user_id} className={`flex items-center justify-between p-4 border-b border-gray-800/50 ${member.user_id === currentUserId ? 'bg-ipl-gold/10' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 
                    index === 1 ? 'bg-gray-300 text-black' : 
                    index === 2 ? 'bg-amber-700 text-white' : 
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-medium text-white">
                    {/* @ts-ignore */}
                    {member.profiles?.display_name || 'Unknown'} 
                    {member.user_id === currentUserId && " (You)"}
                  </span>
                </div>
                <span className="font-black text-ipl-gold text-lg">{member.total_points}</span>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}