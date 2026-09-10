-- Next Gen Stats der NFL (Chip-Tracking in Schulterpolstern und Ball).
-- Quelle: nflverse-data, Release "nextgen_stats" (ngs_passing/receiving/rushing).
--
-- Eine Zeile je Spieler, Saison, Woche und Saisonabschnitt. week = 0 ist das
-- Saison-Aggregat, das die NFL selbst so ausliefert.
--
-- Nicht enthalten und bewusst weggelassen, weil oeffentlich nicht verfuegbar:
-- Pass Block Win Rate, Pass Rush Win Rate, Pressure Rate, Burn Rate und
-- Route Run Percentage stammen aus dem kostenpflichtigen Charting von
-- ESPN bzw. PFF und lassen sich aus Tracking-Daten nicht rekonstruieren.

create table if not exists public.player_advanced (
  player_id   text not null references public.players(id) on delete cascade,
  season      int  not null,
  week        int  not null,           -- 0 = Saison-Aggregat
  season_type text not null default 'REG',

  position    text,
  team_id     text,

  -- Passspiel (Quarterback)
  attempts                 int,
  completions              int,
  pass_yards               int,
  pass_touchdowns          int,
  interceptions            int,
  passer_rating            numeric(6,2),
  completion_pct           numeric(6,2),
  expected_completion_pct  numeric(6,2),
  cpoe                     numeric(6,2),   -- Completion % Over Expectation
  avg_time_to_throw        numeric(5,2),   -- Sekunden bis zum Wurf
  aggressiveness           numeric(6,2),   -- Anteil Pässe in enge Deckung
  avg_air_yards_to_sticks  numeric(6,2),

  -- Passempfang (WR/TE)
  targets                  int,
  receptions               int,
  rec_yards                int,
  rec_touchdowns           int,
  catch_pct                numeric(6,2),
  avg_separation           numeric(5,2),   -- Abstand zum Verteidiger beim Wurf
  avg_cushion              numeric(5,2),   -- Abstand beim Snap
  avg_yac                  numeric(5,2),
  avg_expected_yac         numeric(5,2),
  avg_yac_above_expectation numeric(5,2),  -- YACOE

  -- Laufspiel (RB)
  rush_attempts            int,
  rush_yards               int,
  rush_touchdowns          int,
  rush_efficiency          numeric(6,3),
  pct_attempts_8plus_box   numeric(6,2),   -- 8+ Verteidiger in der Box
  avg_time_to_los          numeric(5,2),   -- Zeit hinter der Anspiellinie
  rush_yards_over_expected_per_att numeric(6,3),

  updated_at timestamptz not null default now(),

  primary key (player_id, season, week, season_type)
);

create index if not exists player_advanced_season_week_idx
  on public.player_advanced (season, week);
create index if not exists player_advanced_position_idx
  on public.player_advanced (position);

alter table public.player_advanced enable row level security;

-- Advanced Stats sind oeffentliche Sportdaten: fuer alle lesbar, Schreibrecht
-- hat nur der Service-Role-Key der Scraper (der RLS ohnehin umgeht).
drop policy if exists "player_advanced lesbar fuer alle" on public.player_advanced;
create policy "player_advanced lesbar fuer alle"
  on public.player_advanced for select using (true);
