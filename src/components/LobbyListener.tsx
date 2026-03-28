'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client' // Make sure you have a client Supabase file!
import { toast } from 'sonner'

export default function LobbyListener({ 
  lobbyId, 
  userId 
}: { 
  lobbyId: string; 
  userId: string; 
}) {
  const router = useRouter()
  // Note: Initialize your Supabase client however you do it for client components
  const supabase = createClient() 

  useEffect(() => {
    // Subscribe to DELETE events on the lobby_members table
    const channel = supabase
      .channel('kicked-listener')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${lobbyId}`, // Only listen to THIS lobby
        },
        (payload) => {
          // If the deleted record's user_id matches the current user's ID
          if (payload.old && payload.old.user_id === userId) {
            toast.error("You have been removed from this lobby by the host.")
            router.push('/dashboard')
            router.refresh() // Force the dashboard to fetch the updated lobby list
          }
        }
      )
      .subscribe()

    // Cleanup the subscription when the user leaves the page
    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobbyId, userId, router, supabase])

  return null // This component is invisible!
}