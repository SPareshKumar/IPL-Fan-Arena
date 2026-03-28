import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '../components/Footer'
import { History, Users, Info, Clock, ShieldAlert, Star, LogIn } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  
  // Smart Redirect: If they are already logged in, skip the landing page and go to Dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    // FIX 1: flex-col on mobile, md:flex-row on desktop
    <div className="flex flex-col md:flex-row min-h-screen">
      
      {/* LEFT SIDEBAR (Turns into a Top Bar on Mobile) */}
      <aside className="flex w-full md:w-64 flex-col border-b md:border-b-0 md:border-r border-gray-800 bg-ipl-bg p-4 md:p-6">
        <div className="flex items-center justify-between md:flex-col md:items-start md:mb-10">
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
        </div>
        
        {/* Nav Links: Hidden on mobile to save space, visible on desktop */}
        <nav className="hidden md:flex flex-1 flex-col space-y-3 mt-10">
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
      {/* FIX 2: Dynamic padding based on screen size */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        
        {/* HEADER AREA */}
        {/* FIX 3: Stack title and Login button on small screens */}
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
        {/* FIX 4: Smaller padding and text on mobile, flex-col for the buttons */}
        <div className="mb-12 md:mb-16 flex flex-col items-center justify-center rounded-2xl md:rounded-3xl border border-gray-800 bg-ipl-card/30 p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-ipl-gold/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4 relative z-10">Build Your Dream Squad</h3>
          <p className="text-sm md:text-base text-gray-400 mb-8 md:mb-10 max-w-xl relative z-10">
            Create a custom tournament for your friends, or use an invite code to join an existing lobby and draft your path to victory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 relative z-10 w-full justify-center max-w-2xl">
            {/* BIG JOIN BUTTON */}
            <Link 
              href="/login" 
              className="flex-1 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-600 px-6 py-4 md:px-8 md:py-5 text-base md:text-lg font-black tracking-widest text-white transition-all hover:bg-gray-700 hover:-translate-y-1 hover:shadow-xl"
            >
              JOIN LOBBY
            </Link>
            
            {/* BIG CREATE BUTTON */}
            <Link 
              href="/login" 
              className="flex-1 flex items-center justify-center rounded-xl bg-ipl-gold px-6 py-4 md:px-8 md:py-5 text-base md:text-lg font-black tracking-widest text-black transition-all hover:bg-yellow-400 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(234,179,8,0.3)]"
            >
              CREATE LOBBY
            </Link>
          </div>
        </div>

        {/* RULES SECTION */}
        {/* FIX 5: Adjust grid and padding for mobile readability */}
        <div className="rounded-xl md:rounded-2xl border border-gray-800 bg-ipl-card/50 p-5 md:p-8">
          <div className="mb-4 md:mb-6 flex items-center gap-2 border-b border-gray-800 pb-3 md:pb-4">
            <Info className="text-ipl-accent w-5 h-5 md:w-6 md:h-6" />
            <h2 className="text-xl md:text-2xl font-bold text-white">How to Play</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 text-ipl-gold"><ShieldAlert size={16} className="md:w-[18px] md:h-[18px]"/> <h3 className="font-bold text-sm md:text-base text-white">Game Modes</h3></div>
              <p className="leading-relaxed text-xs md:text-sm text-gray-400">
                <strong className="text-white">Single Match:</strong> Draft 5 players for one game.<br/>
                <strong className="mt-1 block text-white">Tournament:</strong> Draft 11 players for a 5-match window.
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