import { createClient } from '@/src/lib/supabase/server'
import { Trophy } from 'lucide-react'
import LeaderboardRow from './LeaderboardRow'
import LeaderboardListener from './LeaderboardListener' // <-- The invisible Realtime Listener

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

  // 1. Fetch Drafted Teams (Include bonus_predictions)
  const { data: teams } = await supabase.from('user_teams').select('*').eq('lobby_id', lobbyId).eq('target_id', targetId)

  // 2. Fetch Match Stats AND the Match Bonus Answers
  const { data: stats } = await supabase.from('match_player_stats').select('player_id, fantasy_points').eq('match_id', targetId)
  
  // Fetch the actual bonus answers for this match
  const { data: match } = await supabase.from('matches').select('bonus_answers').eq('id', targetId).single()

  // 3. Fetch User Profiles
  const userIds = teams?.map(t => t.user_id) || []
  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds)

  // 4. Fetch Player Info
  const draftedPlayerIds = Array.from(new Set(teams?.flatMap(t => t.players) || []))
  const { data: allPlayers } = await supabase
    .from('players')
    .select('id, name, team, role')
    .in('id', draftedPlayerIds)

  // Create fast-lookup Maps
  const statsMap = new Map(stats?.map(s => [s.player_id, s.fantasy_points]) || [])
  const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || [])
  const playerMap = new Map(allPlayers?.map(p => [p.id, p]) || [])

  const correctAnswers = match?.bonus_answers || {}

  // 5. THE SCORING ENGINE
  const leaderboard = teams?.map(team => {
    let totalScore = 0

    // A. Calculate Player Points
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

    // B. Calculate Bonus Points on the fly
    const userPreds = team.bonus_predictions || {}
    Object.keys(correctAnswers).forEach(key => {
      const adminAns = String(correctAnswers[key] || '').trim().toLowerCase()
      const userAns = String(userPreds[key] || '').trim().toLowerCase()
      
      if (adminAns !== '' && adminAns === userAns) {
        totalScore += 10
      }
    })

    return {
      userId: team.user_id,
      name: profileMap.get(team.user_id) || 'Unknown Player',
      score: Math.round(totalScore),
      isCurrentUser: team.user_id === currentUserId,
      squad: squadDetails
    }
  }).sort((a, b) => b.score - a.score)

  return (
    <div className="mx-auto w-full max-w-4xl p-6 relative">
      
      {/* --- THE INVISIBLE WEBSOCKET ENGINE --- */}
      <LeaderboardListener lobbyId={lobbyId} targetId={targetId} />

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-ipl-gold flex items-center justify-center gap-3">
          <Trophy size={32} />
          Live Leaderboard
        </h2>
        <p className="text-gray-400 mt-2">Rankings are updated dynamically based on live match stats and bonus predictions.</p>
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