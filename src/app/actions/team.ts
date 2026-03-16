'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lockTeam(lobbyId: string, targetId: number, playerIds: number[], captainId: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // --- THE ANTI-CHEAT LOCK ---
  // 1. Check the real-time status of the match in the database
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', targetId)
    .single()

  // 2. If it's not upcoming, reject the draft immediately!
  if (!match || match.status !== 'upcoming') {
    return { error: 'Draft is locked! The match has already started or finished.' }
  }
  // ----------------------------

  const { error } = await supabase
    .from('user_teams')
    .insert({
      user_id: user.id,
      lobby_id: lobbyId,
      target_id: targetId,
      captain_id: captainId,
      players: playerIds
    })

  if (error) {
    if (error.code === '23505') return { error: 'You have already locked a team for this match!' }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}