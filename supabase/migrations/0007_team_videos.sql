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
