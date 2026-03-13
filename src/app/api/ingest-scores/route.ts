import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// We use the raw Supabase client here because this is a machine-to-machine 
// API call, not a user logged into a browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// IMPORTANT: We need the SERVICE ROLE KEY to bypass RLS for automated background tasks
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! 

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    // 1. SECURITY: The API Key Gatekeeper
    // We check if the incoming request has our secret password
    const authHeader = request.headers.get('Authorization')
    const CRON_SECRET = process.env.CRON_SECRET || 'my-super-secret-admin-key-123'

    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 })
    }

    // 2. PARSE THE DATA: Expecting { matchId: 1, stats: [{ playerId: 5, points: 45 }, ...] }
    const body = await request.json()
    const { matchId, stats } = body

    if (!matchId || !Array.isArray(stats)) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 })
    }

    // 3. FORMAT FOR THE DATABASE
    const upsertData = stats.map((stat: { playerId: number, points: number }) => ({
      match_id: matchId,
      player_id: stat.playerId,
      fantasy_points: stat.points
    }))

    // 4. BATCH UPSERT: Insert new points, or update them if they already exist!
    const { error } = await supabase
      .from('match_player_stats')
      .upsert(upsertData, { 
        onConflict: 'match_id, player_id' // This uses the UNIQUE constraint we made earlier!
      })

    if (error) throw error

    // 5. CACHE INVALIDATION: Tell Next.js to refresh all lobby pages!
    revalidatePath('/lobby/[id]', 'page')

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${stats.length} player scores for match ${matchId}` 
    }, { status: 200 })

  } catch (error: any) {
    console.error('API Ingestion Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}