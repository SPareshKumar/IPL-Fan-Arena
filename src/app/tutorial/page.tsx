import Link from 'next/link'
import { ArrowLeft, PlayCircle } from 'lucide-react'
import TutorialSection from '@/src/components/TutorialSection'
import Footer from '@/src/components/Footer'
import { createClient } from '@/src/lib/supabase/server' // NEW: Import Supabase

const tutorials = [
  {
    id: 'lobby-creation',
    title: '1. Creating & Joining Lobbies',
    description: 'Start your fantasy journey by creating a custom lobby or using an invite code to join your friends. Choose between a Single Match shootout or a full Tournament group.',
    videoSrc: '/videos/lobby-creation.mp4'
  },
  {
    id: 'draft-and-stats',
    title: '2. Drafting & Player Stats',
    description: 'Build your ultimate 5-player squad. Use the new Player Stats panel to scout top performers, make data-driven decisions, and don\'t forget to tap the \'C\' to lock in your Captain for 1.5x points!',
    videoSrc: '/videos/draft-and-stats.mp4'
  },
  {
    id: 'tournament-admin',
    title: '3. Tournament Management',
    description: 'As a lobby host, you control the schedule. Schedule upcoming matches, manage your group\'s master leaderboard, and keep the competition fierce across the entire IPL season.',
    videoSrc: '/videos/tournament-admin.mp4'
  }
]

// NEW: Make the function async to check auth state on the server
export default async function TutorialPage() {
  // NEW: Check if the user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // NEW: Dynamically set the route and text!
  const backRoute = user ? '/dashboard' : '/'
  const backText = user ? 'Back to Dashboard' : 'Back to Home'

  return (
    <div className="flex min-h-screen flex-col bg-ipl-bg text-white">
      <style dangerouslySetInnerHTML={{__html: `html { scroll-behavior: smooth; }`}} />

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-ipl-card/90 backdrop-blur-md p-4 shadow-md px-6 md:px-10">
        <div className="flex items-center gap-4">
          {/* NEW: Use the dynamic route and text here */}
          <Link href={backRoute} className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white">
            <ArrowLeft size={20} />
            <span className="font-semibold text-sm">{backText}</span>
          </Link>
          <div className="h-6 w-px bg-gray-800 hidden md:block"></div>
          <h1 className="text-xl font-black text-white hidden md:flex items-center gap-2">
            <PlayCircle size={20} className="text-ipl-gold" /> HOW TO PLAY
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row max-w-7xl mx-auto w-full">
        
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-800 bg-ipl-bg/50 md:sticky md:top-[73px] md:h-[calc(100vh-73px)] overflow-y-auto p-4 md:p-8 z-40 backdrop-blur-sm">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 hidden md:block">Jump To Demo</h2>
          <nav className="flex md:flex-col gap-3 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            {tutorials.map((tut, idx) => (
              <a
                key={tut.id}
                href={`#${tut.id}`}
                className="flex-none md:flex-auto group flex items-center gap-3 rounded-xl border border-gray-800 bg-ipl-card p-4 transition-all hover:border-ipl-gold hover:bg-ipl-gold/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-gray-400 group-hover:bg-ipl-gold group-hover:text-black transition-colors">
                  {idx + 1}
                </span>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors whitespace-nowrap md:whitespace-normal">
                  {tut.title.split('. ')[1]}
                </span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-10 lg:p-16">
          <div className="mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Master the Arena</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Watch these quick guides to learn how to draft your dream team, manage your lobbies, and dominate the leaderboard.
            </p>
          </div>

          <div className="flex flex-col gap-16 md:gap-32 pb-32">
            {tutorials.map((tut) => (
              <TutorialSection
                key={tut.id}
                id={tut.id}
                title={tut.title}
                description={tut.description}
                videoSrc={tut.videoSrc}
              />
            ))}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}