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
