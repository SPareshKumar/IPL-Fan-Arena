'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { toast } from 'sonner'

export default function LobbyListener({ 
  lobbyId, 
  userId 
}: { 
  lobbyId: string; 
  userId: string; 
}) {
  const router = useRouter()

  useEffect(() => {
    // FIX: Instantiate the client INSIDE the effect to prevent infinite re-renders
    const supabase = createClient() 

    // Subscribe to DELETE events on the lobby_members table
    const channel = supabase
      .channel(`kicked-listener-${lobbyId}`) // Added lobbyId to make channel string unique
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
  }, [lobbyId, userId, router]) // Removed supabase from dependencies

  return null // This component is invisible!
}