import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  mergePlayers,
  normalizeName,
  searchEspn,
  type SearchPlayer,
} from '@/lib/player-search';

/**
 * Autovervollständigung: Spieler der ganzen Liga (ESPN + eigene Datenbank).
 * Teams sucht der Browser selbst in der Liste, die er ohnehin hat.
 *
 *   GET /api/search?q=purdy
 */
export async function GET(req: NextRequest) {
  // Nur Buchstaben, Ziffern und Namenszeichen — der Rest wäre im ilike-Muster
  // ein Platzhalter (% _) oder gehört in keinen Spielernamen.
  const q = (new URL(req.url).searchParams.get('q') ?? '')
    .replace(/[^\p{L}\p{N} .'-]/gu, '')
    .trim()
    .slice(0, 40);
  if (q.length < 2) return NextResponse.json({ players: [] });

  const [espn, db] = await Promise.all([searchEspn(q), searchDb(q)]);
  return NextResponse.json(
    { players: mergePlayers(espn, db) },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}

async function searchDb(q: string): Promise<SearchPlayer[]> {
  // "jamarr" soll "Ja'Marr" finden, "aj brown" "A.J. Brown": zwischen den
  // Buchstaben sind Satzzeichen und Leerzeichen erlaubt. normalizeName lässt
  // nur a-z0-9 übrig, das Muster kann also nichts anderes enthalten.
  const pattern = normalizeName(q).replace(/ /g, '').split('').join('[^a-z0-9]*');
  if (!pattern) return [];
  const { data } = await createClient()
    .from('players')
    .select('full_name, position, team_id, jersey_number, espn_id, headshot_url, photo_url')
    .filter('full_name', 'imatch', pattern)
    .limit(20);
  return ((data ?? []) as Record<string, any>[])
    .map((r) => ({
      espnId: r.espn_id ?? null,
      name: r.full_name,
      position: r.position ?? null,
      team: r.team_id ?? null,
      jersey: r.jersey_number != null ? String(r.jersey_number) : null,
      headshot: r.headshot_url ?? r.photo_url ?? null,
      // Ohne Team ist der Spieler Free Agent oder nicht mehr aktiv.
      active: Boolean(r.team_id),
    }))
    .sort((a, b) => Number(b.active) - Number(a.active));
}
