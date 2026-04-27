-- ============================================================
-- Migration 0009: alle 32 NFL-Teams seed (vorher nur 8)
-- Idempotent: on conflict (id) do nothing
-- ============================================================

insert into public.teams (id, name, conference, division, primary_color) values
  -- AFC East
  ('BUF', 'Buffalo Bills',         'AFC', 'East',  '#00338D'),
  ('MIA', 'Miami Dolphins',        'AFC', 'East',  '#008E97'),
  ('NE',  'New England Patriots',  'AFC', 'East',  '#002244'),
  ('NYJ', 'New York Jets',         'AFC', 'East',  '#125740'),
  -- AFC North
  ('BAL', 'Baltimore Ravens',      'AFC', 'North', '#241773'),
  ('CIN', 'Cincinnati Bengals',    'AFC', 'North', '#FB4F14'),
  ('CLE', 'Cleveland Browns',      'AFC', 'North', '#311D00'),
  ('PIT', 'Pittsburgh Steelers',   'AFC', 'North', '#FFB612'),
  -- AFC South
  ('HOU', 'Houston Texans',        'AFC', 'South', '#03202F'),
  ('IND', 'Indianapolis Colts',    'AFC', 'South', '#002C5F'),
  ('JAX', 'Jacksonville Jaguars',  'AFC', 'South', '#101820'),
  ('TEN', 'Tennessee Titans',      'AFC', 'South', '#0C2340'),
  -- AFC West
  ('DEN', 'Denver Broncos',        'AFC', 'West',  '#FB4F14'),
  ('KC',  'Kansas City Chiefs',    'AFC', 'West',  '#E31837'),
  ('LV',  'Las Vegas Raiders',     'AFC', 'West',  '#000000'),
  ('LAC', 'Los Angeles Chargers',  'AFC', 'West',  '#0080C6'),
  -- NFC East
  ('DAL', 'Dallas Cowboys',        'NFC', 'East',  '#003594'),
  ('NYG', 'New York Giants',       'NFC', 'East',  '#0B2265'),
  ('PHI', 'Philadelphia Eagles',   'NFC', 'East',  '#004C54'),
  ('WAS', 'Washington Commanders', 'NFC', 'East',  '#5A1414'),
  -- NFC North
  ('CHI', 'Chicago Bears',         'NFC', 'North', '#0B162A'),
  ('DET', 'Detroit Lions',         'NFC', 'North', '#0076B6'),
  ('GB',  'Green Bay Packers',     'NFC', 'North', '#203731'),
  ('MIN', 'Minnesota Vikings',     'NFC', 'North', '#4F2683'),
  -- NFC South
  ('ATL', 'Atlanta Falcons',       'NFC', 'South', '#A71930'),
  ('CAR', 'Carolina Panthers',     'NFC', 'South', '#0085CA'),
  ('NO',  'New Orleans Saints',    'NFC', 'South', '#D3BC8D'),
  ('TB',  'Tampa Bay Buccaneers',  'NFC', 'South', '#D50A0A'),
  -- NFC West
  ('ARI', 'Arizona Cardinals',     'NFC', 'West',  '#97233F'),
  ('LAR', 'Los Angeles Rams',      'NFC', 'West',  '#003594'),
  ('SF',  'San Francisco 49ers',   'NFC', 'West',  '#AA0000'),
  ('SEA', 'Seattle Seahawks',      'NFC', 'West',  '#002244')
on conflict (id) do update set
  name = excluded.name,
  conference = excluded.conference,
  division = excluded.division,
  primary_color = excluded.primary_color;
