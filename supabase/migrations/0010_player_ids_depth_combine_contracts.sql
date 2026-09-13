-- ============================================================
-- Migration 0010: Spieler-IDs, Depth-Chart-Stand, Combine, Draft, Vertraege
-- Idempotent.
-- ============================================================

-- 1. Spieler-IDs ohne fuehrende Leerzeichen
--
-- Sleeper lieferte 862 GSIS-IDs als " 00-0035609". nflverse fuehrt dieselben
-- Spieler als "00-0035609", deshalb bekamen sie nie Stats, Injuries oder
-- Depth Charts. 145 davon gab es zusaetzlich schon sauber — diese Dubletten
-- fliegen raus, der Rest wird getrimmt. Am 2026-09-13 geprueft: keine Tabelle
-- verweist auf eine der kaputten IDs.
delete from public.players p
 where p.id <> btrim(p.id)
   and exists (select 1 from public.players q where q.id = btrim(p.id));

update public.players
   set id = btrim(id), gsis_id = btrim(gsis_id)
 where id <> btrim(id) or gsis_id <> btrim(gsis_id);

alter table public.players drop constraint if exists players_id_trimmed;
alter table public.players add constraint players_id_trimmed check (id = btrim(id));

-- 2. Depth Charts: nflverse liefert seit 2025 Tagesstaende statt Wochen.
--    week = 0 steht fuer den aktuellen Stand, slot trennt WR1/WR2/WR3.
alter table public.depth_charts add column if not exists slot int;
alter table public.depth_charts add column if not exists as_of timestamptz;

-- 3. NFL Combine (nflverse "combine", Quelle Pro Football Reference)
create table if not exists public.player_combine (
  pfr_id      text primary key,
  player_name text not null,
  season      int  not null,
  position    text,
  school      text,
  height      text,            -- "6-2" (Fuss-Zoll)
  weight      int,             -- Pfund
  forty       numeric(4,2),    -- Sekunden
  bench       int,             -- Wiederholungen mit 225 lb
  vertical    numeric(4,1),    -- Zoll
  broad_jump  int,             -- Zoll
  cone        numeric(4,2),    -- Sekunden
  shuttle     numeric(4,2)     -- Sekunden
);

-- 4. Draft-Historie mit Karriere-Auszeichnungen (nflverse "draft_picks")
create table if not exists public.player_draft (
  season          int  not null,
  pick            int  not null,  -- Gesamtposition im Draft
  round           int,
  team            text,
  gsis_id         text,
  pfr_id          text,
  player_name     text not null,
  position        text,
  college         text,
  age             int,
  hof             boolean not null default false,
  allpro          int,
  probowls        int,
  seasons_started int,
  games           int,
  career_av       int,            -- gewichteter Approximate Value (PFR)
  primary key (season, pick)
);
create index if not exists player_draft_gsis_idx on public.player_draft (gsis_id);
create index if not exists player_draft_pfr_idx on public.player_draft (pfr_id);

-- 5. Laufende Vertraege (OverTheCap ueber nflverse "contracts"), Mio. US-Dollar
create table if not exists public.player_contracts (
  gsis_id         text primary key,
  player_name     text not null,
  position        text,
  team            text,
  year_signed     int,
  years           int,
  value_musd      numeric(8,2),
  apy_musd        numeric(7,2),
  guaranteed_musd numeric(8,2),
  apy_cap_pct     numeric(5,3),   -- Anteil am Salary Cap, 0..1
  otc_id          int
);

-- Oeffentliche Sportdaten: lesbar fuer alle, schreiben nur der Service-Role-Key.
alter table public.player_combine   enable row level security;
alter table public.player_draft     enable row level security;
alter table public.player_contracts enable row level security;
drop policy if exists "player_combine lesbar fuer alle"   on public.player_combine;
drop policy if exists "player_draft lesbar fuer alle"     on public.player_draft;
drop policy if exists "player_contracts lesbar fuer alle" on public.player_contracts;
create policy "player_combine lesbar fuer alle"   on public.player_combine   for select using (true);
create policy "player_draft lesbar fuer alle"     on public.player_draft     for select using (true);
create policy "player_contracts lesbar fuer alle" on public.player_contracts for select using (true);

notify pgrst, 'reload schema';
