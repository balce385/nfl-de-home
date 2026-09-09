import { NextRequest, NextResponse } from 'next/server';
import { getTeamOverview } from '@/lib/nfl-live';

/**
 * Server-seitiger Proxy für die Team-Übersicht (Bilanz, Divisions-Platz,
 * nächstes/letztes Spiel, Spielplan). ESPN sendet keine CORS-Header, der
 * Browser kann die API also nicht direkt abfragen.
 *
 *   GET /api/team-overview?team=KC
 */
export async function GET(req: NextRequest) {
  const team = new URL(req.url).searchParams.get('team')?.toUpperCase();
  if (!team) {
    return NextResponse.json({ error: 'team required' }, { status: 400 });
  }

  const overview = await getTeamOverview(team);
  if (!overview) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 });
  }

  return NextResponse.json(overview, {
    headers: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
