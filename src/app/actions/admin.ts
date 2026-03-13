'use server'

import { createClient } from '@/src/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMatch(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 🔒 AUTHORIZATION GATE: Replace this with your actual Google email!
  const ADMIN_EMAIL = 's.paresh2005@gmail.com' 
  
  if (user.email !== ADMIN_EMAIL) {
    return { error: 'Security Alert: You are not authorized to perform admin actions.' }
  }

  const team1 = formData.get('team1') as string
  const team2 = formData.get('team2') as string
  const matchTime = formData.get('matchTime') as string

  if (team1 === team2) return { error: 'A team cannot play against itself!' }
  if (!matchTime) return { error: 'Please set a match time.' }

  const { error } = await supabase
    .from('matches')
    .insert({
      team1,
      team2,
      match_time: new Date(matchTime).toISOString(),
      status: 'upcoming'
    })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}