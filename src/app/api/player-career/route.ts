import { NextRequest, NextResponse } from 'next/server';
import { getAthleteCareer } from '@/lib/nfl-live';

/**
 * Server-seitiger Proxy für die Karrierewerte eines Spielers.
 *
 * ESPN sendet keine CORS-Header, der Browser kann die API also nicht direkt
 * abfragen. Die ID ist die ESPN-Athleten-ID aus dem Roster.
 *
 *   GET /api/player-career?id=3139477
 */
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')?.trim();
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'numeric id required' }, { status: 400 });
  }

  const categories = await getAthleteCareer(id);
  return NextResponse.json(
    { categories },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    }
  );
}
