/**
 * Spielersuche für die Autovervollständigung: ESPN-Suche plus eigene Datenbank.
 *
 * ESPN kennt jeden Spieler mit Karriereseite (auch Free Agents und Legenden)
 * und sortiert nach Relevanz; die Datenbank (Sleeper + nflverse) springt ein,
 * wenn ESPN ausfällt, und ergänzt Spieler, die ESPN unter anderem Namen führt.
 */

export type SearchPlayer = {
  /** ESPN-Athleten-ID — Schlüssel für /api/player-career. */
  espnId: string | null;
  name: string;
  position: string | null;
  team: string | null;
  jersey: string | null;
  headshot: string | null;
  active: boolean;
};

const ESPN_SEARCH = 'https://site.web.api.espn.com/apis/common/v3/search';
// ESPN nennt Washington und die Rams anders als unsere teams-Tabelle.
const ABBR: Record<string, string> = { WSH: 'WAS', LA: 'LAR' };

/** Kleinbuchstaben ohne Akzente und Satzzeichen: "Ja'Marr" findet "jamarr". */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tabellenfilter der Stats-Seite. Ein Teamkürzel ("SF") filtert nur nach
 * Team — sonst träfe "NE" auch jeden "Stone". Alles andere sucht im Namen.
 */
export function matchesQuery(
  row: { name: string; team: string | null; pos?: string | null },
  query: string,
  teamIds: Set<string>,
): boolean {
  const q = query.trim();
  if (!q) return true;
  const upper = q.toUpperCase();
  if (teamIds.has(upper)) return row.team?.toUpperCase() === upper;
  if (row.pos && row.pos.toUpperCase() === upper) return true;
  return normalizeName(row.name).includes(normalizeName(q));
}

export function mapEspnItem(i: any): SearchPlayer | null {
  if (!i?.id || !i?.displayName) return null;
  const abbr: string | undefined = i.teamRelationships?.[0]?.core?.abbreviation;
  return {
    espnId: String(i.id),
    name: i.displayName,
    position: i.position?.abbreviation ?? null,
    team: abbr ? (ABBR[abbr] ?? abbr) : null,
    jersey: i.jersey ?? null,
    headshot: i.headshot?.href ?? null,
    active: i.isActive !== false && !i.isRetired,
  };
}

/** ESPN zuerst, Datenbank-Treffer nur, wenn sie noch nicht vorkommen; Aktive vorn. */
export function mergePlayers(espn: SearchPlayer[], db: SearchPlayer[], limit = 8): SearchPlayer[] {
  const seen = new Set<string>();
  const out: SearchPlayer[] = [];
  for (const p of [...espn, ...db]) {
    const keys = [p.espnId && `id:${p.espnId}`, `n:${normalizeName(p.name)}`].filter(Boolean) as string[];
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push(p);
  }
  // stabil: innerhalb aktiv/inaktiv bleibt die Relevanz-Reihenfolge
  return out.sort((a, b) => Number(b.active) - Number(a.active)).slice(0, limit);
}

export async function searchEspn(q: string): Promise<SearchPlayer[]> {
  const url =
    `${ESPN_SEARCH}?query=${encodeURIComponent(q)}&limit=10&mode=prefix` +
    '&type=player&sport=football&league=nfl';
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data?.items ?? []) as any[]).map(mapEspnItem).filter(Boolean) as SearchPlayer[];
  } catch {
    return [];
  }
}
