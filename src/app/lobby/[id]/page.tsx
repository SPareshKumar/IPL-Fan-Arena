import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DraftInterface from '@/src/components/DraftInterface'
import LobbyLeaderboard from '@/src/components/LobbyLeaderboard'
import LobbyModeration from '@/src/components/LobbyModeration'

export default async function LobbyDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Added 'status' to the matches select query so we know if it's locked
  const { data: lobby, error } = await supabase
    .from('lobbies')
    .select('*, lobby_members!inner(user_id), matches(id, team1, team2, status)')
    .eq('id', id)
    .eq('lobby_members.user_id', user.id)
    .single()

  if (error || !lobby) redirect('/dashboard')

  // @ts-ignore
  const matchInfo = lobby.matches

  const { data: existingTeam } = await supabase
    .from('user_teams')
    .select('id')
    .eq('lobby_id', lobby.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team', [matchInfo.team1, matchInfo.team2])
    .order('team') 

  const isCreator = user?.id === lobby?.created_by

  const { data: draftedTeams } = await supabase
    .from('user_teams') 
    .select('id, user_name, user_id')
    .eq('lobby_id', id)

  // --- SMART ROUTER LOGIC ---
  const isMatchUpcoming = matchInfo.status === 'upcoming'
  const shouldShowDraft = !existingTeam && isMatchUpcoming

  return (
    <div className="flex min-h-screen flex-col bg-ipl-bg text-white">
      
      <header className="flex items-center justify-between border-b border-gray-800 bg-ipl-card p-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 transition-colors hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ipl-gold">{lobby.name}</h1>
            <span className="text-xs tracking-wider text-gray-400 uppercase">
              {matchInfo.team1} vs {matchInfo.team2} • {lobby.lobby_type} Mode
            </span>
          </div>
        </div>
        
        <div className="rounded-lg bg-gray-800 px-4 py-2 font-mono text-sm shadow-inner hidden sm:block">
          Code: <span className="text-ipl-accent">{lobby.invite_code}</span>
        </div>
      </header>

      {/* NEW: Spectator Warning for late players */}
      {!existingTeam && !isMatchUpcoming && (
        <div className="m-4 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-center text-red-400 font-bold max-w-7xl mx-auto w-full">
          ⚠️ You missed the draft window! You are in spectator mode for this match.
        </div>
      )}

      {/* THE SMART ROUTER: Render Draft Interface OR Leaderboard */}
      {shouldShowDraft ? (
        <DraftInterface 
          players={players || []} 
          lobbyType={lobby.lobby_type} 
          lobbyId={lobby.id} 
          targetId={matchInfo.id} 
        />
      ) : (
        <LobbyLeaderboard 
          lobbyId={lobby.id} 
          targetId={matchInfo.id} 
          currentUserId={user.id} 
        />
      )}

      {/* --- CREATOR MODERATION ZONE --- */}
      {isCreator && (
        <div className="mt-8 mb-12 w-full max-w-7xl mx-auto px-4">
          <LobbyModeration 
            lobbyId={lobby.id} 
            teams={draftedTeams || []} 
          />
        </div>
      )}
    </div>
  )
}