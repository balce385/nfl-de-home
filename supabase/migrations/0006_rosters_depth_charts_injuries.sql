-- ============================================================
-- Migration 0006: Rosters, Depth Charts, Snap Counts, Injuries
-- (alle Datenquellen aus nflverse + ESPN)
-- Sicher idempotent — re-runnable.
-- ============================================================

-- players: zusätzliche Roster-Felder aus nflverse
alter table public.players add column if not exists college text;
alter table public.players add column if not exists draft_year int;
alter table public.players add column if not exists draft_round int;
alter table public.players add column if not exists draft_pick int;
alter table public.players add column if not exists years_exp int;
alter table public.players add column if not exists headshot_url text;
alter table public.players add column if not exists espn_id text;
alter table public.players add column if not exists pfr_id text;
alter table public.players add column if not exists rotowire_id text;
alter table public.players add column if not exists yahoo_id text;
create index if not exists idx_players_team_position on public.players (team_id, position);

-- player_stats: aktualisierte Snap-Count-Spalten aus nflverse snap_counts
alter table public.player_stats add column if not exists offense_snaps int default 0;
alter table public.player_stats add column if not exists defense_snaps int default 0;
alter table public.player_stats add column if not exists st_snaps int default 0;
alter table public.player_stats add column if not exists offense_pct numeric(5,2);
alter table public.player_stats add column if not exists defense_pct numeric(5,2);

-- DEPTH CHARTS (wöchentlich pro Team & Position)
create table if not exists public.depth_charts (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  week int not null,
  team_id text references public.teams(id) on delete cascade,
  player_id text references public.players(id) on delete cascade,
  position text not null,         -- z. B. 'QB', 'WR', 'RB'
  formation text,                 -- 'Offense' | 'Defense' | 'Special Teams'
  depth_position int not null,    -- 1 = Starter, 2 = Backup, ...
  updated_at timestamptz default now(),
  unique(season, week, team_id, position, depth_position, player_id)
);
create index if not exists idx_depth_charts_team_week on public.depth_charts (team_id, season, week);
create index if not exists idx_depth_charts_player on public.depth_charts (player_id);

-- INJURIES (wöchentlicher Bericht)
create table if not exists public.injuries (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  week int,
  team_id text references public.teams(id) on delete cascade,
  player_id text references public.players(id) on delete cascade,
  report_status text,             -- 'Out' | 'Doubtful' | 'Questionable' | 'Probable'
  practice_status text,            -- 'DNP' | 'Limited' | 'Full'
  body_part text,
  date_modified timestamptz,
  source text default 'nflverse', -- 'nflverse' | 'espn' | 'sleeper'
  unique(season, week, player_id, source)
);
create index if not exists idx_injuries_team on public.injuries (team_id, season, week);
create index if not exists idx_injuries_player on public.injuries (player_id, season, week);
create index if not exists idx_injuries_status on public.injuries (report_status);

-- RLS-Policies (alle Tabellen public read)
alter table public.depth_charts enable row level security;
create policy "depth_charts_select_all" on public.depth_charts for select using (true);

alter table public.injuries enable row level security;
create policy "injuries_select_all" on public.injuries for select using (true);
