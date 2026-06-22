import { NextRequest, NextResponse } from 'next/server';
import { getRoster } from '@/lib/nfl-live';

/**
 * Server-seitiger Proxy für den ESPN-Team-Roster.
 *
 * Der Client kann ESPN nicht direkt aufrufen (kein CORS-Header von ESPN).
 * Diese Route holt den Kader server-seitig über getRoster() (inkl. Next.js-Cache)
 * und liefert die rohe `athletes`-Struktur als JSON an den Browser.
 *
 *   GET /api/team-roster?team=KC
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get('team')?.toUpperCase();

  if (!team) {
    return NextResponse.json({ error: 'team required' }, { status: 400 });
  }

  const athletes = await getRoster(team);

  return NextResponse.json(
    { athletes },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
