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
