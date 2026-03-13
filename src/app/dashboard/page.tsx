import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { History, Users, Info, Clock, ShieldAlert, Star } from 'lucide-react'
import CreateLobbyModal from '@/src/components/CreateLobbyModal'
import JoinLobbyModal from '@/src/components/JoinLobbyModal'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // 1. Secure the page
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch the user's active lobbies using an Inner Join!
  // This tells Supabase: "Get all lobbies, but ONLY if the current user is inside the lobby_members table for that lobby."
  const { data: activeLobbies, error } = await supabase
    .from('lobbies')
    .select('*, lobby_members!inner(user_id)')
    .eq('lobby_members.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching lobbies:", error)
  }
  // Fetch upcoming matches for the Create Lobby modal
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('id, team1, team2, match_time')
    .eq('status', 'upcoming')
    .order('match_time', { ascending: true })

  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDEBAR */}
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
          <button className="flex w-full items-center gap-3 rounded-lg border border-gray-800 bg-ipl-card p-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            <Users size={20} className="text-ipl-accent" />
            Active Lobbies
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg p-3 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white">
            <History size={20} />
            Past Lobbies
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Active Lobbies</h2>
            <p className="mt-1 text-gray-400">Select a lobby to draft your team for the next match.</p>
          </div>
          
          <div className="flex gap-4">
            <JoinLobbyModal />
            <CreateLobbyModal matches={upcomingMatches || []} />
          </div>
        </div>

        {/* DYNAMIC LOBBY GRID */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeLobbies?.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-gray-700 p-10 text-center text-gray-400">
              <p>You aren't in any active lobbies right now.</p>
              <p className="mt-2 text-sm">Create a new one or use a friend's invite code to join!</p>
            </div>
          ) : (
            activeLobbies?.map((lobby) => (
              <Link href={`/lobby/${lobby.id}`} key={lobby.id}>
                <div className="flex h-full cursor-pointer flex-col justify-between rounded-xl border border-gray-800 bg-ipl-card p-6 transition-all hover:border-gray-500 hover:shadow-lg">
                  <div>
                    <div className="mb-4 flex items-start justify-between">
                      <h3 className="truncate pr-2 text-xl font-bold">{lobby.name}</h3>
                      <span className="whitespace-nowrap rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-ipl-accent capitalize">
                        {lobby.lobby_type === 'single' ? 'Single Match' : 'Tournament'}
                      </span>
                    </div>
                    <div className="mb-6 space-y-1">
                      <p className="text-sm text-gray-400">
                        Status: <span className="capitalize text-white">{lobby.status}</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Code: <span className="font-mono tracking-widest text-ipl-gold">{lobby.invite_code}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-end border-t border-gray-800/50 pt-4 text-sm">
                    <span className="font-semibold text-ipl-gold transition-colors hover:text-white">Enter Draft &rarr;</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* RULES SECTION (Kept Exactly the Same) */}
        <div className="rounded-2xl border border-gray-800 bg-ipl-card/50 p-8">
          <div className="mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
            <Info className="text-ipl-accent" size={24} />
            <h2 className="text-2xl font-bold">How to Play</h2>
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