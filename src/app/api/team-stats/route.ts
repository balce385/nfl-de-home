import { NextRequest, NextResponse } from 'next/server';
import { getQbStats } from '@/lib/nfl-live';

/**
 * Server-seitiger Proxy für die Live-Saisonstatistik des Team-QBs.
 *
 * Der Client kann ESPN nicht direkt aufrufen (kein CORS-Header von ESPN).
 * Diese Route holt die Stats server-seitig über getQbStats() (inkl. Next.js-Cache)
 * und liefert einen fertigen Player als JSON an die Vorschau-Karte.
 *
 *   GET /api/team-stats?team=KC
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get('team')?.toUpperCase();

  if (!team) {
    return NextResponse.json({ error: 'team required' }, { status: 400 });
  }

  const player = await getQbStats(team);

  return NextResponse.json(player, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
