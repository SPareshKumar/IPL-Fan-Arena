import * as cheerio from 'cheerio';

// Adjusted to Official Standard T20 Fantasy Rules
const SCORING = {
  RUN: 1,
  FOUR: 1,
  SIX: 2,
  HALF_CENTURY: 8,   // Fixed from 15
  CENTURY: 16,       // Fixed from 30
  DUCK: -2,
  WICKET: 25,
  THREE_WICKET: 4,   // Fixed from 8
  FOUR_WICKET: 8,    // Fixed from 16
  FIVE_WICKET: 16,   // Fixed from 24
  MAIDEN: 12,        // Standard is usually 12 for T20
  CATCH: 8
};

export async function scrapeAndCalculatePoints(cricbuzzMatchId: string) {
  try {
    const url = `https://www.cricbuzz.com/live-cricket-scorecard/${cricbuzzMatchId}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 0 } 
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);

    const playerPoints: Record<string, number> = {};

    // Prevent double-counting from Cricbuzz's mobile/desktop duplicate HTML
    const processedBatters = new Set<string>();
    const processedBowlers = new Set<string>();

    const addPoints = (name: string, pts: number) => {
      const cleanName = name.replace(/\(.*?\)/g, '').trim();
      if (!playerPoints[cleanName]) playerPoints[cleanName] = 0;
      playerPoints[cleanName] += pts;
    };

    // 1. BATTING & FIELDING
    $('.scorecard-bat-grid').each((_, el) => {
      const nameEl = $(el).find('a.text-cbTextLink');
      if (nameEl.length === 0) return; 

      const rawName = nameEl.text();
      const cleanName = rawName.replace(/\(.*?\)/g, '').trim();

      // If we already parsed this batter (duplicate HTML block), skip them!
      if (processedBatters.has(cleanName)) return;
      processedBatters.add(cleanName);
      
      const cols = $(el).children();
      const runs = parseInt(cols.eq(1).text().trim()) || 0;
      const balls = parseInt(cols.eq(2).text().trim()) || 0;
      const fours = parseInt(cols.eq(3).text().trim()) || 0;
      const sixes = parseInt(cols.eq(4).text().trim()) || 0;
      
      const dismissal = $(el).find('.text-cbTxtSec').text().trim();

      let pts = (runs * SCORING.RUN) + (fours * SCORING.FOUR) + (sixes * SCORING.SIX);
      if (runs >= 100) pts += SCORING.CENTURY;
      else if (runs >= 50) pts += SCORING.HALF_CENTURY;
      if (runs === 0 && balls > 0 && !dismissal.includes('not out')) pts += SCORING.DUCK;

      addPoints(cleanName, pts);

      // Fielding Points (Catches) - We don't deduplicate this because a player can catch multiple times
      if (dismissal.startsWith('c ') && dismissal.includes(' b ')) {
        const catcherName = dismissal.substring(2, dismissal.indexOf(' b ')).trim();
        if (catcherName !== '&') { 
          addPoints(catcherName, SCORING.CATCH);
        }
      }
    });

    // 2. BOWLING
    $('.scorecard-bowl-grid').each((_, el) => {
      const nameEl = $(el).find('a.text-cbTextLink');
      if (nameEl.length === 0) return; 

      const rawName = nameEl.text();
      const cleanName = rawName.replace(/\(.*?\)/g, '').trim();

      // If we already parsed this bowler, skip them!
      if (processedBowlers.has(cleanName)) return;
      processedBowlers.add(cleanName);
      
      const cols = $(el).children();
      const maidens = parseInt(cols.eq(2).text().trim()) || 0;
      const wickets = parseInt(cols.eq(4).text().trim()) || 0;

      let pts = (wickets * SCORING.WICKET) + (maidens * SCORING.MAIDEN);
      if (wickets >= 5) pts += SCORING.FIVE_WICKET;
      else if (wickets >= 4) pts += SCORING.FOUR_WICKET;
      else if (wickets >= 3) pts += SCORING.THREE_WICKET;

      addPoints(cleanName, pts);
    });

    console.log("CORRECTED SCRAPED POINTS:", playerPoints);
    return playerPoints;

  } catch (error) {
    console.error("Scraping failed:", error);
    return null;
  }
}