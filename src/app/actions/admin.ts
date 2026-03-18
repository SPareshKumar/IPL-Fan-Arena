'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function createMatch(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 🔒 AUTHORIZATION GATE: Replace this with your actual Google email!
  const ADMIN_EMAIL = 's.paresh2005@gmail.com' 
  
  if (user.email !== ADMIN_EMAIL) {
    return { error: 'Security Alert: You are not authorized to perform admin actions.' }
  }

  const team1 = formData.get('team1') as string
  const team2 = formData.get('team2') as string
  const matchTime = formData.get('matchTime') as string

  if (team1 === team2) return { error: 'A team cannot play against itself!' }
  if (!matchTime) return { error: 'Please set a match time.' }

  const { error } = await supabase
    .from('matches')
    .insert({
      team1,
      team2,
      match_time: new Date(matchTime).toISOString(),
      status: 'upcoming'
    })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }

}

// Fetch the players and any existing scores for a specific match
export async function getMatchRosterAndStats(matchId: number) {
  const supabase = await createClient()
  
  // 1. Get the match details to see who is playing
  const { data: match } = await supabase.from('matches').select('team1, team2').eq('id', matchId).single()
  if (!match) return { players: [], existingStats: [] }

  // 2. Fetch only the players on those two teams
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team', [match.team1, match.team2])
    .order('team')

  // 3. Fetch any points they might already have
  const { data: existingStats } = await supabase
    .from('match_player_stats')
    .select('player_id, fantasy_points')
    .eq('match_id', matchId)

  return { players: players || [], existingStats: existingStats || [] }
}

// Bulk save the typed-in scores
export async function updateManualScores(matchId: number, playerScores: { playerId: number, points: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 🔒 AUTHORIZATION GATE: Update this to your real email again!
  const ADMIN_EMAIL = 's.paresh2005@gmail.com' 
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { error: 'Unauthorized: Admin only.' }
  }

  // Format the data for our bulk upsert
  const upsertData = playerScores.map(score => ({
    match_id: matchId,
    player_id: score.playerId,
    fantasy_points: score.points
  }))

  const { error } = await supabase
    .from('match_player_stats')
    .upsert(upsertData, { onConflict: 'match_id, player_id' })

  if (error) return { error: error.message }

  // Refresh the entire site so Leaderboards instantly update
  revalidatePath('/', 'layout') 
  return { success: true }
}



// --- FUNCTION 4: MATCH LIFECYCLE CONTROLLER & POINTS AGGREGATOR ---
export async function updateMatchStatus(matchId: number, newStatus: string) {
  const supabase = await createClient() 
  const { data: { user } } = await supabase.auth.getUser()
  
  const ADMIN_EMAIL = 's.paresh2005@gmail.com' 
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { error: 'Unauthorized: Admin only.' }
  }

  // 🔥 GOD MODE CLIENT
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Update the match status
  const { error: matchError } = await adminSupabase
    .from('matches')
    .update({ status: newStatus })
    .eq('id', matchId)

  if (matchError) return { error: matchError.message }

  // 2. Cascade status to lobbies
  const { error: lobbyError } = await adminSupabase
    .from('lobbies')
    .update({ status: newStatus })
    .eq('target_id', matchId)

  if (lobbyError) return { error: lobbyError.message }

  // ====================================================================
  // 3. THE MAGIC: AUTOMATIC POINTS CALCULATION (Only if completed)
  // ====================================================================
  if (newStatus === 'completed') {
    // A. Get all player scores for this match
    const { data: playerStats } = await adminSupabase
      .from('match_player_stats')
      .select('player_id, fantasy_points')
      .eq('match_id', matchId)

    // Create a fast lookup dictionary: { playerId: points }
    const pointsMap: Record<number, number> = {}
    playerStats?.forEach(stat => {
      pointsMap[stat.player_id] = stat.fantasy_points || 0
    })

    // B. Get every user's locked team for this match
    const { data: teams } = await adminSupabase
      .from('user_teams')
      .select('id, user_id, lobby_id, players, captain_id')
      .eq('target_id', matchId)

    if (teams && teams.length > 0) {
      // C. Loop through each team and calculate the math
      for (const team of teams) {
        let totalTeamPoints = 0
        
        // Ensure players array is readable (JSONB format in Supabase)
        const draftedPlayers: number[] = Array.isArray(team.players) 
          ? team.players 
          : JSON.parse(team.players as unknown as string || '[]')

        draftedPlayers.forEach(playerId => {
          let pts = pointsMap[playerId] || 0
          
          // Captain gets 2x points!
          if (playerId === team.captain_id) {
            pts *= 2
          }
          totalTeamPoints += pts
        })

        // D. Save the final score to the user_teams table
        await adminSupabase
          .from('user_teams')
          .update({ points_earned: totalTeamPoints })
          .eq('id', team.id)

        // E. Save the final score to the lobby_members table (For the Profile Page!)
        await adminSupabase
          .from('lobby_members')
          .update({ total_points: totalTeamPoints })
          .eq('lobby_id', team.lobby_id)
          .eq('user_id', team.user_id)
      }
    }
  }

  revalidatePath('/', 'layout') 
  return { success: true }
}