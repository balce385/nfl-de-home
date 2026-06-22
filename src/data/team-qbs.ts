import type { Player } from '@/types';

/**
 * Starting-QB je NFL-Team für die Marketing-Vorschau ("Daten, die du verstehst").
 * Die Statistiken sind Demo-Werte: deterministisch aus dem Team-Kürzel erzeugt,
 * damit jedes Team konstante, aber unterschiedliche Zahlen zeigt.
 */

type QBInfo = { name: string; number: number };

// Team-Kürzel in der normalisierten Form aus nfl-live.ts (WAS, LAR, …).
export const TEAM_QBS: Record<string, QBInfo> = {
  ARI: { name: 'Kyler Murray', number: 1 },
  ATL: { name: 'Michael Penix Jr.', number: 9 },
  BAL: { name: 'Lamar Jackson', number: 8 },
  BUF: { name: 'Josh Allen', number: 17 },
  CAR: { name: 'Bryce Young', number: 9 },
  CHI: { name: 'Caleb Williams', number: 18 },
  CIN: { name: 'Joe Burrow', number: 9 },
  CLE: { name: 'Deshaun Watson', number: 4 },
  DAL: { name: 'Dak Prescott', number: 4 },
  DEN: { name: 'Bo Nix', number: 10 },
  DET: { name: 'Jared Goff', number: 16 },
  GB: { name: 'Jordan Love', number: 10 },
  HOU: { name: 'C.J. Stroud', number: 7 },
  IND: { name: 'Anthony Richardson', number: 5 },
  JAX: { name: 'Trevor Lawrence', number: 16 },
  KC: { name: 'Patrick Mahomes', number: 15 },
  LV: { name: 'Geno Smith', number: 7 },
  LAC: { name: 'Justin Herbert', number: 10 },
  LAR: { name: 'Matthew Stafford', number: 9 },
  MIA: { name: 'Tua Tagovailoa', number: 1 },
  MIN: { name: 'J.J. McCarthy', number: 9 },
  NE: { name: 'Drake Maye', number: 10 },
  NO: { name: 'Spencer Rattler', number: 18 },
  NYG: { name: 'Jaxson Dart', number: 6 },
  NYJ: { name: 'Justin Fields', number: 7 },
  PHI: { name: 'Jalen Hurts', number: 1 },
  PIT: { name: 'Aaron Rodgers', number: 8 },
  SF: { name: 'Brock Purdy', number: 13 },
  SEA: { name: 'Sam Darnold', number: 14 },
  TB: { name: 'Baker Mayfield', number: 6 },
  TEN: { name: 'Cam Ward', number: 1 },
  WAS: { name: 'Jayden Daniels', number: 5 },
};

const DEFAULT_TEAM = 'KC';

// Kleiner deterministischer PRNG (mulberry32) mit FNV-1a-Seed aus dem Kürzel.
function seeded(code: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r: number, min: number, max: number) => min + r * (max - min);
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Baut aus dem Team-Kürzel einen vollständigen Player für die Vorschau-Karte.
 * Gleiches Kürzel ⇒ immer gleiche Werte (deterministisch).
 */
export function buildFeaturedPlayer(teamCode: string): Player {
  const code = TEAM_QBS[teamCode] ? teamCode : DEFAULT_TEAM;
  const qb = TEAM_QBS[code];
  const rand = seeded(code);

  const passYards = Math.round(between(rand(), 1850, 2750));
  const touchdowns = Math.round(between(rand(), 12, 24));
  const interceptions = Math.round(between(rand(), 2, 9));
  const qbr = round1(between(rand(), 58, 82));
  const snapPercent = round1(between(rand(), 95, 100));

  // 8-Spiele-Trend = Passing-Yards pro Spiel (realistische Größenordnung),
  // damit Demo- und Live-Daten dieselbe Skala haben.
  const base = between(rand(), 210, 260);
  const slope = between(rand(), -4, 8);
  const trend = Array.from({ length: 8 }, (_, i) =>
    Math.max(120, Math.round(base + i * slope + (rand() - 0.5) * 80))
  );

  return {
    id: `${qb.name.toLowerCase().replace(/[^a-z]/g, '')}-${qb.number}`,
    name: qb.name,
    position: 'QB',
    team: code,
    stats: { passYards, touchdowns, interceptions, qbr, snapPercent },
    trend,
  };
}
