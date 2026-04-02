import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LogOut } from 'lucide-react'
import DraftInterface from '@/src/components/DraftInterface'
import LobbyLeaderboard from '@/src/components/LobbyLeaderboard'
import LobbyModeration from '@/src/components/LobbyModeration'
import LobbyListener from '@/src/components/LobbyListener'
import Footer from '@/src/components/Footer'
import LeaveLobbyButton from '@/src/components/LeaveLobbyButton'
import TournamentHub from '@/src/components/TournamentHub' // <-- FIX 1: Removed double slash

export default async function LobbyDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the lobby. Note: We use maybeSingle() on matches because Tournaments might have target_id = null
  const { data: lobby, error } = await supabase
    .from('lobbies')
    .select('*, lobby_members!inner(user_id), matches(id, team1, team2, status)')
    .eq('id', id)
    .eq('lobby_members.user_id', user.id)
    .single()

  if (error || !lobby) redirect('/dashboard')

  const isCreator = user?.id === lobby?.created_by

  // ====================================================================
  // THE TRAFFIC DIRECTOR: Route Tournament Lobbies to the Hub
  // ====================================================================
  if (lobby.lobby_type === 'tournament') {
    return (
      <TournamentHub 
        lobbyId={lobby.id} 
        lobbyName={lobby.name}
        inviteCode={lobby.invite_code}
        currentUserId={user.id} 
        isCreator={isCreator} 
      />
    )
  }

  // @ts-ignore
  const matchInfo = lobby.matches

  const { data: existingTeam } = await supabase
    .from('user_teams')
    .select('id')
    .eq('lobby_id', lobby.id)
    .eq('user_id', user.id)
    .maybeSingle()

  // FIX 3: Added optional chaining (matchInfo?.team1) to prevent fatal crashes if match data is missing
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team', [matchInfo?.team1, matchInfo?.team2])
    .order('team') 

  // FIX 2: Removed the duplicate `isCreator` declaration here

  // ====================================================================
  // THE FIX: Bulletproof way to get participants & their names
  // ====================================================================
  const { data: lobbyMembers } = await supabase
    .from('lobby_members')
    .select('user_id')
    .eq('lobby_id', id)
    .neq('user_id', lobby.created_by) // Hide the creator from the kick list!

  let participants: { user_id: string, user_name: string }[] = []
  
  if (lobbyMembers && lobbyMembers.length > 0) {
    const userIds = lobbyMembers.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    participants = lobbyMembers.map(m => {
      const profile = profiles?.find(p => p.id === m.user_id)
      return {
        user_id: m.user_id,
        user_name: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown Player'
      }
    })
  }
  // ====================================================================


  // --- SMART ROUTER LOGIC ---
  const isMatchUpcoming = matchInfo?.status === 'upcoming'
  const shouldShowDraft = !existingTeam && isMatchUpcoming

  return (
    <div className="flex min-h-screen flex-col bg-ipl-bg text-white">
      {/* THE INVISIBLE REALTIME BOUNCER */}
      <LobbyListener lobbyId={lobby.id} userId={user.id} />
      
      <header className="flex items-center justify-between border-b border-gray-800 bg-ipl-card p-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 transition-colors hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ipl-gold">{lobby.name}</h1>
            <span className="text-xs tracking-wider text-gray-400 uppercase">
              {matchInfo?.team1} vs {matchInfo?.team2} • Single Match
            </span>
          </div>
        </div>
        
        <div className="rounded-lg bg-gray-800 px-4 py-2 font-mono text-sm shadow-inner hidden sm:block">
          Code: <span className="text-ipl-accent">{lobby.invite_code}</span>
        </div>
      </header>

      {/* Spectator Warning for late players */}
      {!existingTeam && !isMatchUpcoming && (
        <div className="m-4 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-center text-red-400 font-bold max-w-7xl mx-auto w-full">
          ⚠️ You missed the draft window! You are in spectator mode for this match.
        </div>
      )}

      {/* THE SMART ROUTER: Render Draft Interface OR Leaderboard */}
      {shouldShowDraft ? (
        <DraftInterface 
          players={players || []} 
          lobbyId={lobby.id} 
          targetId={matchInfo?.id} 
        />
      ) : (
        <LobbyLeaderboard 
          lobbyId={lobby.id} 
          targetId={matchInfo?.id} 
          currentUserId={user.id} 
        />
      )}

      {/* --- CREATOR MODERATION ZONE --- */}
      {isCreator && (
        <div className="mt-8 mb-12 w-full max-w-7xl mx-auto px-4">
          <LobbyModeration 
            lobbyId={lobby.id} 
            teams={participants}
          />
        </div>
      )}

     {/* --- NORMAL USER LEAVE LOBBY BUTTON --- */}
      {!isCreator && (
        <div className="mt-8 mb-12 w-full max-w-7xl mx-auto px-4 flex justify-center md:justify-start">
          <LeaveLobbyButton lobbyId={lobby.id} />
        </div>
      )}
      <Footer />

    </div>
  )
}