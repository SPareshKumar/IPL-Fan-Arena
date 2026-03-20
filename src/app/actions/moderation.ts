'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/dist/server/web/spec-extension/revalidate'

export async function deleteLobby(lobbyId: string) {
  const supabase = await createClient()
  
  // 1. Delete all drafted squads
  await supabase.from('user_teams').delete().eq('lobby_id', lobbyId)
  
  // 2. Delete all players who joined the lobby
  await supabase.from('lobby_members').delete().eq('lobby_id', lobbyId)
  
  // 3. Finally, safely delete the lobby itself
  const { error } = await supabase.from('lobbies').delete().eq('id', lobbyId)
  
  if (error) return { error: error.message }
  return { success: true }
}

export async function kickPlayer(lobbyId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // 1. Verify the person requesting the kick is actually the lobby creator
  const { data: lobby } = await supabase
    .from('lobbies')
    .select('created_by')
    .eq('id', lobbyId)
    .single()

  if (lobby?.created_by !== user.id) {
    return { error: 'Only the lobby host can kick players.' }
  }

  // 2. Delete the player's drafted team (if they already made one)
  await supabase
    .from('user_teams')
    .delete()
    .eq('lobby_id', lobbyId)
    .eq('user_id', targetUserId)

  // 3. Remove the player from the lobby completely
  const { error: kickError } = await supabase
    .from('lobby_members')
    .delete()
    .eq('lobby_id', lobbyId)
    .eq('user_id', targetUserId)

  if (kickError) return { error: kickError.message }

  // Tell Next.js to refresh the lobby page so the kicked user disappears
  revalidatePath(`/lobby/${lobbyId}`)
  return { success: true }
}