import { createClient } from '@/lib/supabase/server';
import { StadiumScoreboard } from '@/components/showcase/StadiumScoreboard';
import { TradingCard } from '@/components/showcase/TradingCard';
import { MagazineCover } from '@/components/showcase/MagazineCover';
import { DriveTracker } from '@/components/showcase/DriveTracker';
import { PowerRankings } from '@/components/showcase/PowerRankings';
import { HighlightBanner } from '@/components/showcase/HighlightBanner';
import { BeatWriters } from '@/components/showcase/BeatWriters';
import { YouTubeFeed } from '@/components/showcase/YouTubeFeed';
import { getTeamMedia } from '@/data/team-media';

export const metadata = {
  title: 'Design-System — NFL DE Fan Hub',
};

export const dynamic = 'force-dynamic';

type TeamRow = { id: string; name: string; primary_color: string | null };
type GameRow = {
  id: string; status: string; kickoff: string;
  home_team_id: string | null; away_team_id: string | null;
  home_score: number | null; away_score: number | null;
};
type PlayerRow = {
  id: string; full_name: string; position: string;
  team_id: string | null; jersey_number: number | null;
  headshot_url: string | null; photo_url: string | null;
};
type ArticleRow = {
  slug: string; title: string; excerpt: string | null;
  category: string | null; team_id: string | null;
  published_at: string | null;
};
type VideoRow = {
  video_id: string; title: string; thumbnail_url: string;
  published_at: string | null;
};

async function loadData() {
  const sb = createClient();
  try {
    const [teams, latestGame, topQB, magazinArticle, highlight, kcVideos] =
      await Promise.all([
        sb.from('teams').select('id, name, primary_color').order('name').limit(8),
        sb.from('games').select('*').order('kickoff', { ascending: false }).limit(1).maybeSingle(),
        sb.from('players')
          .select('id, full_name, position, team_id, jersey_number, headshot_url, photo_url, player_stats(season, week, passing_yards, passing_tds, epa, cpoe)')
          .eq('position', 'QB').limit(1).maybeSingle(),
        sb.from('articles').select('*').eq('category', 'analyse')
          .order('published_at', { ascending: false }).limit(1).maybeSingle(),
        sb.from('articles').select('*')
          .order('published_at', { ascending: false }).limit(1).maybeSingle(),
        sb.from('team_videos').select('video_id, title, thumbnail_url, published_at')
          .eq('team_id', 'KC')
          .order('published_at', { ascending: false }).limit(4),
      ]);
    return {
      teams: (teams.data ?? []) as TeamRow[],
      latestGame: latestGame.data as GameRow | null,
      topQB: topQB.data as (PlayerRow & { player_stats: any[] }) | null,
      magazinArticle: magazinArticle.data as ArticleRow | null,
      highlight: highlight.data as ArticleRow | null,
      kcVideos: (kcVideos.data ?? []) as VideoRow[],
    };
  } catch {
    return { teams: [], latestGame: null, topQB: null, magazinArticle: null, highlight: null, kcVideos: [] };
  }
}

const DEMO_VIDEOS = [
  { videoId: 'RKrDcIL1GcE', title: 'Day one in KC with our day one picks', thumbnailUrl: 'https://img.youtube.com/vi/RKrDcIL1GcE/mqdefault.jpg', publishedAt: new Date(Date.now() - 86400000).toISOString() },
  { videoId: 'EDCSadz3Dkc', title: 'Canady in Spag\'s defense', thumbnailUrl: 'https://img.youtube.com/vi/EDCSadz3Dkc/mqdefault.jpg', publishedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { videoId: 'hA3qfR126us', title: 'Thankful R Thomas didn\'t go Sooner', thumbnailUrl: 'https://img.youtube.com/vi/hA3qfR126us/mqdefault.jpg', publishedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { videoId: 'tF2xT5BmMSg', title: 'Garrett Nussmeier on Chiefs', thumbnailUrl: 'https://img.youtube.com/vi/tF2xT5BmMSg/mqdefault.jpg', publishedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
];

export default async function DesignPage() {
  const data = await loadData();
  const kcMedia = getTeamMedia('KC');

  // 1. Scoreboard — entweder Live-Game oder Demo
  const scoreHome = data.latestGame
    ? { code: data.latestGame.home_team_id ?? 'KC', name: '', score: data.latestGame.home_score ?? 0, color: '#E31837' }
    : { code: 'KC', name: 'Chiefs', score: 24, color: '#E31837' };
  const scoreAway = data.latestGame
    ? { code: data.latestGame.away_team_id ?? 'LAR', name: '', score: data.latestGame.away_score ?? 0, color: '#003594' }
    : { code: 'LAR', name: 'Rams', score: 17, color: '#003594' };

  // Team-Namen aus teams-Liste anreichern
  const teamMap = new Map(data.teams.map((t) => [t.id, t]));
  if (teamMap.has(scoreHome.code)) {
    scoreHome.name = teamMap.get(scoreHome.code)!.name.split(' ').pop() || scoreHome.name;
    scoreHome.color = teamMap.get(scoreHome.code)!.primary_color ?? scoreHome.color;
  }
  if (teamMap.has(scoreAway.code)) {
    scoreAway.name = teamMap.get(scoreAway.code)!.name.split(' ').pop() || scoreAway.name;
    scoreAway.color = teamMap.get(scoreAway.code)!.primary_color ?? scoreAway.color;
  }

  // 2. Trading Card
  const tcStats = data.topQB?.player_stats?.[0]
    ? [
        { label: 'Pass YDS', value: data.topQB.player_stats[0].passing_yards ?? 0 },
        { label: 'TD', value: data.topQB.player_stats[0].passing_tds ?? 0 },
        { label: 'EPA', value: (data.topQB.player_stats[0].epa ?? 0).toFixed(1) },
      ]
    : [
        { label: 'Pass YDS', value: '4,183' },
        { label: 'TD', value: 31 },
        { label: 'RTG', value: '102.6' },
      ];

  // 5. Power Rankings — aus teams + (placeholder rank/movement)
  const ranked = data.teams.length > 0
    ? data.teams.slice(0, 5).map((t, i) => ({
        rank: i + 1, code: t.id, name: t.name,
        color: t.primary_color ?? '#666', movement: 0,
      }))
    : [
        { rank: 1, code: 'BAL', name: 'Baltimore Ravens', color: '#241773', movement: 2 },
        { rank: 2, code: 'PHI', name: 'Philadelphia Eagles', color: '#004C54', movement: 0 },
        { rank: 3, code: 'DET', name: 'Detroit Lions', color: '#0076B6', movement: -1 },
        { rank: 4, code: 'KC', name: 'Kansas City Chiefs', color: '#E31837', movement: 1 },
        { rank: 5, code: 'BUF', name: 'Buffalo Bills', color: '#00338D', movement: -2 },
      ];

  const isLive = data.teams.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="chip">Design-System</span>
        <span className={`chip ${isLive ? 'chip-accent' : 'chip-warn'}`}>
          {isLive ? 'LIVE-Daten aus Supabase' : 'Demo-Daten (DB leer)'}
        </span>
      </div>
      <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
        Komponenten-<span className="grad-text italic">Bibliothek.</span>
      </h1>
      <p className="text-mute mt-3 text-lg max-w-2xl">
        Acht React-Komponenten, alle mit Server-Side-Rendering bestückt. Wenn die DB leer
        ist (Scraper noch nicht gelaufen), zeigen sie Demo-Daten als Fallback.
      </p>

      <div className="grid lg:grid-cols-2 gap-6 mt-12">
        <section>
          <h2 className="font-display text-xl font-bold mb-3">01 · Stadium Scoreboard</h2>
          <StadiumScoreboard
            home={scoreHome} away={scoreAway}
            quarter={3} clock="8:42"
            venue={data.latestGame ? 'NFL Stadium' : 'SoFi Stadium'}
            isLive={!!data.latestGame && data.latestGame.status === 'live'}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">02 · Trading Card</h2>
          <TradingCard
            name={data.topQB?.full_name ?? 'Patrick Mahomes'}
            position={data.topQB?.position ?? 'QB'}
            jersey={data.topQB?.jersey_number ?? 15}
            team={data.topQB?.team_id ?? 'KC'}
            photoUrl={data.topQB?.headshot_url ?? data.topQB?.photo_url ?? null}
            stats={tcStats}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">03 · Magazin-Cover</h2>
          <MagazineCover
            issue={47}
            week={data.magazinArticle ? new Date(data.magazinArticle.published_at!).getMonth() + 1 : 12}
            title={data.magazinArticle?.title ?? 'Die zweite Halbzeit der Eagles.'}
            subtitle={data.magazinArticle?.excerpt ?? 'Wie Hurts & Co. ihre Saison neu erfanden — eine Tactical Analysis.'}
            readMinutes={8} author="Redaktion"
            href={data.magazinArticle ? `/magazin/${data.magazinArticle.slug}` : '/magazin'}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">04 · Drive-Tracker</h2>
          <DriveTracker
            offenseCode={scoreHome.code} defenseCode={scoreAway.code}
            yardLine={28} down={3} distance={7}
            driveStart={28} driveEnd={68}
            winProbability={71} totalEpa={8.4} plays={9}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">05 · Power Rankings</h2>
          <PowerRankings teams={ranked} />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">06 · Highlight-Banner</h2>
          <HighlightBanner
            label={data.highlight?.category?.toUpperCase() ?? 'PLAY OF THE WEEK'}
            title={data.highlight?.title ?? '87-Yard TD-Pass'}
            description={data.highlight?.excerpt ?? 'Jefferson schnappt sich den deep ball — Q4, 2:14.'}
            metric="+4.8 EPA"
            matchup={data.highlight?.team_id ?? 'MIN vs GB'}
            href={data.highlight ? `/magazin/${data.highlight.slug}` : '/magazin'}
          />
        </section>
      </div>

      <div className="mt-16">
        <span className="chip-accent chip">Team-Media</span>
        <h2 className="font-display text-3xl font-bold mt-3">
          Team-<span className="grad-text italic">Media-Hub.</span>
        </h2>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <section>
            <h3 className="font-display text-lg font-bold mb-3">07 · Beat Writers (KC)</h3>
            {kcMedia && <BeatWriters teamName="Kansas City Chiefs" writers={kcMedia.writers} />}
          </section>

          <section>
            <h3 className="font-display text-lg font-bold mb-3">08 · YouTube-Feed (KC)</h3>
            <YouTubeFeed
              teamName="Kansas City Chiefs"
              videos={data.kcVideos.length > 0
                ? data.kcVideos.map((v) => ({
                    videoId: v.video_id, title: v.title,
                    thumbnailUrl: v.thumbnail_url, publishedAt: v.published_at,
                  }))
                : DEMO_VIDEOS}
              channelHandle={kcMedia?.youtubeHandle}
            />
          </section>
        </div>
      </div>

      <div className="mt-16 card p-6">
        <h2 className="font-display text-2xl font-bold">Datenstatus</h2>
        <ul className="mt-4 space-y-2 text-sm text-mute">
          <li>Teams in DB: <strong className="text-ink">{data.teams.length}</strong> {data.teams.length >= 32 ? '✓' : '— Migration 0009 ausführen'}</li>
          <li>Letztes Game: <strong className="text-ink">{data.latestGame ? '✓' : 'kein — ESPN-Scraper nicht gelaufen'}</strong></li>
          <li>QB-Profil: <strong className="text-ink">{data.topQB ? `✓ ${data.topQB.full_name}` : 'kein — Sleeper-Scraper nicht gelaufen'}</strong></li>
          <li>Artikel: <strong className="text-ink">{data.highlight ? '✓' : 'kein — News-Scraper nicht gelaufen'}</strong></li>
          <li>KC-Videos: <strong className="text-ink">{data.kcVideos.length}</strong></li>
        </ul>
        <p className="text-xs text-mute mt-4">
          Wenn alles auf 0/null steht: <code className="text-accent">cd scrapers; pip install -e .; python -m scrapers.run_all</code> — füllt alle Tabellen.
        </p>
      </div>
    </div>
  );
}
