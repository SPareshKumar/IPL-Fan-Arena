import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Info, Clock, ShieldAlert, Star, Calendar } from 'lucide-react'
import CreateLobbyModal from '@/src/components/CreateLobbyModal'
import JoinLobbyModal from '@/src/components/JoinLobbyModal'
import LobbyGrid from '@/src/components/LobbyGrid'
import Footer from '@/src/components/Footer'
import ProfileNavButton from '@/src/components/ProfileNavButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activeLobbies, error } = await supabase
    .from('lobbies')
    .select('*, lobby_members!inner(user_id), matches(team1, team2, status)')
    .eq('lobby_members.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error("Error fetching lobbies:", error)
  
  // FETCH ALL MATCHES: Removed .limit(5) so the user can scroll the whole season
  const { data: scheduleMatches } = await supabase
    .from('matches')
    .select('id, team1, team2, match_time, status')
    .in('status', ['upcoming', 'live'])
    .order('match_time', { ascending: true })

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      
      {/* LEFT SIDEBAR - Locked to screen height */}
      <aside className="flex w-full md:w-64 flex-col border-b md:border-b-0 md:border-r border-gray-800 bg-ipl-bg p-4 md:p-6 md:sticky md:top-0 md:h-screen">
        
        {/* Header Section */}
        <div className="flex items-center justify-between md:mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-full border-2 border-ipl-gold shadow-[0_0_10px_rgba(234,179,8,0.3)]">
              <Image 
                src="/IplLogo.jpg" 
                alt="IPL Arena Logo" 
                width={40} 
                height={40} 
                className="object-cover md:w-[45px] md:h-[45px]"
              />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-wider text-ipl-gold">IPL ARENA</h1>
          </div>

          <div className="md:hidden">
  <ProfileNavButton 
    variant="mobile" 
    avatarUrl={user.user_metadata?.avatar_url} 
  />
</div>
        </div>
        
        {/* Sleek Fading Gradient Divider */}
        <div className="hidden md:block h-px w-full bg-gradient-to-r from-gray-700/50 via-gray-700/50 to-transparent shrink-0 mb-5"></div>

        {/* --- MATCH SCHEDULE WIDGET --- */}
        <div className="mt-4 md:mt-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar md:pr-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 shrink-0">
            <Calendar size={14} /> Match Center
          </div>
          
          <div className="flex gap-3 overflow-x-auto md:overflow-x-hidden pb-2 md:flex-col md:space-y-3 md:pb-0 custom-scrollbar">
            {scheduleMatches?.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No matches scheduled.</p>
            ) : (
              scheduleMatches?.map(match => {
                const isLive = match.status === 'live'
                const matchDate = new Date(match.match_time)
                const dateStr = matchDate.toLocaleDateString('en-US', { 
                  timeZone: 'Asia/Kolkata',
                  month: 'short', 
                  day: 'numeric' 
                })

                const timeStr = matchDate.toLocaleTimeString('en-US', { 
                  timeZone: 'Asia/Kolkata',
                  hour: 'numeric', 
                  minute: '2-digit' 
                })

                return (
                  <div key={match.id} className="min-w-[200px] md:min-w-0 md:w-full shrink-0 rounded-lg border border-gray-800 bg-gray-900/40 p-3 transition-colors hover:border-gray-600">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-200">
                        {match.team1} <span className="text-gray-600 font-normal mx-1">vs</span> {match.team2}
                      </span>
                      {isLive ? (
                        <span className="flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-black text-red-500">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span> LIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-500 uppercase">Upcoming</span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-gray-400">
                      {isLive ? 'Action in progress!' : `${dateStr} • ${timeStr}`}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Desktop-Only User Avatar */}
        <div className="hidden md:block mt-auto shrink-0 border-t border-gray-800 pt-5 pb-2 bg-ipl-bg">
  <ProfileNavButton 
    variant="desktop" 
    avatarUrl={user.user_metadata?.avatar_url} 
    fullName={user.user_metadata?.full_name}
  />
</div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Active Lobbies</h2>
            <p className="mt-1 text-sm md:text-base text-gray-400">Select a lobby to draft your team.</p>
          </div>
          
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none"><JoinLobbyModal /></div>
            <div className="flex-1 sm:flex-none"><CreateLobbyModal matches={scheduleMatches?.filter(m => m.status === 'upcoming') || []} /></div>
          </div>
        </div>

        {/* DYNAMIC INTERACTIVE LOBBY GRID */}
        <LobbyGrid lobbies={activeLobbies || []} />

        {/* RULES SECTION */}
        <div className="rounded-xl md:rounded-2xl border border-gray-800 bg-ipl-card/50 p-5 md:p-8">
          <div className="mb-4 md:mb-6 flex items-center gap-2 border-b border-gray-800 pb-3 md:pb-4">
            <Info className="text-ipl-accent w-5 h-5 md:w-6 md:h-6" />
            <h2 className="text-xl md:text-2xl font-bold">How to Play</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><ShieldAlert size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base">Game Modes</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
  Play a <strong className="text-white">Single Match Lobby</strong> for one game, or create a <strong className="text-white">Tournament Lobby</strong> and compete across the entire tournament.
</p>
            </div>

            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Users size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base">Squad Roles</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
                Pick from Batsmen, Bowlers, and All-Rounders. No credit limits!
              </p>
            </div>

            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Star size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base">The Captain</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
                Choose one player to be your Captain. Their total points will be multiplied by <strong className="border-b border-ipl-gold text-white">1.5x</strong>.
              </p>
            </div>

            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Clock size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base">The Lock</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
                You have exactly <strong className="text-white">30 minutes after the toss</strong> to finalize your team.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  )
}