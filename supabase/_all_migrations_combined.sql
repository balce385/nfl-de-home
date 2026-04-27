-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  NFL DE Fan Hub — alle 8 Supabase-Migrations in chronologischer Folge   ║
-- ║  In Supabase: Project → SQL Editor → New Query → einfügen → "Run"        ║
-- ║  Idempotent — kann ohne Schaden mehrfach ausgeführt werden.              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════════════
-- 0001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════
-- ============================================================
-- NFL-DE-Fan Hub: Initial Schema
-- ============================================================

-- USERS / PROFILES (Supabase Auth verwaltet auth.users automatisch)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  social_links jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TEAMS
create table if not exists public.teams (
  id text primary key,            -- z. B. 'KC', 'SF'
  name text not null,             -- 'Kansas City Chiefs'
  conference text not null,       -- 'AFC' | 'NFC'
  division text not null,         -- 'West', 'East', ...
  primary_color text,
  logo_url text
);

-- PLAYERS
create table if not exists public.players (
  id text primary key,            -- PFR-ID oder UUID
  full_name text not null,
  position text not null,
  team_id text references public.teams(id),
  jersey_number int,
  height_cm int,
  weight_kg int,
  birth_date date,
  photo_url text,
  updated_at timestamptz default now()
);

-- PLAYER STATS (wöchentlich)
create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id text references public.players(id) on delete cascade,
  season int not null,
  week int not null,
  passing_yards int default 0,
  passing_tds int default 0,
  rushing_yards int default 0,
  rushing_tds int default 0,
  receiving_yards int default 0,
  receiving_tds int default 0,
  fantasy_points numeric(6,2) default 0,
  unique(player_id, season, week)
);

-- GAMES
create table if not exists public.games (
  id text primary key,
  season int not null,
  week int not null,
  home_team_id text references public.teams(id),
  away_team_id text references public.teams(id),
  home_score int,
  away_score int,
  kickoff timestamptz not null,
  status text default 'scheduled', -- 'scheduled' | 'live' | 'final'
  updated_at timestamptz default now()
);

-- ARTICLES (Magazin)
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body_md text,
  cover_url text,
  author_id uuid references auth.users(id),
  category text default 'news',   -- 'news' | 'analyse' | 'fantasy'
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- WATCHLIST (User abonniert Spieler/Teams)
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  player_id text references public.players(id) on delete cascade,
  team_id text references public.teams(id) on delete cascade,
  created_at timestamptz default now()
);

-- CHAT-CHANNELS (z. B. team-spezifisch)
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz default now()
);

create index if not exists idx_messages_channel_time
  on public.messages (channel_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- 0002_rls_policies.sql
-- ═══════════════════════════════════════════════════════════════════
-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- WATCHLIST: User sieht/bearbeitet nur eigene
alter table public.watchlist enable row level security;
create policy "watchlist_owner_all" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MESSAGES: jeder authentifizierte darf lesen, nur eigene schreiben
alter table public.messages enable row level security;
create policy "messages_select_authenticated" on public.messages
  for select using (auth.role() = 'authenticated');
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = user_id);

-- CHANNELS: alle dürfen lesen, nur Admins schreiben (via service_role)
alter table public.channels enable row level security;
create policy "channels_select_all" on public.channels
  for select using (true);

-- TEAMS / PLAYERS / GAMES / PLAYER_STATS / ARTICLES: public read
alter table public.teams enable row level security;
create policy "teams_select_all" on public.teams for select using (true);

alter table public.players enable row level security;
create policy "players_select_all" on public.players for select using (true);

alter table public.games enable row level security;
create policy "games_select_all" on public.games for select using (true);

alter table public.player_stats enable row level security;
create policy "player_stats_select_all" on public.player_stats for select using (true);

alter table public.articles enable row level security;
create policy "articles_select_published" on public.articles
  for select using (published_at <= now());

-- TRIGGER: bei neuem auth.users automatisch profile anlegen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- 0003_seed.sql
-- ═══════════════════════════════════════════════════════════════════
-- ============================================================
-- Seed-Daten: Teams + Default-Channels
-- ============================================================

insert into public.teams (id, name, conference, division, primary_color) values
  ('KC', 'Kansas City Chiefs', 'AFC', 'West', '#E31837'),
  ('SF', 'San Francisco 49ers', 'NFC', 'West', '#AA0000'),
  ('BUF', 'Buffalo Bills', 'AFC', 'East', '#00338D'),
  ('PHI', 'Philadelphia Eagles', 'NFC', 'East', '#004C54'),
  ('DAL', 'Dallas Cowboys', 'NFC', 'East', '#003594'),
  ('GB',  'Green Bay Packers', 'NFC', 'North', '#203731'),
  ('BAL', 'Baltimore Ravens', 'AFC', 'North', '#241773'),
  ('DET', 'Detroit Lions', 'NFC', 'North', '#0076B6')
on conflict (id) do nothing;

insert into public.channels (slug, name, description) values
  ('general',   'Allgemein',         'Hauptchannel für alle Fans'),
  ('fantasy',   'Fantasy Football',  'Lineup-Hilfe, Trade-Talk, Waiver-Wire'),
  ('film-room', 'Film Room',         'Tiefgehende Spielanalysen'),
  ('news',      'News & Trades',     'Breaking News & Roster-Moves')
on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- 0004_remove_pro.sql
-- ═══════════════════════════════════════════════════════════════════
-- ============================================================
-- Bezahl-Funktion entfernt — räumt Pro-Spalten aus dem Schema.
-- Sicher idempotent: läuft auch, wenn Spalten schon weg sind.
-- ============================================================

-- profiles
alter table public.profiles drop column if exists is_pro;
alter table public.profiles drop column if exists pro_until;

-- articles
alter table public.articles drop column if exists is_pro;

-- channels
alter table public.channels drop column if exists is_pro;
alter table public.channels drop column if exists is_pro_only;

-- Falls die alte Articles-Policy noch existiert, neu setzen
drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published" on public.articles
  for select using (published_at <= now());

-- Film-Room-Channel von Pro-only auf offen umstellen (falls vorhanden)
update public.channels
   set description = 'Tiefgehende Spielanalysen'
 where slug = 'film-room';

-- ═══════════════════════════════════════════════════════════════════
-- 0005_advanced_stats.sql
-- ═══════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════
-- 0006_rosters_depth_charts_injuries.sql
-- ═══════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════
-- 0007_team_videos.sql
-- ═══════════════════════════════════════════════════════════════════
-- ============================================================
-- Migration 0007: Team-YouTube-Videos
-- Speichert die letzten 15 Videos pro Team-YouTube-Channel.
-- Quelle: youtube.com/feeds/videos.xml?channel_id=UCxxxx (RSS, keine Auth)
-- ============================================================

create table if not exists public.team_videos (
  id uuid primary key default gen_random_uuid(),
  team_id text references public.teams(id) on delete cascade,
  video_id text not null,                        -- 11-stellige YT-ID
  title text not null,
  description text,
  thumbnail_url text,                            -- https://img.youtube.com/vi/{id}/mqdefault.jpg
  channel_id text,
  channel_title text,
  published_at timestamptz,
  duration_seconds int,
  view_count int,
  source text default 'youtube',
  created_at timestamptz default now(),
  unique(team_id, video_id)
);

create index if not exists idx_team_videos_team_published
  on public.team_videos (team_id, published_at desc);

alter table public.team_videos enable row level security;
create policy "team_videos_select_all" on public.team_videos for select using (true);

-- ═══════════════════════════════════════════════════════════════════
-- 0008_articles_team_link.sql
-- ═══════════════════════════════════════════════════════════════════
-- ============================================================
-- Migration 0008: Articles ↔ Teams + Sortier-Index
-- Erweitert articles um team_id, optionale Verknuepfung pro Beitrag.
-- ============================================================

alter table public.articles
  add column if not exists team_id text references public.teams(id) on delete set null;

create index if not exists idx_articles_team_published
  on public.articles (team_id, published_at desc nulls last);

create index if not exists idx_articles_published
  on public.articles (published_at desc nulls last);

create index if not exists idx_articles_source_published
  on public.articles (source, published_at desc nulls last);
