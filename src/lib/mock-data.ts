import type { Game, Player, Team } from '@/types';

export const liveGame: Game = {
  id: 'kc-phi-2026-w08',
  status: 'live',
  quarter: 3,
  clock: '04:12',
  venue: 'Arrowhead Stadium',
  home: { code: 'KC', name: 'Kansas City Chiefs', record: '6–1', conference: 'AFC West', score: 24, color: 'red' },
  away: { code: 'PHI', name: 'Philadelphia Eagles', record: '5–2', conference: 'NFC East', score: 21, color: 'emerald' },
  totalYards: { home: 412, away: 387 },
  turnovers: { home: 0, away: 2 },
  winProbability: { home: 71, away: 29 },
  drive: { team: 'KC', yardLine: 32, down: 2, distance: 7, progress: 42 },
};

export const tickerScores = [
  { home: 'KC', away: 'PHI', homeScore: 24, awayScore: 21, status: 'Q3 04:12', live: true },
  { home: 'SF', away: 'DAL', homeScore: 17, awayScore: 14, status: 'Q2 02:45', live: false },
  { home: 'BUF', away: 'MIA', homeScore: 31, awayScore: 28, status: 'F', live: false },
  { home: 'BAL', away: 'CIN', homeScore: 28, awayScore: 10, status: 'F', live: false },
  { home: 'DET', away: 'GB', homeScore: 24, awayScore: 17, status: 'F/OT', live: false },
];

export const featuredPlayer: Player = {
  id: 'bpurdy-13',
  name: 'Brock Purdy',
  position: 'QB',
  team: 'SF',
  stats: {
    passYards: 2356,
    touchdowns: 18,
    interceptions: 5,
    qbr: 70.1,
    snapPercent: 99.1,
  },
  trend: [44, 51, 48, 66, 72, 69, 81, 86],
};

// Artikel kommen aus der lokalen Redaktions-Datenbank (volle Texte inklusive)
export { articles } from '@/data/articles';

export const topTeams: Team[] = [
  { code: 'KC',  name: 'Kansas City Chiefs',     record: '6–1', conference: 'AFC West',  score: 0, color: 'red' },
  { code: 'BUF', name: 'Buffalo Bills',          record: '6–1', conference: 'AFC East',  score: 0, color: 'blue' },
  { code: 'BAL', name: 'Baltimore Ravens',       record: '5–2', conference: 'AFC North', score: 0, color: 'purple' },
  { code: 'PHI', name: 'Philadelphia Eagles',    record: '5–2', conference: 'NFC East',  score: 0, color: 'emerald' },
  { code: 'SF',  name: 'San Francisco 49ers',    record: '5–2', conference: 'NFC West',  score: 0, color: 'red' },
  { code: 'DET', name: 'Detroit Lions',          record: '5–2', conference: 'NFC North', score: 0, color: 'blue' },
];
