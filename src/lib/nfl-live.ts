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
import { TEAM_FACTS } from '@/data/team-facts';

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const STANDINGS = 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings';
const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports/football/nfl';
// Die Core-API liefert Stammdaten, die in der Site-API fehlen: Cheftrainer,
// Spielfeldbelag und Dach des Stadions.
const CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl';

// ESPN nutzt teils andere Kürzel als unsere team-media-DB
const ABBR_MAP: Record<string, string> = { WSH: 'WAS', LA: 'LAR' };
export const normalizeAbbr = (abbr: string) => ABBR_MAP[abbr] ?? abbr;

// Umkehrung: unser normalisiertes Kürzel -> ESPN-Kürzel (für API-Queries)
const ABBR_MAP_REVERSE: Record<string, string> = { WAS: 'WSH', LAR: 'LA' };
export const denormalizeAbbr = (abbr: string) => ABBR_MAP_REVERSE[abbr] ?? abbr;

const kickoffFmt = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});

/**
 * Statuszeile eines Spiels in deutscher Schreibweise.
 *
 * ESPN liefert in `shortDetail` bei angesetzten Spielen die US-Ortszeit
 * ("9/13 - 1:00 PM EDT"). Fuer ein deutschsprachiges Publikum wird daraus die
 * Anstosszeit in Europe/Berlin. Laufende und beendete Spiele behalten den
 * ESPN-Text ("Q3 5:12", "Final"), der ist sprachneutral genug.
 */
export function gameStatusText(
  state: string | undefined,
  shortDetail: string | undefined,
  kickoff: string | null | undefined,
): string {
  if (state === 'pre' && kickoff) {
    const d = new Date(kickoff);
    if (!Number.isNaN(d.getTime())) return `${kickoffFmt.format(d)} Uhr`;
  }
  return shortDetail ?? '';
}

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
        statusText: gameStatusText(
          comp?.status?.type?.state,
          comp?.status?.type?.shortDetail,
          event.date,
        ),
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
  pointsFor: number;
  pointsAgainst: number;
  /** Punktedifferenz — sagt am Saisonanfang mehr aus als die Bilanz. */
  differential: number;
};

export async function getStandings(): Promise<StandingRow[]> {
  const data = await getJSON(STANDINGS, 60 * 10);
  const rows: StandingRow[] = [];
  for (const conference of data?.children ?? []) {
    const conf = conference.abbreviation ?? conference.name ?? '';
    for (const entry of conference.standings?.entries ?? []) {
      const stats: Record<string, any> = {};
      for (const s of entry.stats ?? []) stats[s.name] = s;
      const pointsFor = Number(stats.pointsFor?.value ?? 0);
      const pointsAgainst = Number(stats.pointsAgainst?.value ?? 0);
      rows.push({
        code: normalizeAbbr(entry.team?.abbreviation ?? '???'),
        name: entry.team?.displayName ?? '',
        conference: conf,
        wins: Number(stats.wins?.value ?? 0),
        losses: Number(stats.losses?.value ?? 0),
        ties: Number(stats.ties?.value ?? 0),
        winPercent: Number(stats.winPercent?.value ?? 0),
        record: stats.overall?.displayValue ?? '',
        pointsFor,
        pointsAgainst,
        differential: Number(stats.differential?.value ?? pointsFor - pointsAgainst),
      });
    }
  }
  // Bei gleicher Bilanz entscheidet die Punktedifferenz — am ersten Spieltag
  // stehen sonst 30 Teams mit 0-0 in zufaelliger Reihenfolge.
  return rows.sort((a, b) => b.winPercent - a.winPercent || b.differential - a.differential);
}

/* ----------------------------------- News --------------------------------- */

export type NewsItem = {
  headline: string;
  description: string;
  published: string | null;
  link: string | null;
  image: string | null;
};

/** ESPN liefert vereinzelt http-Links; die Seite selbst laeuft nur ueber https. */
const toHttps = (url: string | null | undefined) =>
  url ? url.replace(/^http:\/\//i, 'https://') : null;

export async function getNews(teamAbbr?: string, limit = 6): Promise<NewsItem[]> {
  const url = teamAbbr
    ? `${SITE}/news?team=${encodeURIComponent(teamAbbr)}&limit=${limit}`
    : `${SITE}/news?limit=${limit}`;
  const data = await getJSON(url, 60 * 5);
  return (data?.articles ?? []).map((a: any) => ({
    headline: a.headline ?? '',
    description: a.description ?? '',
    published: a.published ?? null,
    link: toHttps(a.links?.web?.href),
    image: toHttps(a.images?.[0]?.url),
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

    // "2025 Regular Season" -> "2025". Vor dem ersten Spieltag der neuen Saison
    // liefert ESPN noch die Vorsaison; das muss im UI sichtbar sein.
    const seasonYear = /(\d{4})/.exec(season?.displayName ?? '')?.[1];

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
      season: seasonYear,
    };
  } catch {
    return fallback;
  }
}

/* --------------------------- Live-Spielsituation -------------------------- */

export type SituationSide = {
  code: string;
  name: string;
  score: number;
  color: string;
  logo: string | null;
  timeouts: number | null;
};

export type GameSituation = {
  eventId: string;
  shortName: string;
  state: 'pre' | 'in' | 'post';
  statusText: string;
  period: number | null;
  clock: string | null;
  venue: string;
  kickoff: string | null;
  home: SituationSide;
  away: SituationSide;
  /** Kürzel des Teams mit dem Ball, solange das Spiel läuft. */
  possession: string | null;
  down: number | null;
  distance: number | null;
  /** Yard-Linie laut ESPN (0–50 vom jeweiligen Feldende aus gezählt). */
  yardLine: number | null;
  downDistanceText: string | null;
  possessionText: string | null;
  isRedZone: boolean;
  /** Siegwahrscheinlichkeit des Heimteams in Prozent. */
  homeWinPercent: number | null;
  lastPlay: string | null;
  drive: { team: string | null; start: string | null; yards: number | null; plays: number | null } | null;
};

function toSide(c: any): SituationSide {
  return {
    code: normalizeAbbr(c?.team?.abbreviation ?? '???'),
    name: c?.team?.shortDisplayName ?? c?.team?.name ?? '',
    score: Number(c?.score ?? 0),
    color: c?.team?.color ? `#${c.team.color}` : '#3b82f6',
    logo: c?.team?.logo ?? null,
    timeouts: null,
  };
}

/** Baut die Situation aus einem Scoreboard-Event. */
function buildSituation(event: any): GameSituation | null {
  const comp = event?.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  if (competitors.length !== 2) return null;

  const homeC = competitors.find((c: any) => c.homeAway === 'home') ?? competitors[0];
  const awayC = competitors.find((c: any) => c.homeAway === 'away') ?? competitors[1];
  const home = toSide(homeC);
  const away = toSide(awayC);

  const s = comp.situation;
  home.timeouts = Number.isFinite(Number(s?.homeTimeouts)) ? Number(s.homeTimeouts) : null;
  away.timeouts = Number.isFinite(Number(s?.awayTimeouts)) ? Number(s.awayTimeouts) : null;

  // ESPN nennt beim Ballbesitz die numerische Team-ID, nicht das Kürzel.
  const possessionId = s?.possession != null ? String(s.possession) : null;
  const possession =
    possessionId === String(homeC?.team?.id)
      ? home.code
      : possessionId === String(awayC?.team?.id)
      ? away.code
      : null;

  const winPct = s?.lastPlay?.probability?.homeWinPercentage;

  return {
    eventId: String(event.id),
    shortName: event.shortName ?? `${away.code} @ ${home.code}`,
    state: comp?.status?.type?.state ?? 'pre',
    statusText: gameStatusText(
      comp?.status?.type?.state,
      comp?.status?.type?.shortDetail,
      event.date,
    ),
    period: comp?.status?.period ?? null,
    clock: comp?.status?.displayClock ?? null,
    venue: comp?.venue?.fullName ?? '',
    kickoff: event.date ?? null,
    home,
    away,
    possession,
    down: Number.isFinite(Number(s?.down)) ? Number(s.down) : null,
    distance: Number.isFinite(Number(s?.distance)) ? Number(s.distance) : null,
    yardLine: Number.isFinite(Number(s?.yardLine)) ? Number(s.yardLine) : null,
    downDistanceText: s?.downDistanceText ?? null,
    possessionText: s?.possessionText ?? null,
    isRedZone: Boolean(s?.isRedZone),
    homeWinPercent: Number.isFinite(Number(winPct)) ? Number(winPct) * 100 : null,
    lastPlay: s?.lastPlay?.text ?? null,
    drive: null,
  };
}

/** Alle Spiele des aktuellen Spieltags mit ihrer Situation. */
export async function getGameSituations(): Promise<GameSituation[]> {
  // Kurzer Cache: bei laufenden Spielen zaehlt jede Sekunde.
  const data = await getJSON(`${SITE}/scoreboard`, 15);
  return ((data?.events ?? []).map(buildSituation).filter(Boolean) as GameSituation[]).sort(
    (a, b) => {
      // Laufende Spiele zuerst, dann anstehende, dann beendete.
      const rank = (g: GameSituation) => (g.state === 'in' ? 0 : g.state === 'pre' ? 1 : 2);
      return rank(a) - rank(b) || (a.kickoff ?? '').localeCompare(b.kickoff ?? '');
    }
  );
}

/**
 * Situation eines Spiels inklusive laufendem Drive.
 * Die Drive-Daten stehen nur im Summary-Endpunkt, deshalb ein zweiter Aufruf —
 * aber nur, wenn das Spiel tatsaechlich laeuft.
 */
export async function getGameSituation(eventId?: string): Promise<GameSituation | null> {
  const all = await getGameSituations();
  const game = eventId ? all.find((g) => g.eventId === eventId) ?? null : all[0] ?? null;
  if (!game || game.state !== 'in') return game;

  const summary = await getJSON(`${SITE}/summary?event=${encodeURIComponent(game.eventId)}`, 15);
  const cur = summary?.drives?.current;
  if (cur) {
    game.drive = {
      team: cur.team?.abbreviation ? normalizeAbbr(cur.team.abbreviation) : null,
      start: cur.start?.text ?? null,
      yards: Number.isFinite(Number(cur.yards)) ? Number(cur.yards) : null,
      plays: Number.isFinite(Number(cur.offensivePlays)) ? Number(cur.offensivePlays) : null,
    };
  }
  return game;
}

/* ------------------------------ Team-Übersicht ---------------------------- */

export type TeamGame = {
  week: number | null;
  date: string | null;
  state: 'pre' | 'in' | 'post';
  opponent: string;        // normalisiertes Kürzel des Gegners
  opponentName: string;
  opponentLogo: string | null;
  home: boolean;
  teamScore: number | null;
  opponentScore: number | null;
  venue: string;
};

export type TeamOverview = {
  id: string;
  name: string;
  shortName: string;
  logo: string | null;
  color: string;
  /** z.B. "1st in AFC West" */
  standingSummary: string;
  record: string;          // "0-0"
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  next: TeamGame | null;
  last: TeamGame | null;
  upcoming: TeamGame[];    // die nächsten Spiele inkl. `next`
};

/** Wandelt ein ESPN-Schedule-Event in unser TeamGame um (aus Sicht von `teamAbbr`). */
function toTeamGame(event: any, teamAbbr: string): TeamGame | null {
  const comp = event?.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  if (competitors.length !== 2) return null;

  const espnCode = denormalizeAbbr(teamAbbr);
  const me = competitors.find(
    (c: any) => c.team?.abbreviation === espnCode || normalizeAbbr(c.team?.abbreviation ?? '') === teamAbbr
  );
  const other = competitors.find((c: any) => c !== me);
  if (!me || !other) return null;

  const score = (c: any) => {
    const raw = c?.score?.value ?? c?.score?.displayValue ?? c?.score;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  return {
    week: event.week?.number ?? null,
    date: event.date ?? null,
    state: comp?.status?.type?.state ?? 'pre',
    opponent: normalizeAbbr(other.team?.abbreviation ?? '???'),
    opponentName: other.team?.displayName ?? other.team?.name ?? '',
    opponentLogo: other.team?.logos?.[0]?.href ?? other.team?.logo ?? null,
    home: me.homeAway === 'home',
    teamScore: score(me),
    opponentScore: score(other),
    venue: comp?.venue?.fullName ?? '',
  };
}

/**
 * Alles, was die Startseiten-Kacheln über ein Team brauchen: Bilanz,
 * Divisions-Platzierung, nächstes und letztes Spiel sowie der Spielplan.
 * Zwei ESPN-Aufrufe (Team + Schedule), beide server-seitig gecacht.
 */
export async function getTeamOverview(teamAbbr: string): Promise<TeamOverview | null> {
  const code = denormalizeAbbr(teamAbbr);
  const [teamData, schedData] = await Promise.all([
    getJSON(`${SITE}/teams/${code}`, 60 * 15),
    getJSON(`${SITE}/teams/${code}/schedule`, 60 * 60),
  ]);

  const t = teamData?.team;
  if (!t) return null;

  const total = (t.record?.items ?? []).find((i: any) => i.type === 'total') ?? t.record?.items?.[0];
  const stat = (name: string) => {
    const s = (total?.stats ?? []).find((x: any) => x.name === name);
    const n = Number(s?.value);
    return Number.isFinite(n) ? n : 0;
  };

  const games = (schedData?.events ?? [])
    .map((e: any) => toTeamGame(e, teamAbbr))
    .filter(Boolean) as TeamGame[];

  const played = games.filter((g) => g.state === 'post');
  const upcoming = games.filter((g) => g.state !== 'post');

  return {
    id: teamAbbr,
    name: t.displayName ?? '',
    shortName: t.name ?? '',
    logo: t.logos?.[0]?.href ?? null,
    color: t.color ? `#${t.color}` : '#3b82f6',
    standingSummary: t.standingSummary ?? '',
    record: total?.summary ?? '0-0',
    wins: stat('wins'),
    losses: stat('losses'),
    ties: stat('ties'),
    pointsFor: stat('pointsFor'),
    pointsAgainst: stat('pointsAgainst'),
    next: upcoming[0] ?? null,
    last: played[played.length - 1] ?? null,
    upcoming: upcoming.slice(0, 5),
  };
}

/* ------------------------------ Team-Steckbrief --------------------------- */

export type TeamProfile = {
  /** Heimstadion mit Sitz und Bauart. */
  venue: {
    name: string;
    location: string;
    /** Naturrasen statt Kunstrasen. */
    grass: boolean;
    /** Geschlossenes oder schliessbares Dach. */
    indoor: boolean;
    capacity: number | null;
  };
  /** Cheftrainer; live von ESPN, weil er waehrend der Saison wechseln kann. */
  coach: { name: string; experience: number | null; headshot: string | null } | null;
  founded: number | null;
  website: string;
};

/** Holt den Cheftrainer ueber die zwei Core-API-Ebenen (Liste -> Person). */
async function getHeadCoach(espnTeamId: string): Promise<TeamProfile['coach']> {
  const list = await getJSON(`${CORE}/teams/${espnTeamId}/coaches?lang=en&region=us`, 60 * 60 * 24);
  const ref: string | undefined = list?.items?.[0]?.$ref;
  if (!ref) return null;

  // Die Referenzen kommen als http-Links; die Seite laeuft nur ueber https.
  const coach = await getJSON(toHttps(ref) as string, 60 * 60 * 24);
  const name = [coach?.firstName, coach?.lastName].filter(Boolean).join(' ').trim();
  if (!name) return null;

  const exp = Number(coach?.experience);
  return {
    name,
    experience: Number.isFinite(exp) && exp > 0 ? exp : null,
    headshot: toHttps(coach?.headshot?.href),
  };
}

/**
 * Steckbrief eines Teams: Stadion, Cheftrainer, Gruendung, Vereinsseite.
 *
 * Stadion, Kapazitaet, Sitz und Gruendungsjahr stehen in TEAM_FACTS, weil
 * ESPN bei drei Teams noch das Stadion von vor 2020 fuehrt (siehe Kommentar
 * dort). Der Cheftrainer kommt live und wird einen Tag lang gecacht.
 */
export async function getTeamProfile(teamAbbr: string): Promise<TeamProfile | null> {
  const facts = TEAM_FACTS[teamAbbr];
  if (!facts) return null;

  const coach = await getHeadCoach(facts.espnId).catch(() => null);
  return {
    venue: {
      name: facts.stadium,
      location: facts.location,
      grass: facts.grass,
      indoor: facts.indoor,
      capacity: facts.capacity,
    },
    coach,
    founded: facts.founded,
    website: facts.website,
  };
}

/* --------------------------- Karriere eines Spielers ---------------------- */

export type CareerSeason = {
  season: number;
  /** Team der Saison als ESPN-Slug, z. B. "kansas-city-chiefs". */
  teamSlug: string | null;
  /** Werte in derselben Reihenfolge wie die Labels der Kategorie. */
  values: string[];
};

export type AthleteBio = {
  /** Draft-Position im Klartext, z. B. "2017: Rd 1, Pk 10 (KC)". */
  draft: string | null;
  /** Geburtsort, z. B. "Whitehouse, TX". */
  birthPlace: string | null;
  /** Erste NFL-Saison. */
  debutYear: number | null;
  /** Dienstjahre im Klartext, z. B. "10th Season". */
  experience: string | null;
  /** "active", "injured", "suspension" … */
  status: string | null;
};

/** Ein Saisonwert samt Platz in der Liga, wie ESPN ihn ausweist. */
export type AthleteSummaryStat = {
  label: string;
  value: string;
  /** Rang in der Liga; null, wenn ESPN keinen ausweist. */
  rank: number | null;
};

export type AthleteSummary = {
  /** Ueberschrift der Zusammenfassung, z. B. "2025 regular season stats". */
  title: string;
  stats: AthleteSummaryStat[];
};

export type CareerCategory = {
  /** "passing", "rushing", "receiving", "defensive", "scoring" */
  name: string;
  /** Spaltenkoepfe, z. B. ["GP", "CMP", "ATT", ...] */
  labels: string[];
  seasons: CareerSeason[];
};

/**
 * Karrierewerte eines Spielers, Saison fuer Saison, direkt von ESPN.
 *
 * Die Antwort ist nach Kategorien gegliedert (Pass-, Lauf-, Fangspiel ...);
 * welche davon gefuellt sind, haengt von der Position ab. Leere Kategorien
 * werden hier schon aussortiert, damit die Oberflaeche nur zeigen muss, was
 * wirklich Werte hat.
 */
export type AthleteProfile = {
  bio: AthleteBio;
  summary: AthleteSummary | null;
  categories: CareerCategory[];
};

/**
 * Steckbrief eines Spielers: Draft, Geburtsort, Dienstjahre und die
 * Saisonwerte samt Liga-Rang.
 *
 * Das Geburtsdatum laesst ESPN als "17/9/1995" aus — ohne Angabe, ob Tag oder
 * Monat vorn steht. Es bleibt deshalb aussen vor; das Alter steht ohnehin im
 * Roster.
 */
export async function getAthleteBio(
  athleteId: string,
): Promise<{ bio: AthleteBio; summary: AthleteSummary | null }> {
  const data = await getJSON(`${WEB}/athletes/${encodeURIComponent(athleteId)}`, 60 * 60 * 6);
  const a = data?.athlete ?? {};

  const debut = Number(a.debutYear);
  const bio: AthleteBio = {
    draft: a.displayDraft ?? null,
    birthPlace: a.displayBirthPlace ?? null,
    debutYear: Number.isFinite(debut) ? debut : null,
    experience: a.displayExperience ?? null,
    status: a.status?.type ?? null,
  };

  const raw = a.statsSummary;
  const stats: AthleteSummaryStat[] = (raw?.statistics ?? [])
    .map((st: any): AthleteSummaryStat | null => {
      const label = st?.shortDisplayName ?? st?.displayName;
      const value = st?.displayValue;
      if (!label || value == null) return null;
      const rank = Number(st?.rank);
      return { label, value: String(value), rank: Number.isFinite(rank) && rank > 0 ? rank : null };
    })
    .filter(Boolean);

  return {
    bio,
    summary: raw?.displayName && stats.length > 0 ? { title: raw.displayName, stats } : null,
  };
}

export async function getAthleteCareer(athleteId: string): Promise<CareerCategory[]> {
  const data = await getJSON(`${WEB}/athletes/${encodeURIComponent(athleteId)}/stats`, 60 * 60 * 6);
  const cats = data?.categories ?? [];

  return cats
    .map((c: any): CareerCategory => {
      const labels: string[] = Array.isArray(c?.labels) ? c.labels : [];
      const seasons: CareerSeason[] = (c?.statistics ?? [])
        .map((st: any): CareerSeason | null => {
          const year = Number(st?.season?.year);
          if (!Number.isFinite(year)) return null;
          const values: string[] = Array.isArray(st?.stats) ? st.stats : [];
          if (values.length === 0) return null;
          return { season: year, teamSlug: st?.teamSlug ?? null, values };
        })
        .filter(Boolean)
        .sort((a: CareerSeason, b: CareerSeason) => b.season - a.season);

      return { name: c?.name ?? '', labels, seasons };
    })
    .filter((c: CareerCategory) => c.name && c.labels.length > 0 && c.seasons.length > 0);
}

/** Steckbrief und Karriere in einem Aufruf, damit die Oberflaeche nur einmal laedt. */
export async function getAthleteProfile(athleteId: string): Promise<AthleteProfile> {
  const [bioPart, categories] = await Promise.all([
    getAthleteBio(athleteId).catch(() => ({
      bio: { draft: null, birthPlace: null, debutYear: null, experience: null, status: null },
      summary: null,
    })),
    getAthleteCareer(athleteId).catch(() => []),
  ]);
  return { ...bioPart, categories };
}
