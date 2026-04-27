-- ============================================================
-- Migration 0005: Advanced Stats (nflverse) + Multi-Source-Articles
-- Sicher idempotent — re-runnable.
-- ============================================================

-- player_stats: nflverse-Felder (EPA, CPOE, Snap-Counts, Targets/Receptions)
alter table public.player_stats add column if not exists epa numeric(8,4) default 0;
alter table public.player_stats add column if not exists cpoe numeric(6,3);
alter table public.player_stats add column if not exists snap_count int default 0;
alter table public.player_stats add column if not exists targets int default 0;
alter table public.player_stats add column if not exists receptions int default 0;
alter table public.player_stats add column if not exists updated_at timestamptz default now();

-- players: zusätzliche Quellen-IDs (Sleeper, GSIS) + Status
alter table public.players add column if not exists sleeper_id text;
alter table public.players add column if not exists gsis_id text;
alter table public.players add column if not exists status text default 'active';
alter table public.players add column if not exists injury_status text;
alter table public.players add column if not exists injury_body_part text;
create index if not exists idx_players_gsis_id on public.players (gsis_id);

-- teams: zusätzliche Metadaten (TheSportsDB)
alter table public.teams add column if not exists badge_url text;
alter table public.teams add column if not exists stadium text;
alter table public.teams add column if not exists stadium_capacity int;
alter table public.teams add column if not exists country text default 'USA';
alter table public.teams add column if not exists website text;

-- articles: Quelle, Sprache, Auto-Übersetzung-Tracking
alter table public.articles add column if not exists source text default 'editorial';
alter table public.articles add column if not exists language text default 'de';
alter table public.articles add column if not exists source_url text;
alter table public.articles add column if not exists original_title text;
alter table public.articles add column if not exists translated boolean default false;
create index if not exists idx_articles_source on public.articles (source);
create index if not exists idx_articles_language on public.articles (language);

-- Hinweis: player_stats.player_id verweist auf players(id).
-- Damit nflverse-Inserts funktionieren, müssen Spieler zuerst aus Sleeper
-- in players geladen sein (player_id = sleeper.gsis_id).
