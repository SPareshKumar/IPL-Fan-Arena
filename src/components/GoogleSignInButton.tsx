'use client'

import { createClient } from '@/src/lib/supabase/client'

export default function GoogleSignInButton() {
  const supabase = createClient()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This tells Google where to send the user back to after logging in
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Login failed:', error.message)
    }
  }

  return (
    <button
      onClick={handleLogin}
      className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
    >
      <img src="https://www.google.com/favicon.ico" alt="Google Logo" className="h-5 w-5" />
      Sign in with Google
    </button>
  )
}