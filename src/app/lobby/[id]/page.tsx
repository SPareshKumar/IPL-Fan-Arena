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

  const { data: lobby, error } = await supabase
    .from('lobbies')
    .select('*, lobby_members!inner(user_id), matches(id, team1, team2)')
    .eq('id', id)
    .eq('lobby_members.user_id', user.id)
    .single()

  if (error || !lobby) redirect('/dashboard')

  // @ts-ignore
  const matchInfo = lobby.matches

  // --- NEW: Check if the user has ALREADY drafted a team ---
  const { data: existingTeam } = await supabase
    .from('user_teams')
    .select('id')
    .eq('lobby_id', lobby.id)
    .eq('user_id', user.id)
    .maybeSingle() // maybeSingle() prevents an error from throwing if no team is found

  // Fetch players for the draft interface
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team', [matchInfo.team1, matchInfo.team2])
    .order('team') 

    // ... existing code where you fetch user and lobby ...

  // 1. Check if the logged-in user is the creator of this lobby
  const isCreator = user?.id === lobby?.created_by

  // 2. Fetch all drafted teams for the Kick list 
  // (Note: ensure 'teams' and 'user_name' match your actual Supabase table/columns!)
  const { data: draftedTeams } = await supabase
    .from('user_teams') 
    .select('id, user_name, user_id')
    .eq('lobby_id', id)

  // ... rest of your existing logic ...

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
        
        <div className="rounded-lg bg-gray-800 px-4 py-2 font-mono text-sm shadow-inner">
          Code: <span className="text-ipl-accent">{lobby.invite_code}</span>
        </div>
      </header>

      {/* THE SMART ROUTER: Render Leaderboard OR Draft Interface */}
      {existingTeam ? (
        <LobbyLeaderboard 
          lobbyId={lobby.id} 
          targetId={matchInfo.id} 
          currentUserId={user.id} 
        />
      ) : (
        <DraftInterface 
          players={players || []} 
          lobbyType={lobby.lobby_type} 
          lobbyId={lobby.id} 
          targetId={matchInfo.id} 
        />
      )}
      {/* ... Your existing Leaderboard or DraftInterface goes here ... */}

      {/* --- CREATOR MODERATION ZONE --- */}
      {isCreator && (
        <div className="mt-12 w-full max-w-7xl mx-auto">
          <LobbyModeration 
            lobbyId={lobby.id} 
            teams={draftedTeams || []} 
          />
        </div>
      )}
    </div>
  )
}