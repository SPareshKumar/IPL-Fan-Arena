'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function lockTeam(
  lobbyId: string, 
  targetId: number, 
  playerIds: number[], 
  captainId: number,
  predictions: Record<string, string> // FIX: Added this 5th argument
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // ==========================================
  // STRICT BACKEND VALIDATION 
  // ==========================================
  
  // 1. Check Player Count
  if (!playerIds || playerIds.length !== 5) {
    return { error: 'Cheating detected: You must select exactly 5 players.' }
  }
  
  // 2. Check Captaincy
  if (!captainId || !playerIds.includes(captainId)) {
    return { error: 'Invalid captain selection.' }
  }

  // 3. FIX: Validate Predictions (Ensure no empty answers are sent)
  const requiredKeys = ['winner', 'sixes', 'pp_king']
  const isMissingPredictions = requiredKeys.some(key => !predictions[key])
  
  if (isMissingPredictions) {
    return { error: 'Please answer all bonus questions before locking.' }
  }
  // ==========================================

  // --- THE ANTI-CHEAT LOCK ---
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', targetId)
    .single()

  if (!match || match.status !== 'upcoming') {
    return { error: 'Draft is locked! The match has already started or finished.' }
  }

  // --- SAVE TO DATABASE ---
  const { error } = await supabase
    .from('user_teams')
    .insert({
      user_id: user.id,
      lobby_id: lobbyId,
      target_id: targetId,
      captain_id: captainId,
      players: playerIds,
      bonus_predictions: predictions // FIX: Save the JSONB predictions object
    })

  if (error) {
    if (error.code === '23505') return { error: 'You have already locked a team for this match!' }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/lobby/${lobbyId}`) // Added to refresh the lobby page itself
  return { success: true }
}