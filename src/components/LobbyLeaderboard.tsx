import { createClient } from '@/src/lib/supabase/server'
import { Trophy } from 'lucide-react'
import LeaderboardRow from './LeaderboardRow'

export default async function LobbyLeaderboard({ 
  lobbyId, 
  targetId, 
  currentUserId 
}: { 
  lobbyId: string; 
  targetId: number; 
  currentUserId: string;
}) {
  const supabase = await createClient()

  // 1. Fetch Drafted Teams
  const { data: teams } = await supabase.from('user_teams').select('*').eq('lobby_id', lobbyId)

  // 2. Fetch Match Stats
  const { data: stats } = await supabase.from('match_player_stats').select('player_id, fantasy_points').eq('match_id', targetId)

  // 3. Fetch User Profiles
  const userIds = teams?.map(t => t.user_id) || []
  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds)

  // 4. NEW: Fetch Master Roster (so we know who player ID '5' actually is)
  const { data: allPlayers } = await supabase.from('players').select('id, name, team, role')

  // Create fast-lookup Maps
  const statsMap = new Map(stats?.map(s => [s.player_id, s.fantasy_points]) || [])
  const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || [])
  const playerMap = new Map(allPlayers?.map(p => [p.id, p]) || [])

  // 5. THE ADVANCED SCORING ENGINE
  const leaderboard = teams?.map(team => {
    let totalScore = 0

    // Build the detailed squad array for the UI
    const squadDetails = team.players.map((playerId: number) => {
      const basePoints = statsMap.get(playerId) || 0
      const isCaptain = playerId === team.captain_id
      const finalPoints = isCaptain ? (basePoints * 1.5) : basePoints
      
      totalScore += finalPoints
      const playerInfo = playerMap.get(playerId)

      return {
        id: playerId,
        name: playerInfo?.name || 'Unknown',
        team: playerInfo?.team || 'UNK',
        role: playerInfo?.role || 'UNK',
        isCaptain,
        pointsScored: finalPoints
      }
    })

    return {
      userId: team.user_id,
      name: profileMap.get(team.user_id) || 'Unknown Player',
      score: Math.round(totalScore),
      isCurrentUser: team.user_id === currentUserId,
      squad: squadDetails // Pass the rich squad data down!
    }
  }).sort((a, b) => b.score - a.score)

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-ipl-gold flex items-center justify-center gap-3">
          <Trophy size={32} />
          Live Leaderboard
        </h2>
        <p className="text-gray-400 mt-2">Rankings are updated dynamically based on live match stats.</p>
      </div>

      <div className="space-y-4">
        {leaderboard?.map((player, index) => (
          <LeaderboardRow key={player.userId} player={player} index={index} />
        ))}

        {leaderboard?.length === 0 && (
          <div className="text-center p-10 border border-dashed border-gray-700 rounded-xl text-gray-500">
            No teams have been drafted in this lobby yet!
          </div>
        )}
      </div>
    </div>
  )
}