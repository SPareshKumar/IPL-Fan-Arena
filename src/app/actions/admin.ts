'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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