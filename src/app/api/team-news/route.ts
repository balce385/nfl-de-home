import { NextRequest, NextResponse } from 'next/server';
import { getNews, denormalizeAbbr } from '@/lib/nfl-live';

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
