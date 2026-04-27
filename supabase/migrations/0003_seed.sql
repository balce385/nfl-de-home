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
