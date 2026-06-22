/**
 * Live-NFL-Daten direkt von ESPNs öffentlichen JSON-APIs (kein API-Key nötig).
 * Server-seitig mit Next.js-Caching (revalidate) — keine Demo-Daten mehr.
 *
 * Endpoints (Stand Juni 2026, verifiziert):
 *  - Scoreboard: site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
 *  - Standings:  site.api.espn.com/apis/v2/sports/football/nfl/standings
 *  - Teams:      site.api.espn.com/apis/site/v2/sports/football/nfl/teams
 *  - News:       site.api.espn.com/apis/site/v2/sports/football/nfl/news
 *  - Gamelog:    site.web.api.espn.com/apis/common/v3/.../athletes/{id}/gamelog
 */

import type { Player } from '@/types';
import { TEAM_QBS, buildFeaturedPlayer } from '@/data/team-qbs';

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const STANDINGS = 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings';
const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/football/nfl';

// ESPN nutzt teils andere Kürzel als unsere team-media-DB
const ABBR_MAP: Record<string, string> = { WSH: 'WAS', LA: 'LAR' };
export const normalizeAbbr = (abbr: string) => ABBR_MAP[abbr] ?? abbr;

// Umkehrung: unser normalisiertes Kürzel -> ESPN-Kürzel (für API-Queries)
const ABBR_MAP_REVERSE: Record<string, string> = { WAS: 'WSH', LAR: 'LA' };
export const denormalizeAbbr = (abbr: string) => ABBR_MAP_REVERSE[abbr] ?? abbr;

async function getJSON<T = any>(url: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ---------------------------------- Teams --------------------------------- */

export type LiveTeam = {
  id: string;          // normalisiertes Kürzel, z.B. 'KC', 'WAS'
  name: string;        // 'Kansas City Chiefs'
  shortName: string;   // 'Chiefs'
  color: string;       // '#E31837'
  altColor: string;
  logo: string | null;
};

export async function getAllTeams(): Promise<LiveTeam[]> {
  const data = await getJSON(`${SITE}/teams?limit=40`, 60 * 60 * 24);
  const list = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return list
    .map((t: any) => t.team)
    .filter(Boolean)
    .map((t: any) => ({
      id: normalizeAbbr(t.abbreviation),
      name: t.displayName,
      shortName: t.name,
      color: t.color ? `#${t.color}` : '#3b82f6',
      altColor: t.alternateColor ? `#${t.alternateColor}` : '#0a0f1c',
      logo: t.logos?.[0]?.href ?? null,
    }))
    .sort((a: LiveTeam, b: LiveTeam) => a.name.localeCompare(b.name));
}

/* -------------------------------- Scoreboard ------------------------------ */

export type LiveGame = {
  id: string;
  season: number | null;
  week: number | null;
  home: { code: string; name: string; score: number; color: string };
  away: { code: string; name: string; score: number; color: string };
  kickoff: string | null;
  state: 'pre' | 'in' | 'post';
  statusText: string;
  venue: string;
};

export async function getScoreboard(): Promise<LiveGame[]> {
  const data = await getJSON(`${SITE}/scoreboard`, 60);
  const events = data?.events ?? [];
  return events
    .map((event: any): LiveGame | null => {
      const comp = event?.competitions?.[0];
      const teams = comp?.competitors ?? [];
      if (teams.length !== 2) return null;
      const side = (ha: string) => {
        const t = teams.find((x: any) => x.homeAway === ha) ?? {};
        return {
          code: normalizeAbbr(t.team?.abbreviation ?? '???'),
          name: t.team?.name ?? '',
          score: Number(t.score ?? 0),
          color: t.team?.color ? `#${t.team.color}` : '#3b82f6',
        };
      };
      return {
        id: event.id,
        season: event.season?.year ?? null,
        week: event.week?.number ?? null,
        home: side('home'),
        away: side('away'),
        kickoff: event.date ?? null,
        state: comp?.status?.type?.state ?? 'pre',
        statusText: comp?.status?.type?.shortDetail ?? '',
        venue: comp?.venue?.fullName ?? '',
      };
    })
    .filter(Boolean) as LiveGame[];
}

/* -------------------------------- Standings ------------------------------- */

export type StandingRow = {
  code: string;
  name: string;
  conference: string;
  wins: number;
  losses: number;
  ties: number;
  winPercent: number;
  record: string;
};

export async function getStandings(): Promise<StandingRow[]> {
  const data = await getJSON(STANDINGS, 60 * 10);
  const rows: StandingRow[] = [];
  for (const conference of data?.children ?? []) {
    const conf = conference.abbreviation ?? conference.name ?? '';
    for (const entry of conference.standings?.entries ?? []) {
      const stats: Record<string, any> = {};
      for (const s of entry.stats ?? []) stats[s.name] = s;
      rows.push({
        code: normalizeAbbr(entry.team?.abbreviation ?? '???'),
        name: entry.team?.displayName ?? '',
        conference: conf,
        wins: Number(stats.wins?.value ?? 0),
        losses: Number(stats.losses?.value ?? 0),
        ties: Number(stats.ties?.value ?? 0),
        winPercent: Number(stats.winPercent?.value ?? 0),
        record: stats.overall?.displayValue ?? '',
      });
    }
  }
  return rows.sort((a, b) => b.winPercent - a.winPercent);
}

/* ----------------------------------- News --------------------------------- */

export type NewsItem = {
  headline: string;
  description: string;
  published: string | null;
  link: string | null;
  image: string | null;
};

export async function getNews(teamAbbr?: string, limit = 6): Promise<NewsItem[]> {
  const url = teamAbbr
    ? `${SITE}/news?team=${encodeURIComponent(teamAbbr)}&limit=${limit}`
    : `${SITE}/news?limit=${limit}`;
  const data = await getJSON(url, 60 * 5);
  return (data?.articles ?? []).map((a: any) => ({
    headline: a.headline ?? '',
    description: a.description ?? '',
    published: a.published ?? null,
    link: a.links?.web?.href ?? null,
    image: a.images?.[0]?.url ?? null,
  }));
}

/* ---------------------------------- Roster -------------------------------- */

/**
 * Kompletter Kader eines Teams (ESPN-Roster-API).
 * Liefert die rohe `athletes`-Struktur (nach Positionsgruppen gegliedert),
 * damit der Client seine bestehende Parsing-Logik weiterverwenden kann.
 */
export async function getRoster(teamAbbr: string): Promise<any[]> {
  const data = await getJSON(
    `${SITE}/teams/${denormalizeAbbr(teamAbbr)}/roster`,
    60 * 60
  );
  return data?.athletes ?? [];
}

/* -------------------------------- QB-Stats -------------------------------- */

const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const toNum = (v: unknown) => {
  const f = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(f) ? f : 0;
};

/**
 * Live-Saisonstatistik des Starting-QB eines Teams (ESPN-Gamelog).
 *
 * Vorgehen:
 *  1) QB-Athlete-ID über den Roster ermitteln (Abgleich mit dem in TEAM_QBS
 *     hinterlegten Starter-Namen — die Roster-Reihenfolge ist nicht verlässlich).
 *  2) Gamelog laden → Saison-Summen + Trend (Passing-Yards der letzten 8 Spiele).
 *
 * Snap-% liegt im Gamelog nicht vor → es bleibt der deterministische Demo-Wert.
 * Bei jedem Fehler wird auf die Demo-Daten (buildFeaturedPlayer) zurückgefallen.
 */
export async function getQbStats(teamAbbr: string): Promise<Player> {
  const fallback = buildFeaturedPlayer(teamAbbr);
  const qbInfo = TEAM_QBS[teamAbbr];
  if (!qbInfo) return fallback;

  try {
    // 1) Passenden QB im Roster finden
    const roster = await getRoster(teamAbbr);
    const qbs: any[] = [];
    for (const grp of roster) {
      for (const a of grp?.items ?? []) {
        if (a?.position?.abbreviation === 'QB') qbs.push(a);
      }
    }
    const target = normName(qbInfo.name);
    const lastName = normName(qbInfo.name.split(' ').pop() ?? '');
    const athlete =
      qbs.find((a) => normName(a.fullName ?? a.displayName ?? '') === target) ??
      qbs.find((a) => normName(a.fullName ?? '').includes(lastName)) ??
      qbs[0];
    const id = athlete?.id;
    if (!id) return fallback;

    // 2) Gamelog laden & parsen
    const log: any = await getJSON(`${WEB}/athletes/${id}/gamelog`, 60 * 30);
    const names: string[] = log?.names ?? [];
    // Bei Playoff-Teilnehmern steht die Postseason an Index 0 -> gezielt die
    // Regular Season wählen (sonst nur die wenigen Playoff-Spiele).
    const seasonTypes: any[] = log?.seasonTypes ?? [];
    const season =
      seasonTypes.find((s) => /regular season/i.test(s?.displayName ?? '')) ??
      [...seasonTypes].sort(
        (a, b) =>
          (b?.categories?.[0]?.events?.length ?? 0) -
          (a?.categories?.[0]?.events?.length ?? 0)
      )[0];
    const cat = season?.categories?.[0];
    if (!names.length || !cat) return fallback;

    const iYds = names.indexOf('passingYards');
    const iTD = names.indexOf('passingTouchdowns');
    const iINT = names.indexOf('interceptions');
    const iQBR = names.indexOf('adjQBR'); // Total QBR (0–100)
    const iRTG = names.indexOf('QBRating'); // Passer Rating (Fallback)

    const totals: string[] = cat.totals ?? [];
    const passYards = Math.round(toNum(totals[iYds]));
    const touchdowns = Math.round(toNum(totals[iTD]));
    const interceptions = Math.round(toNum(totals[iINT]));
    const qbr =
      Math.round((toNum(totals[iQBR]) || toNum(totals[iRTG])) * 10) / 10;

    // Trend: Passing-Yards pro Spiel, nach Woche sortiert, letzte 8
    const evMeta = log?.events ?? {};
    const trend = (cat.events ?? [])
      .map((e: any) => ({
        week: evMeta[e.eventId]?.week ?? 0,
        yds: Math.round(toNum(e.stats?.[iYds])),
      }))
      // 0-Yard-Einträge sind i.d.R. nicht gespielte Spiele (DNP) -> raus
      .filter((g: any) => g.week > 0 && g.yds > 0)
      .sort((a: any, b: any) => a.week - b.week)
      .slice(-8)
      .map((g: any) => g.yds);

    if (!passYards && trend.length === 0) return fallback;

    return {
      id: `${target}-${qbInfo.number}`,
      name: qbInfo.name,
      position: 'QB',
      team: teamAbbr,
      stats: {
        passYards: passYards || fallback.stats.passYards,
        touchdowns: touchdowns || fallback.stats.touchdowns,
        interceptions,
        qbr: qbr || fallback.stats.qbr,
        snapPercent: fallback.stats.snapPercent, // nicht im Gamelog vorhanden
      },
      trend: trend.length >= 2 ? trend : fallback.trend,
    };
  } catch {
    return fallback;
  }
}

/* ---------------------------------- Leaders ------------------------------- */

export type StatLeader = {
  name: string;
  position: string;
  team: string;
  headshot: string | null;
  displayValue: string;
  category: string;
};

export async function getPassingLeader(): Promise<StatLeader | null> {
  const data = await getJSON(`${SITE}/leaders`, 60 * 30);
  const categories = data?.leaders?.categories ?? [];
  const passing =
    categories.find((c: any) => c.name === 'passingYards' || c.name === 'passingLeader') ??
    categories[0];
  const top = passing?.leaders?.[0];
  if (!top?.athlete) return null;
  return {
    name: top.athlete.displayName ?? top.athlete.fullName ?? '',
    position: top.athlete.position?.abbreviation ?? 'QB',
    team: normalizeAbbr(top.athlete.team?.abbreviation ?? top.team?.abbreviation ?? ''),
    headshot: top.athlete.headshot?.href ?? null,
    displayValue: top.displayValue ?? '',
    category: passing?.displayName ?? 'Passing',
  };
}
