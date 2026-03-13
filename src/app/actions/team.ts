'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Added targetId to the parameters!
export async function lockTeam(lobbyId: string, targetId: number, playerIds: number[], captainId: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const { error } = await supabase
    .from('user_teams')
    .insert({
      user_id: user.id,
      lobby_id: lobbyId,
      target_id: targetId, // Now it uses the real match ID!
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