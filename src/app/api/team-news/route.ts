import { NextRequest, NextResponse } from 'next/server';
import { getNews, denormalizeAbbr } from '@/lib/nfl-live';
import { TEAM_MEDIA } from '@/data/team-media';

const VALID_TEAMS = new Set(TEAM_MEDIA.map((t) => t.teamId));

/**
 * Server-seitiger Proxy für ESPN-Team-News.
 *
 * Der Client kann ESPN nicht direkt aufrufen (kein CORS-Header von ESPN).
 * Diese Route holt die News server-seitig über getNews() (inkl. Next.js-Cache)
 * und liefert sie als JSON an den Browser.
 *
 *   GET /api/team-news?team=KC&limit=5
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get('team')?.toUpperCase() || undefined;

  // Unbekannte Kuerzel liefen vorher als leere Liste mit Status 200 durch —
  // /api/team-overview antwortet in dem Fall mit 404, also hier genauso.
  if (team && !VALID_TEAMS.has(team)) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 });
  }

  const limitParam = Number(searchParams.get('limit'));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 5;

  const espnTeam = team ? denormalizeAbbr(team) : undefined;
  const articles = await getNews(espnTeam, limit);

  return NextResponse.json(
    { articles },
    {
      headers: {
        // Client/Edge dürfen kurz cachen; Server-Cache regelt getNews (revalidate).
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
