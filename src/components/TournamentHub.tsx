import { createClient } from '@/src/lib/supabase/server'
import TournamentHubClient from './TournamentHubClient' // We are building this next!

export default async function TournamentHub({
  lobbyId,
  lobbyName,
  inviteCode,
  currentUserId,
  isCreator
}: {
  lobbyId: string;
  lobbyName: string;
  inviteCode: string;
  currentUserId: string;
  isCreator: boolean;
}) {
  const supabase = await createClient()

  // 1. Fetch the Master Leaderboard
  const { data: members } = await supabase
    .from('lobby_members')
    .select('user_id, total_points, profiles(display_name)')
    .eq('lobby_id', lobbyId)
    .order('total_points', { ascending: false })

  // 2. Fetch the Schedule 
  const { data: schedule } = await supabase
    .from('tournament_matches')
    .select('match_id, matches(id, team1, team2, match_time, status)')
    .eq('lobby_id', lobbyId)
    .order('added_at', { ascending: false })

  // Pass it all to the interactive client component
  return (
    <TournamentHubClient 
      lobbyId={lobbyId}
      lobbyName={lobbyName}
      inviteCode={inviteCode}
      currentUserId={currentUserId}
      isCreator={isCreator}
      members={members || []}
      schedule={schedule || []}
    />
  )
}