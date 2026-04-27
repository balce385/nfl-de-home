import type { Game, Player, Article, Team } from '@/types';

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
  id: 'pmahomes-15',
  name: 'Patrick Mahomes',
  position: 'QB',
  team: 'KC',
  stats: {
    passYards: 2184,
    touchdowns: 17,
    interceptions: 4,
    qbr: 72.3,
    snapPercent: 98.4,
  },
  trend: [42, 38, 55, 70, 62, 78, 72, 88],
};

export const articles: Article[] = [
  {
    slug: 'chiefs-offense-anders-2026',
    category: 'Analyse',
    categoryColor: 'primary',
    accentTeam: 'KC',
    accentColor: 'red',
    title: 'Warum die Chiefs-Offense diese Saison anders aussieht',
    excerpt:
      'Mehr 11-Personnel, kürzere Passrouten, weniger Play-Action — eine taktische Bestandsaufnahme nach acht Wochen.',
    publishedAt: '2026-04-24',
    readingMinutes: 7,
  },
  {
    slug: 'waiver-wire-week-9-sleeper',
    category: 'Fantasy',
    categoryColor: 'accent',
    accentTeam: 'PHI',
    accentColor: 'emerald',
    title: 'Waiver-Wire Week 9: Drei Sleeper, die du jetzt picken solltest',
    excerpt:
      'Snap-Counts und Target-Share zeigen drei Spieler, die unter dem Radar fliegen — noch.',
    publishedAt: '2026-04-23',
    readingMinutes: 5,
  },
  {
    slug: 'nfl-munich-2026-stand',
    category: 'Community',
    categoryColor: 'warn',
    accentTeam: 'DACH',
    accentColor: 'blue',
    title: 'NFL-Munich-Game 2026: Was wir wissen — und was nicht',
    excerpt:
      'Datum, Teams, Tickets: Der Stand der Spekulationen rund um das nächste Deutschland-Spiel.',
    publishedAt: '2026-04-22',
    readingMinutes: 4,
  },
  {
    slug: 'rookie-class-2026-bewertung',
    category: 'Draft',
    categoryColor: 'primary',
    accentTeam: 'NFL',
    accentColor: 'blue',
    title: 'Die Rookie-Klasse 2026 nach acht Wochen — wer liefert?',
    excerpt: 'Erste Datenpunkte zu Snap-Counts, Production und PFF-Grades der Top-Picks.',
    publishedAt: '2026-04-21',
    readingMinutes: 8,
  },
  {
    slug: 'defense-renaissance-baltimore',
    category: 'Analyse',
    categoryColor: 'primary',
    accentTeam: 'BAL',
    accentColor: 'purple',
    title: 'Baltimores Defense ist wieder die Nummer eins — wie?',
    excerpt: 'Pressure-Rates, Coverage-Schemes und ein Coordinator, der seinen Stempel drückt.',
    publishedAt: '2026-04-20',
    readingMinutes: 6,
  },
  {
    slug: 'fantasy-trade-deadline-guide',
    category: 'Fantasy',
    categoryColor: 'accent',
    accentTeam: 'FF',
    accentColor: 'emerald',
    title: 'Trade Deadline Guide: Buy Low, Sell High',
    excerpt: 'Sechs konkrete Trade-Vorschläge mit Begründung — basierend auf erwartbarer Regression.',
    publishedAt: '2026-04-19',
    readingMinutes: 9,
  },
];

export const topTeams: Team[] = [
  { code: 'KC',  name: 'Kansas City Chiefs',     record: '6–1', conference: 'AFC West',  score: 0, color: 'red' },
  { code: 'BUF', name: 'Buffalo Bills',          record: '6–1', conference: 'AFC East',  score: 0, color: 'blue' },
  { code: 'BAL', name: 'Baltimore Ravens',       record: '5–2', conference: 'AFC North', score: 0, color: 'purple' },
  { code: 'PHI', name: 'Philadelphia Eagles',    record: '5–2', conference: 'NFC East',  score: 0, color: 'emerald' },
  { code: 'SF',  name: 'San Francisco 49ers',    record: '5–2', conference: 'NFC West',  score: 0, color: 'red' },
  { code: 'DET', name: 'Detroit Lions',          record: '5–2', conference: 'NFC North', score: 0, color: 'blue' },
];
