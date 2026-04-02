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
    const supabase = createClient() 

    const channel = supabase
      .channel(`kicked-listener-${lobbyId}`) 
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'lobby_members',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        (payload) => {
          if (payload.old && payload.old.user_id === userId) {
            
            // THE FIX: Check if the user initiated the leave themselves
            const isVoluntaryLeave = sessionStorage.getItem(`leaving_lobby_${lobbyId}`)
            
            if (isVoluntaryLeave) {
              // They left voluntarily. Clean up the silent flag and stay quiet.
              sessionStorage.removeItem(`leaving_lobby_${lobbyId}`)
              return
            }

            // If no flag was found, it means the Admin actually kicked them!
            toast.error("You have been removed from this lobby by the host.")
            router.push('/dashboard')
            router.refresh() 
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobbyId, userId, router]) 

  return null 
}