import { StadiumScoreboard } from '@/components/showcase/StadiumScoreboard';
import { TradingCard } from '@/components/showcase/TradingCard';
import { MagazineCover } from '@/components/showcase/MagazineCover';
import { DriveTracker } from '@/components/showcase/DriveTracker';
import { PowerRankings } from '@/components/showcase/PowerRankings';
import { HighlightBanner } from '@/components/showcase/HighlightBanner';
import { TeamMediaExplorer } from '@/components/showcase/TeamMediaExplorer';
import {
  getAllTeams,
  getScoreboard,
  getStandings,
  getPassingLeader,
} from '@/lib/nfl-live';
import { fullArticles } from '@/data/articles';

export const metadata = {
  title: 'News — Live-Daten, Standings & Team-Media',
  description:
    'Live-Scoreboard, Power Rankings, Beat Writers und aktuelle News für alle 32 NFL-Teams — direkt von der ESPN-API.',
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  // Live-Daten parallel von der ESPN-API laden (Server-Side, gecacht)
  const [teams, games, standings, passLeader] = await Promise.all([
    getAllTeams(),
    getScoreboard(),
    getStandings(),
    getPassingLeader(),
  ]);

  const isLive = teams.length > 0;

  // 1. Scoreboard — bevorzugt ein laufendes Spiel, sonst das nächste/letzte
  const game =
    games.find((g) => g.state === 'in') ??
    games.find((g) => g.state === 'post') ??
    games[0] ??
    null;
  const scoreHome = game
    ? { code: game.home.code, name: game.home.name, score: game.home.score, color: game.home.color }
    : { code: 'KC', name: 'Chiefs', score: 0, color: '#E31837' };
  const scoreAway = game
    ? { code: game.away.code, name: game.away.name, score: game.away.score, color: game.away.color }
    : { code: 'DET', name: 'Lions', score: 0, color: '#0076B6' };

  // 2. Trading Card — aktueller Passing-Leader der Liga
  const tcStats = passLeader
    ? [
        { label: passLeader.category, value: passLeader.displayValue || '—' },
        { label: 'POS', value: passLeader.position },
        { label: 'TEAM', value: passLeader.team },
      ]
    : [
        { label: 'Pass YDS', value: '—' },
        { label: 'POS', value: 'QB' },
        { label: 'TEAM', value: '—' },
      ];

  // 3./6. Magazin-Cover & Highlight aus der Redaktions-Datenbank
  const magazinArticle = fullArticles.find((a) => a.category === 'Analyse') ?? fullArticles[0];
  const highlight = fullArticles[0];

  // 5. Power Rankings — Top 5 nach Win-Percentage (Live-Standings)
  const colorByCode = new Map(teams.map((t) => [t.id, t.color]));
  const ranked = standings.slice(0, 5).map((s, i) => ({
    rank: i + 1,
    code: s.code,
    name: s.record ? `${s.name} (${s.record})` : s.name,
    color: colorByCode.get(s.code) ?? '#666',
    movement: 0,
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="chip">News</span>
        <span className={`chip ${isLive ? 'chip-accent' : 'chip-warn'}`}>
          {isLive ? 'LIVE-Daten · ESPN-API' : 'ESPN-API nicht erreichbar'}
        </span>
        {game && (
          <span className="chip">
            Saison {game.season} · Week {game.week}
          </span>
        )}
      </div>
      <h1 className="font-display text-5xl font-bold mt-4 leading-tight">
        News &amp; <span className="grad-text italic">Live-Daten.</span>
      </h1>
      <p className="text-mute mt-3 text-lg max-w-2xl">
        Scoreboard, Standings und Team-News aktualisieren sich automatisch —
        alle Daten kommen live von der öffentlichen ESPN-API.
      </p>

      <div className="grid lg:grid-cols-2 gap-6 mt-12">
        <section>
          <h2 className="font-display text-xl font-bold mb-3">01 · Stadium Scoreboard</h2>
          <StadiumScoreboard
            home={scoreHome}
            away={scoreAway}
            quarter={0}
            clock={game?.statusText ?? ''}
            venue={game?.venue || 'NFL Stadium'}
            isLive={game?.state === 'in'}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">02 · Trading Card</h2>
          <TradingCard
            name={passLeader?.name ?? 'Saison startet bald'}
            position={passLeader?.position ?? 'QB'}
            jersey={0}
            team={passLeader?.team ?? 'NFL'}
            photoUrl={passLeader?.headshot ?? null}
            stats={tcStats}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">03 · Magazin-Cover</h2>
          <MagazineCover
            issue={47}
            week={new Date(magazinArticle.publishedAt).getMonth() + 1}
            title={magazinArticle.title}
            subtitle={magazinArticle.excerpt}
            readMinutes={magazinArticle.readingMinutes}
            author="Redaktion"
            href={`/magazin/${magazinArticle.slug}`}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">04 · Drive-Tracker</h2>
          <DriveTracker
            offenseCode={scoreHome.code}
            defenseCode={scoreAway.code}
            yardLine={28}
            down={3}
            distance={7}
            driveStart={28}
            driveEnd={68}
            winProbability={71}
            totalEpa={8.4}
            plays={9}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">05 · Power Rankings</h2>
          <PowerRankings teams={ranked} />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">06 · Highlight-Banner</h2>
          <HighlightBanner
            label={highlight.category.toUpperCase()}
            title={highlight.title}
            description={highlight.excerpt}
            metric="NEU"
            matchup={highlight.accentTeam}
            href={`/magazin/${highlight.slug}`}
          />
        </section>
      </div>

      <div className="mt-16">
        <span className="chip-accent chip">Team-Media</span>
        <h2 className="font-display text-3xl font-bold mt-3">
          Team-<span className="grad-text italic">Media-Hub.</span>
        </h2>
        <p className="text-mute mt-2 max-w-2xl">
          Wähle eines der 32 NFL-Teams: Beat Writers (Quelle:
          fiddlespicks.substack.com), offizieller YouTube-Channel und Live-News
          von ESPN.
        </p>

        <div className="mt-6">
          <TeamMediaExplorer
            teams={teams.map((t) => ({
              id: t.id,
              name: t.name,
              shortName: t.shortName,
              color: t.color,
              logo: t.logo,
            }))}
          />
        </div>
      </div>

      <div className="mt-16 card p-6">
        <h2 className="font-display text-2xl font-bold">Datenstatus</h2>
        <ul className="mt-4 space-y-2 text-sm text-mute">
          <li>
            Teams (ESPN): <strong className="text-ink">{teams.length}</strong>{' '}
            {teams.length >= 32 ? '✓' : '— API prüfen'}
          </li>
          <li>
            Spiele im Scoreboard: <strong className="text-ink">{games.length}</strong>{' '}
            {game ? `(${game.away.code} @ ${game.home.code}, ${game.statusText})` : ''}
          </li>
          <li>
            Standings: <strong className="text-ink">{standings.length} Teams</strong>
          </li>
          <li>
            Passing-Leader:{' '}
            <strong className="text-ink">{passLeader ? `✓ ${passLeader.name}` : '— (Offseason)'}</strong>
          </li>
          <li>
            Redaktions-Artikel: <strong className="text-ink">{fullArticles.length}</strong>
          </li>
        </ul>
        <p className="text-xs text-mute mt-4">
          Quellen: ESPN Scoreboard/Standings/Teams/News-API (60s–24h Cache) ·
          Beat Writers: fiddlespicks.substack.com · Artikel: Redaktion.
        </p>
      </div>
    </div>
  );
}
