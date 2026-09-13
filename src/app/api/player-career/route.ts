import { NextRequest, NextResponse } from 'next/server';
import { getAthleteProfile } from '@/lib/nfl-live';
import { getPlayerExtras, NO_EXTRAS } from '@/lib/player-extras';

/**
 * Server-seitiger Proxy für Steckbrief und Karrierewerte eines Spielers.
 *
 * ESPN sendet keine CORS-Header, der Browser kann die API also nicht direkt
 * abfragen. Die ID ist die ESPN-Athleten-ID aus dem Roster. Combine, Draft-
 * Auszeichnungen und Vertrag kommen aus Supabase dazu.
 *
 *   GET /api/player-career?id=3139477
 */
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')?.trim();
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'numeric id required' }, { status: 400 });
  }

  const [profile, extras] = await Promise.all([
    getAthleteProfile(id),
    // Supabase ist Beiwerk: fällt es aus, bleibt die ESPN-Karte vollständig.
    getPlayerExtras(id).catch(() => NO_EXTRAS),
  ]);
  return NextResponse.json(
    { ...profile, extras },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    }
  );
}
