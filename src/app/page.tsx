import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, go straight to dashboard. If not, go to login.
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}