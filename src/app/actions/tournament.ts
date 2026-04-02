'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Fetch upcoming matches that HAVEN'T been scheduled in this lobby yet
export async function getAvailableMatches(lobbyId: string) {
  const supabase = await createClient()
  
  // Get matches already in this tournament
  const { data: scheduled } = await supabase.from('tournament_matches').select('match_id').eq('lobby_id', lobbyId)
  const scheduledIds = scheduled?.map(s => s.match_id) || []

  // Fetch upcoming matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, team1, team2, match_time')
    .eq('status', 'upcoming')
    .order('match_time', { ascending: true })

  if (!matches) return []

  // Filter out the ones we already scheduled
  return matches.filter(m => !scheduledIds.includes(m.id))
}

// 2. Add the selected match to the tournament
export async function scheduleTournamentMatch(lobbyId: string, matchId: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tournament_matches')
    .insert({ lobby_id: lobbyId, match_id: matchId })

  if (error) return { error: error.message }

  // Refresh the Tournament Hub instantly
  revalidatePath(`/lobby/${lobbyId}`)
  return { success: true }
}