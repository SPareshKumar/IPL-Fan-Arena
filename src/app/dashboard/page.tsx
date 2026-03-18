import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { History, Users, Info, Clock, ShieldAlert, Star } from 'lucide-react'
import CreateLobbyModal from '@/src/components/CreateLobbyModal'
import JoinLobbyModal from '@/src/components/JoinLobbyModal'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const handleLogout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/') 
  }

  // FIX 1: Added 'matches(team1, team2, status)' to the query so we get the match info for each lobby!
  const { data: activeLobbies, error } = await supabase
    .from('lobbies')
    .select('*, lobby_members!inner(user_id), matches(team1, team2, status)')
    .eq('lobby_members.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error("Error fetching lobbies:", error)
  
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('id, team1, team2, match_time')
    .eq('status', 'upcoming')
    .order('match_time', { ascending: true })

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      
      {/* LEFT SIDEBAR (Turns into a Top/Nav Bar on Mobile) */}
      <aside className="flex w-full md:w-64 flex-col border-b md:border-b-0 md:border-r border-gray-800 bg-ipl-bg p-4 md:p-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between md:mb-10">
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

          {/* Mobile-Only User Avatar (Replaces Logout) */}
          <div className="md:hidden">
            <Link href="/profile">
              <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-gray-700 transition-all hover:border-ipl-gold">
                {user.user_metadata?.avatar_url ? (
                  <Image src={user.user_metadata.avatar_url} alt="Profile" width={36} height={36} className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400"><Users size={16} /></div>
                )}
              </div>
            </Link>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="mt-4 flex gap-3 overflow-x-auto pb-2 md:mt-0 md:flex-1 md:flex-col md:space-y-3 md:overflow-visible md:pb-0 custom-scrollbar">
          <button className="flex min-w-[150px] md:w-full items-center gap-3 rounded-lg border border-gray-800 bg-ipl-card p-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            <Users size={20} className="text-ipl-accent" />
            Active Lobbies
          </button>
          <button className="flex min-w-[150px] md:w-full items-center gap-3 rounded-lg p-3 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white">
            <History size={20} />
            Past Lobbies
          </button>
        </nav>

        {/* Desktop-Only User Avatar Profile Link (Replaces Logout) */}
        <div className="hidden md:block mt-auto border-t border-gray-800 pt-6">
          <Link href="/profile" className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800/50 group">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-gray-700 transition-all group-hover:border-ipl-gold shadow-md">
              {user.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url} alt="Profile" width={40} height={40} className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400"><Users size={20} /></div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-white transition-colors group-hover:text-ipl-gold">
                {user.user_metadata?.full_name || 'My Profile'}
              </p>
              <p className="text-xs text-gray-400">Profile</p>
            </div>
          </Link>
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
            <div className="flex-1 sm:flex-none"><CreateLobbyModal matches={upcomingMatches || []} /></div>
          </div>
        </div>

        {/* DYNAMIC LOBBY GRID */}
        <div className="mb-12 md:mb-16 grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeLobbies?.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-gray-700 p-6 md:p-10 text-center text-gray-400">
              <p>You aren't in any active lobbies right now.</p>
              <p className="mt-2 text-xs md:text-sm">Create a new one or use a friend's invite code to join!</p>
            </div>
          ) : (
            activeLobbies?.map((lobby) => {
              // Extract the match data safely
              const match = (lobby as any).matches;
              
              return (
                <Link href={`/lobby/${lobby.id}`} key={lobby.id}>
                  <div className="flex h-full cursor-pointer flex-col justify-between rounded-xl border border-gray-800 bg-ipl-card p-5 md:p-6 transition-all hover:border-gray-500 hover:shadow-lg">
                    <div>
                      <div className="mb-4 flex items-start justify-between">
                        <h3 className="truncate pr-2 text-lg md:text-xl font-bold">{lobby.name}</h3>
                        <span className="whitespace-nowrap rounded-full bg-blue-500/10 px-2 md:px-3 py-1 text-[10px] md:text-xs font-semibold text-ipl-accent capitalize">
                          {lobby.lobby_type === 'single' ? 'Single' : 'Tournament'}
                        </span>
                      </div>
                      
                      <div className="mb-4 md:mb-6 space-y-2">
                        {/* THE NEW MATCH STATUS UI */}
                        {match && (
                          <div className="text-xs md:text-sm font-semibold text-gray-300">
                            {match.team1} vs {match.team2}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                          Match:
                          <span className={`capitalize font-bold flex items-center gap-1 ${
                            match?.status === 'live' ? 'text-red-500' : 
                            match?.status === 'completed' ? 'text-green-500' : 
                            'text-blue-400'
                          }`}>
                            {/* Add a pulsing dot if the match is live! */}
                            {match?.status === 'live' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                            {match?.status || 'Unknown'}
                          </span>
                        </div>

                        <div className="text-xs md:text-sm text-gray-400">
                          Code: <span className="font-mono tracking-widest text-ipl-gold">{lobby.invite_code}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-end border-t border-gray-800/50 pt-3 md:pt-4 text-xs md:text-sm">
                      <span className="font-semibold text-ipl-gold transition-colors hover:text-white">Enter Match &rarr;</span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

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
                <strong className="text-white">Single Match:</strong> Draft 5 players for one game.<br/>
                <strong className="mt-1 block text-white">Tournament:</strong> Draft 11 players for a 5-match window.
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

      </main>
    </div>
  )
}