import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { StadiumScoreboard } from '@/components/showcase/StadiumScoreboard';
import { getScoreboard } from '@/lib/nfl-live';

export const metadata = { title: 'Live-Games — Scoreboard' };
export const dynamic = 'force-dynamic';

export default async function LiveGamesPage() {
  const games = await getScoreboard();

  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-10">
        <span className="chip-accent chip">Live-Games</span>
        <h1 className="font-display text-4xl font-bold mt-3">
          Das <span className="grad-text italic">Scoreboard.</span>
        </h1>
        <p className="text-mute mt-1 text-sm mb-8">
          {games[0]?.season
            ? `Saison ${games[0].season} · Week ${games[0].week ?? 1} — Daten live von ESPN (60s-Cache).`
            : 'Daten live von ESPN.'}
        </p>

        {games.length === 0 && (
          <div className="card p-6 text-sm text-mute">
            Gerade keine Spiele im Scoreboard — der Ticker startet mit dem nächsten Kickoff.
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {games.map((g) => (
            <StadiumScoreboard
              key={g.id}
              home={{ code: g.home.code, name: g.home.name, score: g.home.score, color: g.home.color }}
              away={{ code: g.away.code, name: g.away.name, score: g.away.score, color: g.away.color }}
              quarter={0}
              clock={g.statusText}
              venue={g.venue || 'NFL Stadium'}
              isLive={g.state === 'in'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
