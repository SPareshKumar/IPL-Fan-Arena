import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DraftInterface from '@/src/components/DraftInterface'

export default async function LobbyDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch Lobby details AND the connected Match details!
  const { data: lobby, error } = await supabase
    .from('lobbies')
    .select('*, lobby_members!inner(user_id), matches(id, team1, team2)') // <-- Look at this relational magic!
    .eq('id', id)
    .eq('lobby_members.user_id', user.id)
    .single()
if (error) {
    console.error("DATABASE JOIN ERROR:", error)
  }
  if (error || !lobby) redirect('/dashboard')

  // 2. Extract the match info safely
  // @ts-ignore - Supabase types can be tricky with joined tables
  const matchInfo = lobby.matches

  // 3. Fetch ONLY the players playing in this specific match!
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team', [matchInfo.team1, matchInfo.team2]) // Filter by the two teams
    .order('team') 

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

      <DraftInterface 
        players={players || []} 
        lobbyType={lobby.lobby_type} 
        lobbyId={lobby.id} 
        targetId={matchInfo.id} 
      />
      
    </div>
  )
}