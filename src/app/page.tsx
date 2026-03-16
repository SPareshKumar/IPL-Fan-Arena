import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { History, Users, Info, Clock, ShieldAlert, Star, LogIn } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  
  // 1. Smart Redirect: If they are already logged in, skip the landing page and go to Dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen">
      
      {/* LEFT SIDEBAR (Matching Dashboard Design) */}
      <aside className="flex w-64 flex-col border-r border-gray-800 bg-ipl-bg p-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="overflow-hidden rounded-full border-2 border-ipl-gold shadow-[0_0_10px_rgba(234,179,8,0.3)]">
            <Image 
              src="/IplLogo.jpg" 
              alt="IPL Arena Logo" 
              width={45} 
              height={45} 
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-ipl-gold">IPL ARENA</h1>
        </div>
        
        <nav className="flex-1 space-y-3">
          {/* Sidebar links redirect to login for unauthenticated users */}
          <Link href="/login" className="flex w-full items-center gap-3 rounded-lg border border-gray-800 bg-ipl-card p-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            <Users size={20} className="text-ipl-accent" />
            Active Lobbies
          </Link>
          <Link href="/login" className="flex w-full items-center gap-3 rounded-lg p-3 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white">
            <History size={20} />
            Past Lobbies
          </Link>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-10">
        
        {/* HEADER AREA */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-wide text-white">Welcome to IPL Arena</h2>
            <p className="mt-2 text-lg text-gray-400">Bragging Rights Start With the Perfect IPL Team.</p>
          </div>
          
          {/* LOGIN BUTTON (Replaces the old Create/Join location) */}
          <div className="flex gap-4">
            <Link 
              href="/login" 
              className="flex items-center gap-2 rounded-xl bg-gray-800 px-6 py-3 font-bold tracking-wide text-white transition-all hover:bg-gray-700 hover:shadow-lg border border-gray-700"
            >
              <LogIn size={18} />
              LOG IN
            </Link>
          </div>
        </div>

        {/* HERO SECTION: BIG CENTERED BUTTONS */}
        <div className="mb-16 flex flex-col items-center justify-center rounded-3xl border border-gray-800 bg-ipl-card/30 p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ipl-gold/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <h3 className="text-3xl font-bold text-white mb-4 relative z-10">Build Your Dream Squad</h3>
          <p className="text-gray-400 mb-10 max-w-xl relative z-10">
            Create a custom tournament for your friends, or use an invite code to join an existing lobby and draft your path to victory.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 relative z-10 w-full justify-center max-w-2xl">
            {/* BIG JOIN BUTTON */}
            <Link 
              href="/login" 
              className="flex-1 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-600 px-8 py-5 text-lg font-black tracking-widest text-white transition-all hover:bg-gray-700 hover:-translate-y-1 hover:shadow-xl"
            >
              JOIN LOBBY
            </Link>
            
            {/* BIG CREATE BUTTON */}
            <Link 
              href="/login" 
              className="flex-1 flex items-center justify-center rounded-xl bg-ipl-gold px-8 py-5 text-lg font-black tracking-widest text-black transition-all hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(234,179,8,0.3)]"
            >
              CREATE LOBBY
            </Link>
          </div>
        </div>

        {/* RULES SECTION (Matching the Dashboard Exactly) */}
        <div className="rounded-2xl border border-gray-800 bg-ipl-card/50 p-8">
          <div className="mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
            <Info className="text-ipl-accent" size={24} />
            <h2 className="text-2xl font-bold text-white">How to Play</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><ShieldAlert size={18}/> <h3 className="font-bold">Game Modes</h3></div>
              <p className="leading-relaxed text-sm text-gray-400">
                <strong className="text-white">Single Match:</strong> Draft 5 players for one specific game.<br/>
                <strong className="mt-1 block text-white">Tournament:</strong> Draft a full 11-player squad for a 5-match window.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Users size={18}/> <h3 className="font-bold">Squad Roles</h3></div>
              <p className="leading-relaxed text-sm text-gray-400">
                Pick from Batsmen (BAT), Bowlers (BOWL), and All-Rounders (AR). Wicketkeepers are classified as Batsmen. No credit limits!
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Star size={18}/> <h3 className="font-bold">The Captain</h3></div>
              <p className="leading-relaxed text-sm text-gray-400">
                Choose one player to be your Captain. Their total fantasy points for the match will be multiplied by <strong className="border-b border-ipl-gold text-white">1.5x</strong>. Choose wisely!
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><Clock size={18}/> <h3 className="font-bold">The Lock</h3></div>
              <p className="leading-relaxed text-sm text-gray-400">
                Watch the toss! You have exactly <strong className="text-white">30 minutes after the toss</strong> to finalize your drafted team before the lobby completely locks.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}