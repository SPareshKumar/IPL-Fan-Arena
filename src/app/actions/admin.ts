'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 's.paresh2005@gmail.com'

export async function createMatch(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { error: 'Unauthorized' }
  }

  const team1 = formData.get('team1') as string
  const team2 = formData.get('team2') as string
  const matchTime = formData.get('matchTime') as string

  if (team1 === team2) return { error: 'A team cannot play against itself!' }
  if (!matchTime) return { error: 'Please set a match time.' }

  const { error } = await supabase.from('matches').insert({
    team1,
    team2,
    match_time: new Date(matchTime).toISOString(),
    status: 'upcoming',
    bonus_questions: [
      { id: 'winner', text: 'Who will win the match?' },
      { id: 'sixes', text: 'Who will hit more sixes?' },
      { id: 'pp_king', text: 'Powerplay King (Runs / Wickets+1)?' }
    ]
  })

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function getMatchRosterAndStats(matchId: number) {
  const supabase = await createClient()
  const { data: match } = await supabase.from('matches').select('team1, team2, bonus_answers').eq('id', matchId).single()
  if (!match) return { players: [], existingStats: [], bonusAnswers: {} }

  const { data: players } = await supabase.from('players').select('*').in('team', [match.team1, match.team2]).order('team')
  const { data: existingStats } = await supabase.from('match_player_stats').select('player_id, fantasy_points').eq('match_id', matchId)

  return { 
    players: players || [], 
    existingStats: existingStats || [], 
    bonusAnswers: match.bonus_answers || {} 
  }
}

export async function updateManualScores(matchId: number, playerScores: { playerId: number, points: number }[], bonusAnswers?: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return { error: 'Unauthorized' }

  // 1. Update Player Stats
  const upsertData = playerScores.map(score => ({
    match_id: matchId,
    player_id: score.playerId,
    fantasy_points: score.points
  }))
  await supabase.from('match_player_stats').upsert(upsertData, { onConflict: 'match_id, player_id' })

  // 2. Update Bonus Answers in Match Table
  if (bonusAnswers) {
    const { error: bonusError } = await supabase.from('matches').update({ bonus_answers: bonusAnswers }).eq('id', matchId)
    if (bonusError) console.error("Bonus Update Error:", bonusError)
  }

  revalidatePath('/', 'layout') 
  return { success: true }
}

export async function updateMatchStatus(matchId: number, newStatus: string) {
  const supabase = await createClient() 
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return { error: 'Unauthorized' }

  const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // 1. Update the match status
  await adminSupabase.from('matches').update({ status: newStatus }).eq('id', matchId)
  // 2. Update all associated lobbies
  await adminSupabase.from('lobbies').update({ status: newStatus }).eq('target_id', matchId)

  if (newStatus === 'completed') {
    // A. Fetch latest match data to get the SAVED bonus answers
    const { data: match } = await adminSupabase.from('matches').select('bonus_answers').eq('id', matchId).single()
    const { data: playerStats } = await adminSupabase.from('match_player_stats').select('player_id, fantasy_points').eq('match_id', matchId)
    
    const pointsMap: Record<number, number> = {}
    playerStats?.forEach(stat => { pointsMap[stat.player_id] = stat.fantasy_points || 0 })

    const { data: teams } = await adminSupabase.from('user_teams').select('*').eq('target_id', matchId)

    if (teams && match) {
      const correct = match.bonus_answers || {}

      for (const team of teams) {
        let total = 0
        
        // Safe Player ID Parsing
        const playerIds: number[] = Array.isArray(team.players) ? team.players : JSON.parse(team.players || '[]')
        
        // Core Player Points
        playerIds.forEach(pId => {
          let pts = pointsMap[pId] || 0
          if (pId === team.captain_id) pts *= 1.5
          total += pts
        })

        // --- BULLETPROOF BONUS CALCULATION ---
        const preds = typeof team.bonus_predictions === 'string' 
          ? JSON.parse(team.bonus_predictions || '{}') 
          : (team.bonus_predictions || {})

        Object.keys(correct).forEach(key => {
          const adminAns = String(correct[key] || '').trim().toLowerCase()
          const userPred = String(preds[key] || '').trim().toLowerCase()

          // If both exist and match exactly (case-insensitive)
          if (adminAns !== '' && adminAns === userPred) {
            total += 10
          }
        })

        const finalScore = Math.round(total)

        // D. Update individual team records
        await adminSupabase.from('user_teams').update({ points_earned: finalScore }).eq('id', team.id)
        
        // E. Update lobby standings
        await adminSupabase.from('lobby_members')
          .update({ total_points: finalScore })
          .eq('lobby_id', team.lobby_id)
          .eq('user_id', team.user_id)
      }
    }
  }

  revalidatePath('/', 'layout') 
  return { success: true }
}

export async function deleteMatch(matchId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return { error: 'Unauthorized' }
  const { error } = await supabase.from('matches').delete().eq('id', matchId)
  if (error?.code === '23503') return { error: 'Cannot delete: Lobbies exist.' }
  revalidatePath('/admin')
  return { success: true }
}