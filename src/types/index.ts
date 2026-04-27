export type TeamColor = 'red' | 'blue' | 'emerald' | 'purple' | 'orange';

export interface Team {
  code: string;
  name: string;
  record: string;
  conference: string;
  score: number;
  color: TeamColor;
}

export interface Game {
  id: string;
  status: 'scheduled' | 'live' | 'final';
  quarter?: number;
  clock?: string;
  venue: string;
  home: Team;
  away: Team;
  totalYards: { home: number; away: number };
  turnovers: { home: number; away: number };
  winProbability: { home: number; away: number };
  drive?: { team: string; yardLine: number; down: number; distance: number; progress: number };
}

export interface PlayerStats {
  passYards: number;
  touchdowns: number;
  interceptions: number;
  qbr: number;
  snapPercent: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  stats: PlayerStats;
  trend: number[];
}

export interface Article {
  slug: string;
  category: string;
  categoryColor: 'primary' | 'accent' | 'warn';
  accentTeam: string;
  accentColor: TeamColor;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: string;
}
