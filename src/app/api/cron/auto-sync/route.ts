import { createClient } from '@supabase/supabase-js';
import { scrapeAndCalculatePoints } from '@/src/lib/scraper';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache'; // <-- 1. Import Next.js Cache control

export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) {
  // ==========================================
  // SECURITY CHECK
  // ==========================================
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use Service Role Key to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("🤖 [CRON] Starting Auto-Sync Engine...");

  // --- 1. THE AUTO-LIVE CHECK ---
  const nowISO = new Date().toISOString();
  
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('is_automated', true)
    .eq('status', 'upcoming')
    .lte('match_time', nowISO);

  if (upcomingMatches && upcomingMatches.length > 0) {
    for (const match of upcomingMatches) {
      console.log(`🤖 [CRON] Auto-starting match ${match.id}`);
      await supabase.from('matches').update({ status: 'live' }).eq('id', match.id);
      await supabase.from('lobbies').update({ status: 'live' }).eq('target_id', match.id);
    }
  }

  // --- 2. THE AUTO-SCRAPE ENGINE ---
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
    
    if (!scrapedData) continue;

    const scrapedScores = scrapedData.playerPoints;

    // --- 3. THE AUTO-STOP CHECK ---
    if (scrapedData.isComplete) {
      console.log(`🤖 [CRON] Match ${match.id} is OVER. Disengaging Auto-Pilot!`);
      await supabase.from('matches').update({ is_automated: false }).eq('id', match.id);
    }

    const { data: players } = await supabase
      .from('players')
      .select('id, name, cricbuzz_name')
      .in('team', [match.team1, match.team2]);
      
    if (!players) continue;

    const pointsMap: Record<number, number> = {};
    const upsertData: any[] = [];

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

    await supabase.from('match_player_stats').upsert(upsertData, { onConflict: 'match_id, player_id' });

    // --- 4. LIVE LEADERBOARD CALCULATION ---
    const { data: teams } = await supabase.from('user_teams').select('*').eq('target_id', match.id);
    
    if (teams && teams.length > 0) {
      for (const team of teams) {
        let total = 0;
        
        const playerIds: number[] = Array.isArray(team.players) 
          ? team.players 
          : JSON.parse(team.players || '[]');
        
        playerIds.forEach(pId => {
          let pts = pointsMap[pId] || 0;
          if (pId === team.captain_id) pts *= 1.5;
          total += pts;
        });

        const liveScore = Math.round(total);

        await supabase.from('user_teams').update({ points_earned: liveScore }).eq('id', team.id);
        
        await supabase.from('lobby_members')
          .update({ total_points: liveScore })
          .eq('lobby_id', team.lobby_id)
          .eq('user_id', team.user_id);
      }

      // --- 5. THE ZERO-COST CACHE PURGE ---
      // Tell Vercel to instantly clear the router cache for every lobby associated with this match
      const uniqueLobbies = Array.from(new Set(teams.map(t => t.lobby_id)));
      uniqueLobbies.forEach(lobbyId => {
        revalidatePath(`/lobby/${lobbyId}`);
      });
      console.log(`🤖 [CRON] Triggered cache revalidation for ${uniqueLobbies.length} lobbies.`);
    }
    
    console.log(`🤖 [CRON] Match ${match.id} sync complete.`);
  }

  return NextResponse.json({ success: true, message: 'Full sync complete.' });
}