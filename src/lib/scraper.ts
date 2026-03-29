import * as cheerio from 'cheerio';

const SCORING = {
  RUN: 1, FOUR: 1, SIX: 2, HALF_CENTURY: 8, CENTURY: 16, DUCK: -2,
  WICKET: 25, THREE_WICKET: 4, FOUR_WICKET: 8, FIVE_WICKET: 16, MAIDEN: 12, CATCH: 8
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

    // CHECK IF MATCH IS OVER
    const statusText = $('.text-cbComplete').text().trim();
    const isComplete = statusText.length > 0;

    const playerPoints: Record<string, number> = {};
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

      const cleanName = nameEl.text().replace(/\(.*?\)/g, '').trim();
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

      if (dismissal.startsWith('c ') && dismissal.includes(' b ')) {
        const catcherName = dismissal.substring(2, dismissal.indexOf(' b ')).trim();
        if (catcherName !== '&') addPoints(catcherName, SCORING.CATCH);
      }
    });

    // 2. BOWLING
    $('.scorecard-bowl-grid').each((_, el) => {
      const nameEl = $(el).find('a.text-cbTextLink');
      if (nameEl.length === 0) return; 

      const cleanName = nameEl.text().replace(/\(.*?\)/g, '').trim();
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

    // Return the new object!
    return { playerPoints, isComplete, statusText };

  } catch (error) {
    console.error("Scraping failed:", error);
    return null;
  }
}