import { createClient } from '@/src/lib/supabase/server'
import TournamentHubClient from './TournamentHubClient'

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

  // 1. Fetch the raw members and their names (IGNORE total_points from the database)
  const { data: rawMembers } = await supabase
    .from('lobby_members')
    .select('user_id, profiles(display_name)')
    .eq('lobby_id', lobbyId)

  // 2. Fetch EVERY single team drafted in this lobby to get their match points
  const { data: allTeams } = await supabase
    .from('user_teams')
    .select('user_id, points_earned')
    .eq('lobby_id', lobbyId)

  // 3. --- THE DYNAMIC CALCULATION ENGINE ---
  const memberMap = new Map();

  // Step A: Initialize everyone with 0 points (So even people who missed a match show up)
  if (rawMembers) {
    rawMembers.forEach(m => {
      memberMap.set(m.user_id, {
        user_id: m.user_id,
        total_points: 0, // Start at zero
        profiles: m.profiles // Keep the name
      });
    });
  }

  // Step B: Sum up all the points from the user_teams!
  if (allTeams) {
    allTeams.forEach(team => {
      if (memberMap.has(team.user_id)) {
        const userObj = memberMap.get(team.user_id);
        userObj.total_points += (team.points_earned || 0); // Add match points to total
      }
    });
  }

  // Step C: Convert back to an array and sort it highest to lowest
  const calculatedMembers = Array.from(memberMap.values()).sort((a, b) => b.total_points - a.total_points);

  // 4. Fetch the Schedule 
  const { data: schedule } = await supabase
    .from('tournament_matches')
    .select('match_id, matches(id, team1, team2, match_time, status)')
    .eq('lobby_id', lobbyId)
    .order('added_at', { ascending: false })

  // Pass the newly calculated dynamic leaderboard to the client!
  return (
    <TournamentHubClient 
      lobbyId={lobbyId}
      lobbyName={lobbyName}
      inviteCode={inviteCode}
      currentUserId={currentUserId}
      isCreator={isCreator}
      members={calculatedMembers} 
      schedule={schedule || []}
    />
  )
}