'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLobby(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verify the user is actually logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const name = formData.get('name') as string
  const lobbyType = formData.get('type') as string
  const targetId = formData.get('targetId') // <-- Grab the selected match ID

  if (!name || name.length < 3) return { error: 'Name must be at least 3 characters.' }

  // 2. Generate a random 6-character alphanumeric code (e.g., "X7B9WQ")
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // 3. Insert the new lobby into the database
  const { data: lobby, error: lobbyError } = await supabase
    .from('lobbies')
    .insert({
      name,
      lobby_type: lobbyType,
      target_id: parseInt(targetId as string), // <-- Save it as a number
      invite_code: inviteCode,
      created_by: user.id
    })
    .select()
    .single()

  if (lobbyError) return { error: lobbyError.message }

  // 4. Automatically add the creator to the lobby_members table
  const { error: memberError } = await supabase
    .from('lobby_members')
    .insert({
      user_id: user.id,
      lobby_id: lobby.id
    })

  if (memberError) return { error: memberError.message }

  // 5. Tell Next.js to refresh the dashboard page to show the new lobby!
  revalidatePath('/dashboard')

  return { success: true, inviteCode }
}

export async function joinLobby(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  // Clean the input (remove spaces and make uppercase)
  const inviteCode = (formData.get('code') as string).trim().toUpperCase()

  if (!inviteCode) return { error: 'Please enter a valid code.' }

  // 1. Find the lobby with this exact code
  const { data: lobby, error: lobbyError } = await supabase
    .from('lobbies')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single()

  if (lobbyError || !lobby) return { error: 'Invalid invite code. Lobby not found.' }

  // 2. Check if the user is ALREADY in this lobby to prevent duplicate errors
  const { data: existingMember } = await supabase
    .from('lobby_members')
    .select('user_id')
    .eq('lobby_id', lobby.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) return { error: 'You are already a member of this lobby!' }

  // 3. Add the user to the lobby
  const { error: joinError } = await supabase
    .from('lobby_members')
    .insert({
      user_id: user.id,
      lobby_id: lobby.id
    })

  if (joinError) return { error: joinError.message }

  // 4. Refresh the dashboard
  revalidatePath('/dashboard')

  return { success: true, lobbyName: lobby.name }
}