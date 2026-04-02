import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/src/components/Footer'
import { History, Users, Info, Clock, ShieldAlert, Star, LogIn, Calendar } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  
  // Smart Redirect: If they are already logged in, skip the landing page and go to Dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  // FETCH ALL MATCHES: For the Match Center Sidebar
  const { data: scheduleMatches } = await supabase
    .from('matches')
    .select('id, team1, team2, match_time, status')
    .in('status', ['upcoming', 'live'])
    .order('match_time', { ascending: true })

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      
      {/* LEFT SIDEBAR - Locked to screen height, exact match to Dashboard */}
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

          {/* Mobile Login Icon (Replaces Avatar since user is not logged in) */}
          <div className="md:hidden">
            <Link href="/login">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-gray-700 bg-gray-800 text-gray-400 transition-all hover:border-ipl-gold">
                <Users size={16} />
              </div>
            </Link>
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

        {/* Desktop-Only Guest Prompt (Matches the Avatar styling) */}
        <div className="hidden md:block mt-auto shrink-0 border-t border-gray-800 pt-5 pb-2 bg-ipl-bg">
          <Link href="/login" className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-800/50 group">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-gray-700 transition-all group-hover:border-ipl-gold shadow-md shrink-0">
              <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400"><Users size={20} /></div>
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-white transition-colors group-hover:text-ipl-gold">
                Guest Player
              </p>
              <p className="text-xs text-gray-400">Click to Log In</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        
        {/* HEADER AREA */}
        <div className="mb-8 md:mb-12 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-wide text-white">Welcome to IPL Arena</h2>
            <p className="mt-2 text-sm md:text-lg text-gray-400">The ultimate custom fantasy cricket experience.</p>
          </div>
          
          <div className="w-full sm:w-auto">
            <Link 
              href="/login" 
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-6 py-3 font-bold tracking-wide text-white transition-all hover:bg-gray-700 hover:shadow-lg border border-gray-700"
            >
              <LogIn size={18} />
              LOG IN
            </Link>
          </div>
        </div>

        {/* HERO SECTION: BIG CENTERED BUTTONS */}
        <div className="mb-12 md:mb-16 flex flex-col items-center justify-center rounded-2xl md:rounded-3xl border border-gray-800 bg-ipl-card/30 p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-ipl-gold/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 relative z-10">Build Your Dream Squad</h3>
          <p className="text-sm md:text-base text-gray-400 mb-8 md:mb-10 max-w-xl relative z-10">
            Create a custom game for your friends, or use an invite code to join an existing lobby and draft your path to victory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 relative z-10 w-full justify-center max-w-2xl">
            <Link 
              href="/login" 
              className="flex-1 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-600 px-6 py-4 md:px-8 md:py-5 text-base md:text-lg font-black tracking-widest text-white transition-all hover:bg-gray-700 hover:-translate-y-1 hover:shadow-xl"
            >
              JOIN LOBBY
            </Link>
            <Link 
              href="/login" 
              className="flex-1 flex items-center justify-center rounded-xl bg-ipl-gold px-6 py-4 md:px-8 md:py-5 text-base md:text-lg font-black tracking-widest text-black transition-all hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(234,179,8,0.3)]"
            >
              CREATE LOBBY
            </Link>
          </div>
        </div>

        {/* RULES SECTION */}
        <div className="rounded-xl md:rounded-2xl border border-gray-800 bg-ipl-card/50 p-5 md:p-8">
          <div className="mb-4 md:mb-6 flex items-center gap-2 border-b border-gray-800 pb-3 md:pb-4">
            <Info className="text-ipl-accent w-5 h-5 md:w-6 md:h-6" />
            <h2 className="text-xl md:text-2xl font-bold text-white">How to Play</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><ShieldAlert size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base text-white">Game Modes</h3></div>
                            <p className="leading-relaxed text-xs md:text-sm text-gray-400">
  Play a <strong className="text-white">Single Match Lobby</strong> for one game, or create a <strong className="text-white">Tournament Lobby</strong> and compete across the entire tournament.
</p>
            </div>

            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Users size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base text-white">Squad Roles</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
                Pick from Batsmen, Bowlers, and All-Rounders. No credit limits!
              </p>
            </div>

            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Star size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base text-white">The Captain</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
                Choose one player to be your Captain. Their total points will be multiplied by <strong className="border-b border-ipl-gold text-white">1.5x</strong>.
              </p>
            </div>

            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Clock size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base text-white">The Lock</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
                You have exactly <strong className="text-white">30 minutes after the toss</strong> to finalize your drafted team.
              </p>
            </div>
          </div>
        </div>
        <Footer/>
      </main>
    </div>
  )
}