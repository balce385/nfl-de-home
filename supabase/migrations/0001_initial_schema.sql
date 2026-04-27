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
