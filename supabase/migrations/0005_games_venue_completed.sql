-- ESPN liefert zu jedem Spiel Stadion, Land und einen Abschluss-Marker.
-- Der Schedule-Scraper schrieb diese Felder bereits, die Tabelle kannte sie
-- aber nicht, weshalb jeder Lauf abbrach mit:
--   "Could not find the 'completed' column of 'games' in the schema cache"
--
-- venue_country ist fuer das deutschsprachige Publikum interessant: die
-- International Games (z.B. Muenchen) stehen hier mit country != 'USA'.

alter table public.games add column if not exists completed boolean not null default false;
alter table public.games add column if not exists venue text;
alter table public.games add column if not exists venue_country text;

-- Spielplan-Abfragen laufen fast immer ueber Saison und Woche.
create index if not exists games_season_week_idx on public.games (season, week);
