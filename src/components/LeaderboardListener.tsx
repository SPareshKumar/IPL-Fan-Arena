'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client' // Make sure this points to your client-side Supabase utility

export default function LeaderboardListener({ 
  lobbyId, 
  targetId 
}: { 
  lobbyId: string; 
  targetId: number; 
}) {
  const router = useRouter()
  // Note: We use the client-side Supabase instance here because WebSockets run in the browser!
  const supabase = createClient()

  useEffect(() => {
    // 1. Create a dedicated WebSocket channel for this specific lobby
    const channel = supabase.channel(`leaderboard-${lobbyId}`)
      
      // Listen for Cricbuzz updates (Player points changing)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'match_player_stats', 
        filter: `match_id=eq.${targetId}` 
      }, () => {
        router.refresh() // Silently fetch new server data!
      })
      
      // Listen for Admin updates (Bonus answers being revealed)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'matches', 
        filter: `id=eq.${targetId}` 
      }, () => {
        router.refresh()
      })

      // Listen for latecomers locking their teams
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_teams', 
        filter: `lobby_id=eq.${lobbyId}` 
      }, () => {
        router.refresh()
      })
      
      .subscribe()

    // Cleanup the WebSocket when the user leaves the page
    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobbyId, targetId, router, supabase])

  return null // This component is invisible!
}