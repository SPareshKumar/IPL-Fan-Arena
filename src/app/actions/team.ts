'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lockTeam(lobbyId: string, playerIds: number[], captainId: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // Note: Since we haven't built the live matches API yet, we will use '1' 
  // as a placeholder Match ID so the database has a target to lock onto.
  const targetId = 1

  const { error } = await supabase
    .from('user_teams')
    .insert({
      user_id: user.id,
      lobby_id: lobbyId,
      target_id: targetId,
      captain_id: captainId,
      players: playerIds // Postgres JSONB handles this array perfectly!
    })

  if (error) {
    // 23505 is the universal Postgres error code for a UNIQUE constraint violation
    if (error.code === '23505') {
      return { error: 'You have already locked a team for this match!' }
    }
    return { error: error.message }
  }

  // Refresh the dashboard so it accurately reflects the locked state
  revalidatePath('/dashboard')
  
  return { success: true }
}