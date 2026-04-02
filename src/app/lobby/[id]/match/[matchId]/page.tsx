import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DraftInterface from '@/src/components/DraftInterface'
import LobbyLeaderboard from '@/src/components/LobbyLeaderboard'

export default async function TournamentMatchPage({ 
  params 
}: { 
  params: Promise<{ id: string, matchId: string }> 
}) {
  const { id: lobbyId, matchId } = await params
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Verify user is in this lobby and get Lobby Name
  const { data: lobby } = await supabase
    .from('lobbies')
    .select('name, lobby_members!inner(user_id)')
    .eq('id', lobbyId)
    .eq('lobby_members.user_id', user.id)
    .single()

  if (!lobby) redirect('/dashboard')

  // 3. Fetch the specific Match data
  const { data: matchInfo } = await supabase
    .from('matches')
    .select('*')
    .eq('id', parseInt(matchId))
    .single()

  if (!matchInfo) redirect(`/lobby/${lobbyId}`)

  // 4. Check if the user has already drafted a team for THIS SPECIFIC MATCH
  const { data: existingTeam } = await supabase
    .from('user_teams')
    .select('id')
    .eq('lobby_id', lobbyId)
    .eq('target_id', matchInfo.id)
    .eq('user_id', user.id)
    .maybeSingle()

  // 5. Fetch players for the draft screen
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team', [matchInfo.team1, matchInfo.team2])
    .order('team') 

  const isMatchUpcoming = matchInfo.status === 'upcoming'
  const shouldShowDraft = !existingTeam && isMatchUpcoming

  return (
    <div className="flex min-h-screen flex-col bg-ipl-bg text-white">
      {/* Mini-Header for the Match Screen */}
      <header className="flex items-center gap-4 border-b border-gray-800 bg-ipl-card p-4 shadow-md">
        <Link href={`/lobby/${lobbyId}`} className="text-gray-400 transition-colors hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{matchInfo.team1} vs {matchInfo.team2}</h1>
          <span className="text-xs font-bold tracking-wider text-ipl-gold uppercase">
            {lobby.name} • Match Leaderboard
          </span>
        </div>
      </header>

      {/* Spectator Warning for late players */}
      {!existingTeam && !isMatchUpcoming && (
        <div className="m-4 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-center text-red-400 font-bold max-w-7xl mx-auto w-full">
          ⚠️ You missed the draft window! You are in spectator mode for this match.
        </div>
      )}

      {/* Render Draft OR Leaderboard seamlessly */}
      {shouldShowDraft ? (
        <DraftInterface 
          players={players || []} 
          lobbyId={lobbyId} 
          targetId={matchInfo.id} 
        />
      ) : (
        <LobbyLeaderboard 
          lobbyId={lobbyId} 
          targetId={matchInfo.id} 
          currentUserId={user.id} 
        />
      )}
    </div>
  )
}