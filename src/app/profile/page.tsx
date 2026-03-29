import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Trophy, Target, Activity, Hash, Crown, LogOut, User as UserIcon } from 'lucide-react'
import Footer from '@/src/components/Footer'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const handleLogout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/') 
  }

  // 1. Fetch count of hosted lobbies
  const { count: hostedCount } = await supabase
    .from('lobbies')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user.id)

  // 2. THE FIX: Fetch directly from user_teams instead of lobby_members
  // This ensures we are getting the exact calculated team scores for completed matches
  const { data: myTeams } = await supabase
    .from('user_teams')
    .select('lobby_id, points_earned, lobbies!inner(status)')
    .eq('user_id', user.id)
    .eq('lobbies.status', 'completed')

  const lobbyIds = myTeams?.map(t => t.lobby_id) || []

  // 3. Fetch ALL teams in these lobbies to calculate accurate ranks
  let wins = 0
  let totalPoints = 0
  const gamesPlayed = lobbyIds.length

  if (lobbyIds.length > 0) {
    const { data: allTeams } = await supabase
      .from('user_teams')
      .select('lobby_id, user_id, points_earned')
      .in('lobby_id', lobbyIds)

    if (allTeams) {
      lobbyIds.forEach(lId => {
        const teamsInLobby = allTeams.filter(t => t.lobby_id === lId)
        
        // Extract all unique scores in this lobby and sort descending
        const uniqueScores = [...new Set(teamsInLobby.map(t => t.points_earned || 0))].sort((a, b) => b - a)
        
        // Find current user's score
        const myScore = teamsInLobby.find(t => t.user_id === user.id)?.points_earned || 0
        totalPoints += myScore

        // Calculate Dense Rank (1-based index)
        const myRank = uniqueScores.indexOf(myScore) + 1
        
        // A win is 1st, 2nd, or 3rd
        if (myRank > 0 && myRank <= 3) {
          wins++
        }
      })
    }
  }

  // Calculate Derived Stats
  const losses = gamesPlayed - wins
  const winLossRatio = losses === 0 ? (wins > 0 ? 'Perfect' : '0.00') : (wins / losses).toFixed(2)
  const winRate = gamesPlayed === 0 ? 0 : Math.round((wins / gamesPlayed) * 100)
  const avgPoints = gamesPlayed === 0 ? 0 : Math.round(totalPoints / gamesPlayed)

  const avatarUrl = user.user_metadata?.avatar_url
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0]

  return (
    <div className="flex min-h-screen flex-col bg-ipl-bg text-white">
      <header className="flex items-center justify-between border-b border-gray-800 bg-ipl-card p-4 shadow-md px-6 md:px-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white">
          <ArrowLeft size={20} />
          <span className="font-semibold text-sm">Back to Arena</span>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 max-w-5xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-ipl-card/50 p-8 rounded-2xl border border-gray-800">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-ipl-gold shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Profile" fill unoptimized className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400">
                <UserIcon size={40} />
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-wide text-white">{displayName}</h1>
            <p className="text-gray-400 font-mono text-sm mt-1">{user.email}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="text-ipl-accent" /> Your Statistics
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <StatCard icon={<Hash />} label="Games Played" value={gamesPlayed.toString()} />
          <StatCard icon={<Trophy className="text-yellow-400" />} label="Top 3 Finishes" value={wins.toString()} />
          <StatCard icon={<Target className="text-red-400" />} label="Win/Loss Ratio" value={winLossRatio.toString()} subValue={`${winRate}% Win Rate`} />
          <StatCard icon={<Crown className="text-ipl-gold" />} label="Total Points" value={totalPoints.toString()} />
          <StatCard icon={<Activity className="text-blue-400" />} label="Avg Points/Match" value={avgPoints.toString()} />
          <StatCard icon={<UserIcon className="text-purple-400" />} label="Lobbies Hosted" value={(hostedCount || 0).toString()} />
        </div>

        <div className="border-t border-gray-800 pt-8 flex justify-center md:justify-start">
          <form action={handleLogout}>
            <button 
              type="submit" 
              className="flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-900/20 px-8 py-4 font-bold text-red-500 transition-all hover:bg-red-900/40 hover:text-red-400"
            >
              <LogOut size={20} />
              SIGN OUT OF ACCOUNT
            </button>
          </form>
        </div>

      </main>
      <Footer />
    </div>
  )
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue?: string }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-gray-800 bg-ipl-card p-6 shadow-lg transition-all hover:border-gray-600">
      <div className="mb-3 flex flex-col md:flex-row md:items-center gap-2 text-gray-400">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {subValue && <div className="mt-1 text-xs font-semibold text-ipl-accent">{subValue}</div>}
    </div>
  )
}