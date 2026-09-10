import { NextRequest, NextResponse } from 'next/server';
import { getGameSituation, getGameSituations } from '@/lib/nfl-live';

/**
 * Live-Spielstand und Drive-Situation, server-seitig von ESPN geholt
 * (ESPN sendet keine CORS-Header, der Browser kann nicht direkt anfragen).
 *
 *   GET /api/game-situation            -> Liste aller Spiele des Spieltags
 *   GET /api/game-situation?event=123  -> ein Spiel inklusive laufendem Drive
 */
export async function GET(req: NextRequest) {
  const event = new URL(req.url).searchParams.get('event') ?? undefined;

  if (!event) {
    const games = await getGameSituations();
    return NextResponse.json({ games }, { headers: liveHeaders });
  }

  const game = await getGameSituation(event);
  if (!game) {
    return NextResponse.json({ error: 'game not found' }, { status: 404 });
  }
  return NextResponse.json(game, { headers: liveHeaders });
}

// Sehr kurzer Cache: bei laufenden Spielen aendert sich die Lage im Sekundentakt.
const liveHeaders = {
  'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
};
