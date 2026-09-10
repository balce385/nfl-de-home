import { StadiumScoreboard } from '@/components/showcase/StadiumScoreboard';
import { TradingCard } from '@/components/showcase/TradingCard';
import { MagazineCover } from '@/components/showcase/MagazineCover';
import { LiveDriveTracker } from '@/components/showcase/LiveDriveTracker';
import { PowerRankings } from '@/components/showcase/PowerRankings';
import { HighlightBanner } from '@/components/showcase/HighlightBanner';
import { TeamMediaExplorer } from '@/components/showcase/TeamMediaExplorer';
import { TeamNewsFeed } from '@/components/magazin/TeamNewsFeed';
import {
  getAllTeams,
  getScoreboard,
  getStandings,
  getGameSituations,
} from '@/lib/nfl-live';
import { getTopPasser } from '@/lib/advanced-stats';
import { fullArticles } from '@/data/articles';

export const metadata = {
  title: 'News — Live-Daten, Standings & Team-Media',
  description:
    'Live-Scoreboard, Power Rankings, Beat Writers und aktuelle News für alle 32 NFL-Teams — direkt von der ESPN-API.',
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  // Live-Daten parallel von der ESPN-API laden (Server-Side, gecacht)
  const [teams, games, standings, passLeader, situations] = await Promise.all([
    getAllTeams(),
    getScoreboard(),
    getStandings(),
    getTopPasser(),
    getGameSituations(),
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

  // 2. Trading Card — Passing-Leader aus den eigenen Next-Gen-Stats.
  // ESPNs /leaders-Endpunkt antwortet seit September 2026 mit 404.
  const tcStats = passLeader
    ? [
        { label: `Pass YDS ${passLeader.season}`, value: passLeader.passYards.toLocaleString('de-DE') },
        { label: 'TD / INT', value: `${passLeader.touchdowns} / ${passLeader.interceptions}` },
        {
          label: 'Rating',
          value: passLeader.passerRating
            ? passLeader.passerRating.toLocaleString('de-DE', { maximumFractionDigits: 1 })
            : '—',
        },
      ]
    : [
        { label: 'Pass YDS', value: '—' },
        { label: 'TD / INT', value: '—' },
        { label: 'Rating', value: '—' },
      ];

  // 3./5. Magazin-Cover & Highlight aus der Artikel-Datenbank
  const magazinArticle = fullArticles.find((a) => a.category === 'Analyse') ?? fullArticles[0];
  const highlight = fullArticles[0];
  const magazinDate = new Date(magazinArticle.publishedAt);
  // Ausgabe = laufende Nummer des Artikels, damit die Zahl einen Bezug hat
  // (vorher stand hier fest verdrahtet "Ausgabe 47").
  const magazinIssue = fullArticles.length - fullArticles.indexOf(magazinArticle);

  // 4. Power Rankings — Top 5 der Live-Standings mit echter Punktedifferenz
  const colorByCode = new Map(teams.map((t) => [t.id, t.color]));
  const ranked = standings.slice(0, 5).map((s, i) => ({
    rank: i + 1,
    code: s.code,
    name: s.record ? `${s.name} (${s.record})` : s.name,
    color: colorByCode.get(s.code) ?? '#666',
    differential: s.differential,
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

      {/* Live-Drive-Tracker: echte Spielsituation, Spiel frei waehlbar */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <span className="chip-accent chip">Live</span>
            <h2 className="font-display text-3xl font-bold mt-2">
              Drive-<span className="grad-text italic">Tracker.</span>
            </h2>
            <p className="text-mute mt-1 text-sm max-w-2xl">
              Ballbesitz, Down &amp; Distance, Feldposition und Siegwahrscheinlichkeit — Spiel
              auswählen, der Rest aktualisiert sich während der Partie von selbst.
            </p>
          </div>
        </div>
        <LiveDriveTracker initialGames={situations} />
      </section>

      {/* News pro Team */}
      <section className="mt-16">
        <TeamNewsFeed
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            shortName: t.shortName,
            color: t.color,
            logo: t.logo,
          }))}
        />
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mt-4">
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
            name={passLeader?.name ?? 'Noch keine Daten'}
            position="QB"
            jersey={0}
            team={passLeader?.team ?? 'NFL'}
            photoUrl={passLeader?.headshot ?? null}
            stats={tcStats}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">03 · Magazin-Cover</h2>
          <MagazineCover
            issue={magazinIssue}
            date={magazinDate.toLocaleDateString('de-DE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            title={magazinArticle.title}
            subtitle={magazinArticle.excerpt}
            readMinutes={magazinArticle.readingMinutes}
            href={`/magazin/${magazinArticle.slug}`}
          />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">04 · Power Rankings</h2>
          <PowerRankings teams={ranked} />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-3">05 · Highlight-Banner</h2>
          <HighlightBanner
            label={highlight.category.toUpperCase()}
            title={highlight.title}
            description={highlight.excerpt}
            metric={`${highlight.readingMinutes} min`}
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
