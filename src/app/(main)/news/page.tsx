import { LiveDriveTracker } from '@/components/showcase/LiveDriveTracker';
import { TeamShowcase } from '@/components/showcase/TeamShowcase';
import { TeamMediaExplorer } from '@/components/showcase/TeamMediaExplorer';
import { TeamNewsFeed } from '@/components/magazin/TeamNewsFeed';
import { getAllTeams, getScoreboard, getStandings, getGameSituations } from '@/lib/nfl-live';
import { fullArticles } from '@/data/articles';

export const metadata = {
  title: 'News — Live-Daten, Standings & Team-Media',
  description:
    'Live-Scoreboard, Power Rankings, Beat Writers und aktuelle News für alle 32 NFL-Teams — direkt von der ESPN-API.',
};

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  // Live-Daten parallel von der ESPN-API laden (Server-Side, gecacht)
  const [teams, games, standings, situations] = await Promise.all([
    getAllTeams(),
    getScoreboard(),
    getStandings(),
    getGameSituations(),
  ]);

  const isLive = teams.length > 0;
  const week = games.find((g) => g.week)?.week ?? null;
  const season = games.find((g) => g.season)?.season ?? null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="chip">News</span>
        <span className={`chip ${isLive ? 'chip-accent' : 'chip-warn'}`}>
          {isLive ? 'LIVE-Daten · ESPN-API' : 'ESPN-API nicht erreichbar'}
        </span>
        {season && (
          <span className="chip">
            Saison {season}
            {week ? ` · Week ${week}` : ''}
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

      {/* Kacheln, die dem gewählten Team folgen */}
      <section className="mt-16">
        <TeamShowcase
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            shortName: t.shortName,
            color: t.color,
            logo: t.logo,
          }))}
          standings={standings.map((s) => ({
            code: s.code,
            name: s.name,
            conference: s.conference,
            record: s.record,
            differential: s.differential,
          }))}
          situations={situations}
          articles={fullArticles.map((a) => ({
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            category: a.category,
            accentTeam: a.accentTeam,
            publishedAt: a.publishedAt,
            readingMinutes: a.readingMinutes,
          }))}
        />
      </section>

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

      {/* Quellenangabe statt des frueheren Entwickler-Panels "Datenstatus" */}
      <p className="text-xs text-mute mt-16">
        Spielstände, Standings und News von der öffentlichen ESPN-API · Beat Writers:
        fiddlespicks.substack.com · Statistiken über{' '}
        <a
          href="https://github.com/nflverse/nflverse-data"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          nflverse
        </a>
        .
      </p>
    </div>
  );
}
