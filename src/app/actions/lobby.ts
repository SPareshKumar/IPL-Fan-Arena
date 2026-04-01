'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// --- RATE LIMITER SETUP ---
// Create a new ratelimiter that allows 5 requests per 10 seconds.
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 s'),
  analytics: true, // Optional: Allows you to see traffic graphs in Upstash dashboard
})

export async function createLobby(formData: FormData) {
  // 1. RATE LIMIT CHECK: Do this FIRST to protect your database
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(`create_lobby_${ip}`)

  if (!success) {
    return { error: 'You are doing that too fast. Please wait a few seconds.' }
  }

  // 2. Database connection
  const supabase = await createClient()
  
  // 3. Verify the user is actually logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const name = formData.get('name') as string
  const lobbyType = formData.get('type') as string
  const targetId = formData.get('targetId')

  if (!name || name.length < 3) return { error: 'Name must be at least 3 characters.' }

  // --- BACKEND FIX: The 15-Second Cooldown Anti-Spam Check ---
  const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000).toISOString()

  const { data: recentLobby } = await supabase
    .from('lobbies')
    .select('id')
    .eq('created_by', user.id)
    .eq('name', name)
    .gte('created_at', fifteenSecondsAgo)
    .maybeSingle()

  if (recentLobby) {
    return { error: 'You just created a lobby with this exact name! Please wait a moment.' }
  }
  // -------------------------------------------------------------

  // 4. Generate a random 6-character alphanumeric code (e.g., "X7B9WQ")
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // 5. Insert the new lobby into the database
  const { data: lobby, error: lobbyError } = await supabase
    .from('lobbies')
    .insert({
      name,
      lobby_type: lobbyType,
      target_id: parseInt(targetId as string), 
      invite_code: inviteCode,
      created_by: user.id
    })
    .select()
    .single()

  if (lobbyError) return { error: lobbyError.message }

  // 6. Automatically add the creator to the lobby_members table
  const { error: memberError } = await supabase
    .from('lobby_members')
    .insert({
      user_id: user.id,
      lobby_id: lobby.id
    })

  if (memberError) return { error: memberError.message }

  // 7. Tell Next.js to refresh the dashboard page to show the new lobby
  revalidatePath('/dashboard')

  return { success: true, inviteCode }
}


export async function joinLobby(formData: FormData) {
  // 1. RATE LIMIT CHECK
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(`join_lobby_${ip}`)

  if (!success) {
    return { error: 'You are attempting to join too fast. Please slow down.' }
  }

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // Clean the input (remove spaces and make uppercase)
  const inviteCode = (formData.get('code') as string).trim().toUpperCase()

  if (!inviteCode) return { error: 'Please enter a valid code.' }

  // 2. Find the lobby with this exact code
  const { data: lobby, error: lobbyError } = await supabase
    .from('lobbies')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (lobbyError || !lobby) return { error: 'Invalid invite code. Lobby not found.' }

  // 3. Check if the user is ALREADY in this lobby
  const { data: existingMember } = await supabase
    .from('lobby_members')
    .select('user_id')
    .eq('lobby_id', lobby.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) return { error: 'You are already a member of this lobby!' }

  // 4. Add the user to the lobby
  const { error: joinError } = await supabase
    .from('lobby_members')
    .insert({
      user_id: user.id,
      lobby_id: lobby.id
    })

  if (joinError) return { error: joinError.message }

  // 5. Refresh the dashboard
  revalidatePath('/dashboard')

  return { success: true, lobbyName: lobby.name }
}