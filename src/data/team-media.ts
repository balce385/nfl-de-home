/**
 * Beat Writers, X/Twitter-Handles und offizielle YouTube-Channels pro NFL-Team.
 *
 * Beat Writers: https://fiddlespicks.substack.com/p/list-of-beat-writers-for-every-nfl
 * YouTube UC-IDs: April 2026 verifiziert via externalId-Lookup auf den Channel-Pages.
 *                 Alle Channels haben aktuelle 2026-Videos im RSS-Feed.
 *
 * Stand: April 2026. Pflege jaehrlich vor Saisonbeginn.
 */
export type BeatWriter = {
  name: string;
  handle: string;       // ohne @
  outlet?: string;
};

export type TeamMedia = {
  teamId: string;             // 3-Letter-Code, matched mit teams.id
  youtubeChannelId: string;   // UC... (offiziell verifiziert)
  youtubeHandle: string;      // @... (zeigt zur richtigen Channel-Page)
  writers: BeatWriter[];
};

export const TEAM_MEDIA: TeamMedia[] = [
  { teamId: 'ARI', youtubeChannelId: 'UCzNfiKcvNjLHljohEkO83Rg', youtubeHandle: '@AzCardinals', writers: [
    { name: 'Cardinals Chatter', handle: 'Cardschatter' },
    { name: 'Bob McManaman', handle: 'azbobbymac', outlet: 'Arizona Republic' },
  ]},
  { teamId: 'ATL', youtubeChannelId: 'UCzjCfV3LHyarKbdb-2ScGZg', youtubeHandle: '@AtlantaFalcons', writers: [
    { name: "D. Orlando Ledbetter", handle: 'DOrlandoLED', outlet: 'AJC' },
    { name: 'Tori McElhaney', handle: 'Tori_McElhaney', outlet: 'AtlantaFalcons.com' },
  ]},
  { teamId: 'BAL', youtubeChannelId: 'UCbpj2JAUMb8G_oQQFPeGrhg', youtubeHandle: '@BaltimoreRavens', writers: [
    { name: 'Jamison Hensley', handle: 'jamisonhensley', outlet: 'ESPN' },
    { name: 'Jeff Zrebiec', handle: 'jeffzrebiec', outlet: 'The Athletic' },
  ]},
  { teamId: 'BUF', youtubeChannelId: 'UCcEvCxUe2Sm5W6MliEUv0vg', youtubeHandle: '@BuffaloBills', writers: [
    { name: 'Sal Maiorana', handle: 'SalMaiorana', outlet: 'D&C' },
    { name: 'Sal Capaccio', handle: 'SalSports', outlet: 'WGR 550' },
  ]},
  { teamId: 'CAR', youtubeChannelId: 'UC6vl4XAyO5mZLczhFC8MgpA', youtubeHandle: '@CarolinaPanthers', writers: [
    { name: 'Joe Person', handle: 'JosephPerson', outlet: 'The Athletic' },
    { name: 'Darin Gantt', handle: 'DarinGantt', outlet: 'Panthers.com' },
    { name: 'Sheena Quick', handle: 'Sheena_Marie3' },
  ]},
  { teamId: 'CHI', youtubeChannelId: 'UCP0Cdc6moLMyDJiO0s-yhbQ', youtubeHandle: '@ChicagoBears', writers: [
    { name: 'Brad Biggs', handle: 'BradBiggs', outlet: 'Chicago Tribune' },
    { name: 'Kevin Fishbain', handle: 'kfishbain', outlet: 'The Athletic' },
  ]},
  { teamId: 'CIN', youtubeChannelId: 'UCnQUpSnJ39KsjZKbT0CprHQ', youtubeHandle: '@Bengals', writers: [
    { name: 'Paul Dehner Jr.', handle: 'PaulDehnerJr', outlet: 'The Athletic' },
    { name: 'Kelsey Conway', handle: 'KelseyLConway', outlet: 'Bengals.com' },
  ]},
  { teamId: 'CLE', youtubeChannelId: 'UCQQQO7Kdo0cu9iEb19qOoYA', youtubeHandle: '@Browns', writers: [
    { name: 'Mary Kay Cabot', handle: 'MaryKayCabot', outlet: 'Cleveland.com' },
    { name: 'Scott Patsko', handle: 'AkronJackson', outlet: 'Akron Beacon Journal' },
  ]},
  { teamId: 'DAL', youtubeChannelId: 'UCC0BPKJxAyxjQoRTYbpW0FQ', youtubeHandle: '@dallascowboys', writers: [
    { name: 'Kyle Youmans', handle: 'kyle_youmans' },
    { name: 'Clarence Hill Jr.', handle: 'ClarenceHillJr', outlet: 'Star-Telegram' },
  ]},
  { teamId: 'DEN', youtubeChannelId: 'UCDGdBexlDZA8T7hnweWWyow', youtubeHandle: '@broncos', writers: [
    { name: 'Mike Klis', handle: 'mikeklis', outlet: '9News' },
    { name: 'Troy Renck', handle: 'TroyRenck', outlet: 'Denver7' },
  ]},
  { teamId: 'DET', youtubeChannelId: 'UCv5J06V-ESk5_1uriG65f3w', youtubeHandle: '@DetroitLionsNFL', writers: [
    { name: 'Colton Pouncy', handle: 'colton_pouncy', outlet: 'The Athletic' },
    { name: 'Tim Twentyman', handle: 'ttwentyman', outlet: 'DetroitLions.com' },
  ]},
  { teamId: 'GB', youtubeChannelId: 'UCJtI-l6La0zniodFtSHYrBg', youtubeHandle: '@packers', writers: [
    { name: 'Andy Herman', handle: 'AndyHermanNFL' },
    { name: 'Matt Schneidman', handle: 'mattschneidman', outlet: 'The Athletic' },
  ]},
  { teamId: 'HOU', youtubeChannelId: 'UCa_FcpOBe8G6VAR18RYS-aA', youtubeHandle: '@HoustonTexans', writers: [
    { name: 'John Crumpler', handle: 'JohnHCrumpler' },
    { name: 'Aaron Wilson', handle: 'AaronWilson_NFL', outlet: 'KPRC' },
  ]},
  { teamId: 'IND', youtubeChannelId: 'UCyYn26HPC4HIedifGnNbjBw', youtubeHandle: '@Colts', writers: [
    { name: 'George Bremer', handle: 'GMbremer' },
    { name: 'Mike Chappell', handle: 'mchappell51', outlet: 'CBS4' },
  ]},
  { teamId: 'JAX', youtubeChannelId: 'UCsGacW6z0GedR-Wv45SBRZg', youtubeHandle: '@jaguars', writers: [
    { name: 'Demetrius Harvey', handle: 'Demetrius82', outlet: 'Florida Times-Union' },
    { name: 'John Shipley', handle: '_John_Shipley', outlet: 'SI Jaguars' },
  ]},
  { teamId: 'KC', youtubeChannelId: 'UC-hXefb6XBFSubWz6Ezf_lA', youtubeHandle: '@KansasCityChiefs', writers: [
    { name: 'Matt Derrick', handle: 'mattderrick', outlet: 'ChiefsDigest' },
    { name: 'Nate Taylor', handle: 'ByNateTaylor', outlet: 'The Athletic' },
    { name: 'Jesse Newell', handle: 'jessenewell', outlet: 'KC Star' },
  ]},
  { teamId: 'LV', youtubeChannelId: 'UC1es5fp8FEK1L0EgHjCvmtQ', youtubeHandle: '@Raiders', writers: [
    { name: 'Vic Tafur', handle: 'VicTafur', outlet: 'The Athletic' },
    { name: 'Paul Gutierrez', handle: 'PGutierrezESPN', outlet: 'ESPN' },
  ]},
  { teamId: 'LAC', youtubeChannelId: 'UCUyz_gEY_N-KBU4zjt2s-uQ', youtubeHandle: '@Chargers', writers: [
    { name: 'Daniel Popper', handle: 'danielrpopper', outlet: 'The Athletic' },
    { name: 'Kris Rhim', handle: 'krisrhim1', outlet: 'ESPN' },
  ]},
  { teamId: 'LAR', youtubeChannelId: 'UCyJ6yZdVUkBvt2vl4R03jcA', youtubeHandle: '@RamsNFL', writers: [
    { name: 'Jourdan Rodrigue', handle: 'JourdanRodrigue', outlet: 'The Athletic' },
  ]},
  { teamId: 'MIA', youtubeChannelId: 'UCHUSfEzpSRkUUsRkk_aJwDw', youtubeHandle: '@MiamiDolphins', writers: [
    { name: 'David Furones', handle: 'DavidFurones_', outlet: 'Sun Sentinel' },
    { name: 'Joe Schad', handle: 'schadjoe', outlet: 'Palm Beach Post' },
  ]},
  { teamId: 'MIN', youtubeChannelId: 'UCcsw_KrB_wg5lQ5nXWR_LFA', youtubeHandle: '@Vikings', writers: [
    { name: 'Alec Lewis', handle: 'alec_lewis', outlet: 'The Athletic' },
    { name: 'Ben Goessling', handle: 'BenGoessling', outlet: 'Star Tribune' },
  ]},
  { teamId: 'NE', youtubeChannelId: 'UCMm_V8YjmnZRhToXIqDYDuw', youtubeHandle: '@Patriots', writers: [
    { name: 'Mike Reiss', handle: 'MikeReiss', outlet: 'ESPN' },
    { name: 'Evan Lazar', handle: 'ezlazar', outlet: 'Patriots.com' },
  ]},
  { teamId: 'NO', youtubeChannelId: 'UCwuddf1JrodMlc5fYpVlrQA', youtubeHandle: '@NewOrleansSaints', writers: [
    { name: 'Nick Underhill', handle: 'nick_underhill', outlet: 'NewOrleans.football' },
    { name: 'Mike Triplett', handle: 'MikeTriplett', outlet: 'NOLA.com' },
  ]},
  { teamId: 'NYG', youtubeChannelId: 'UCk2FqoG8dN5EAz5WU3A0D7A', youtubeHandle: '@nygiants', writers: [
    { name: 'Jordan Raanan', handle: 'JordanRaanan', outlet: 'ESPN' },
    { name: 'Paul Schwartz', handle: 'NYPost_Schwartz', outlet: 'NY Post' },
  ]},
  { teamId: 'NYJ', youtubeChannelId: 'UCROj9vBjc4ZW3AL4cd_BjHg', youtubeHandle: '@nyjets', writers: [
    { name: 'Brian Costello', handle: 'BrianCoz', outlet: 'NY Post' },
    { name: 'Rich Cimini', handle: 'RichCimini', outlet: 'ESPN' },
  ]},
  { teamId: 'PHI', youtubeChannelId: 'UCaogx6OHpsGg0zuGRKsjbtQ', youtubeHandle: '@Eagles', writers: [
    { name: 'Jeff McLane', handle: 'Jeff_McLane', outlet: 'Inquirer' },
    { name: 'Eliot Shorr-Parks', handle: 'EliotShorrParks', outlet: '94 WIP' },
  ]},
  { teamId: 'PIT', youtubeChannelId: 'UChaRXjMDs4ppKfnTPE6Z89w', youtubeHandle: '@steelers', writers: [
    { name: 'Mark Kaboly', handle: 'MarkKaboly', outlet: 'The Athletic' },
    { name: 'Alex Kozora', handle: 'Alex_Kozora', outlet: 'Steelers Depot' },
  ]},
  { teamId: 'SF', youtubeChannelId: 'UCeIOarQkwmGhimim9cDUTng', youtubeHandle: '@49ers', writers: [
    { name: 'Tim Kawakami', handle: 'LombardiHimself', outlet: 'The Athletic' },
    { name: 'Eric Branch', handle: 'Eric_Branch', outlet: 'SF Chronicle' },
    { name: 'Cam Inman', handle: 'CamInman', outlet: 'Mercury News' },
  ]},
  { teamId: 'SEA', youtubeChannelId: 'UCzkFCRiMcOBeef8xcaqipmw', youtubeHandle: '@Seahawks', writers: [
    { name: 'Gregg Bell', handle: 'Gbellseattle', outlet: 'News Tribune' },
    { name: 'Bob Condotta', handle: 'bcondotta', outlet: 'Seattle Times' },
  ]},
  { teamId: 'TB', youtubeChannelId: 'UC0Wwu7r1ybaaR09ANhudTzA', youtubeHandle: '@buccaneers', writers: [
    { name: 'Rick Stroud', handle: 'NFLSTROUD', outlet: 'Tampa Bay Times' },
    { name: 'Greg Auman', handle: 'GregAuman', outlet: 'Fox Sports' },
  ]},
  { teamId: 'TEN', youtubeChannelId: 'UCHBsqVkFraWvtNd1w0Qx4_g', youtubeHandle: '@Titans', writers: [
    { name: 'Nick Suss', handle: 'nicksuss', outlet: 'Tennessean' },
    { name: 'Terry McCormick', handle: 'terrymc13', outlet: 'TitanInsider' },
  ]},
  { teamId: 'WAS', youtubeChannelId: 'UC2a0ENbCZqIO5C1fWXGXZXA', youtubeHandle: '@Commanders', writers: [
    { name: 'Ben Standig', handle: 'BenStandig', outlet: 'The Athletic' },
    { name: 'John Keim', handle: 'John_Keim', outlet: 'ESPN' },
  ]},
];

export function getTeamMedia(teamId: string): TeamMedia | undefined {
  return TEAM_MEDIA.find((t) => t.teamId === teamId.toUpperCase());
}
