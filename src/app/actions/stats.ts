// src/app/actions/stats.ts
'use server'

import { createClient } from '@/src/lib/supabase/server'

export async function getMatchPlayerStats(playerIds: number[]) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('season_stats')
    .select('*, players(name, team, role)')
    .in('player_id', playerIds)

  if (error) {
    console.error("Error fetching stats:", error)
    return []
  }

  return data || []
}