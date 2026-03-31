import { createClient } from '@supabase/supabase-js';
import { scrapeAndCalculatePoints } from '@/src/lib/scraper';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensures Vercel doesn't cache this API route

export async function GET(request: Request) {
  // ==========================================
  // SECURITY CHECK
  // Note: Comment this block out ONLY when testing locally.
  // Uncomment it before pushing to Vercel for production!
  // ==========================================

  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  // Use Service Role Key to bypass Row Level Security (RLS) for background jobs
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("🤖 [CRON] Starting Auto-Sync Engine...");

  // --- 1. THE AUTO-LIVE CHECK ---
  // Find matches that are automated, upcoming, and start within 20 mins (or have already started)
  const twentyMinsFromNow = new Date(Date.now() + 5 * 60000).toISOString();
  
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('is_automated', true)
    .eq('status', 'upcoming')
    .lte('match_time', twentyMinsFromNow);

  if (upcomingMatches && upcomingMatches.length > 0) {
    for (const match of upcomingMatches) {
      console.log(`🤖 [CRON] Auto-starting match ${match.id}`);
      // Change match and associated lobbies to 'live'
      await supabase.from('matches').update({ status: 'live' }).eq('id', match.id);
      await supabase.from('lobbies').update({ status: 'live' }).eq('target_id', match.id);
    }
  }

  // --- 2. THE AUTO-SCRAPE ENGINE ---
  // Find matches that are automated, live, and have a valid Cricbuzz ID
  const { data: liveMatches } = await supabase
    .from('matches')
    .select('id, team1, team2, cricbuzz_match_id')
    .eq('is_automated', true)
    .eq('status', 'live')
    .not('cricbuzz_match_id', 'is', null);

  if (!liveMatches || liveMatches.length === 0) {
    console.log("🤖 [CRON] No live automated matches to sync right now.");
    return NextResponse.json({ success: true, message: 'No live automated matches found.' });
  }

  for (const match of liveMatches) {
    console.log(`🤖 [CRON] Scraping points for match ${match.id}...`);
    const scrapedData = await scrapeAndCalculatePoints(match.cricbuzz_match_id);
    
    // If the scraper failed or returned null, skip to the next match
    if (!scrapedData) continue;

    const scrapedScores = scrapedData.playerPoints;

    // --- 3. THE AUTO-STOP CHECK ---
    // If the scraper detects the match is over, turn off Auto-Pilot so it stops fetching.
    // The match stays "LIVE" so the Admin can manually add Bonus Points and click "Set Completed".
    if (scrapedData.isComplete) {
      console.log(`🤖 [CRON] Match ${match.id} is OVER (${scrapedData.statusText}). Disengaging Auto-Pilot!`);
      await supabase.from('matches').update({ is_automated: false }).eq('id', match.id);
    }

    // Fetch players for mapping names to DB IDs
    const { data: players } = await supabase
      .from('players')
      .select('id, name, cricbuzz_name')
      .in('team', [match.team1, match.team2]);
      
    if (!players) continue;

    const pointsMap: Record<number, number> = {};
    const upsertData: any[] = [];

    // Map the scraped scores to the specific Player IDs
    players.forEach((player) => {
      const matchName = player.cricbuzz_name || player.name;
      if (scrapedScores[matchName] !== undefined) {
        pointsMap[player.id] = scrapedScores[matchName];
        upsertData.push({ 
          match_id: match.id, 
          player_id: player.id, 
          fantasy_points: scrapedScores[matchName] 
        });
      }
    });

    if (upsertData.length === 0) continue;

    // Save fresh player points to the database
    await supabase.from('match_player_stats').upsert(upsertData, { onConflict: 'match_id, player_id' });

    // --- 4. LIVE LEADERBOARD CALCULATION ---
    // Fetch all drafted teams for this match
    const { data: teams } = await supabase.from('user_teams').select('*').eq('target_id', match.id);
    
    if (teams) {
      for (const team of teams) {
        let total = 0;
        
        // Safely parse the player array depending on how it's stored in the DB
        const playerIds: number[] = Array.isArray(team.players) 
          ? team.players 
          : JSON.parse(team.players || '[]');
        
        // Calculate Base Live Points (Apply Captain 1.5x Multiplier)
        playerIds.forEach(pId => {
          let pts = pointsMap[pId] || 0;
          if (pId === team.captain_id) pts *= 1.5;
          total += pts;
        });

        const liveScore = Math.round(total);

        // Update the live scores so users see them updating in real-time
        await supabase.from('user_teams').update({ points_earned: liveScore }).eq('id', team.id);
        
        // Update the Lobby Standings
        await supabase.from('lobby_members')
          .update({ total_points: liveScore })
          .eq('lobby_id', team.lobby_id)
          .eq('user_id', team.user_id);
      }
    }
    console.log(`🤖 [CRON] Match ${match.id} sync complete.`);
  }

  return NextResponse.json({ success: true, message: 'Full sync complete.' });
}