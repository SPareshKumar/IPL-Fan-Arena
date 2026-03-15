'use server'

import { createClient } from '@/src/lib/supabase/server'

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

export async function kickPlayer(lobbyId: string, targetTeamId: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('user_teams')
    .delete()
    .eq('id', targetTeamId)
    .eq('lobby_id', lobbyId)

  if (error) return { error: error.message }
  return { success: true }
}