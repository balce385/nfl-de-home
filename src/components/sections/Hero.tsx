import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getScoreboard, getStandings, type LiveGame } from '@/lib/nfl-live';

export async function Hero() {
  // Live-Daten von der ESPN-API (gecacht, 60s)
  const [games, standings] = await Promise.all([getScoreboard(), getStandings()]);
  const game =
    games.find((g) => g.state === 'in') ??
    games.find((g) => g.state === 'post') ??
    games[0] ??
    null;
  const recordByCode = new Map(standings.map((s) => [s.code, s.record]));

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 animate-reveal">
          <div className="flex items-center gap-3 mb-6">
            <span className="chip-accent chip">
              {game ? `Saison ${game.season} · Week ${game.week}` : 'NFL · Live'}
            </span>
            <span className="chip">DACH · Deutsch</span>
          </div>

          <h1
            className="font-display font-black leading-[.95] tracking-tight"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 5.2rem)' }}
          >
            Die NFL
            <br />
            <span className="grad-text italic">auf Deutsch.</span>
            <br />
            <span className="grad-text-soft">Endlich richtig.</span>
          </h1>

          <p className="mt-7 text-lg text-mute max-w-xl leading-relaxed">
            News, tiefgehende Analysen, Live-Stats und Fantasy-Tools — gebündelt in einem Hub.
            Daten direkt aus <span className="text-ink font-medium">nflverse</span>,{' '}
            <span className="text-ink font-medium">Sleeper</span>,{' '}
            <span className="text-ink font-medium">Pro Football Reference</span> &amp;{' '}
            <span className="text-ink font-medium">ESPN</span> — täglich aktualisiert,
            News automatisch ins Deutsche übersetzt.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="btn-primary text-sm font-semibold px-6 py-3.5 rounded-lg inline-flex items-center gap-2 text-white"
            >
              Live-Dashboard ansehen
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/news"
              className="btn-ghost text-sm font-semibold px-6 py-3.5 rounded-lg inline-flex items-center gap-2"
            >
              News &amp; Team-Hub
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
            <Stat value="32" label="NFL-Teams" />
            <Stat value={String(games.length || 16)} label="Spiele im Ticker" />
            <Stat value="60s" label="Daten-Refresh" />
          </div>
        </div>

        <div className="lg:col-span-5 animate-reveal" style={{ animationDelay: '.15s' }}>
          <LiveGameCard game={game} recordByCode={recordByCode} />
        </div>
      </div>

      <div className="border-y border-line bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-6 text-xs font-mono uppercase tracking-widest text-mute">
          <span>Daten &amp; Quellen:</span>
          <span className="hover:text-ink transition">nflverse</span>
          <span className="hover:text-ink transition">Sleeper&nbsp;API</span>
          <span className="hover:text-ink transition">Pro&nbsp;Football&nbsp;Reference</span>
          <span className="hover:text-ink transition">ESPN</span>
          <span className="hover:text-ink transition">NFL.com</span>
          <span className="hover:text-ink transition">TheSportsDB</span>
          <span className="text-accent">● live aktualisiert</span>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold grad-text-soft">{value}</div>
      <div className="text-xs text-mute font-mono uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function LiveGameCard({
  game,
  recordByCode,
}: {
  game: LiveGame | null;
  recordByCode: Map<string, string>;
}) {
  if (!game) {
    return (
      <div className="card card-glow p-6 lg:p-7">
        <span className="chip">Scoreboard</span>
        <p className="text-sm text-mute mt-4">
          Gerade keine Spiele — der Live-Ticker startet mit dem nächsten Kickoff.
        </p>
      </div>
    );
  }

  const isLive = game.state === 'in';
  const kickoff = game.kickoff
    ? new Date(game.kickoff).toLocaleString('de-DE', {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="card card-glow p-6 lg:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {isLive && <span className="live-dot" />}
          <span
            className={`text-xs font-mono font-bold tracking-wider ${
              isLive ? 'text-danger' : 'text-mute'
            }`}
          >
            {isLive ? `LIVE · ${game.statusText}` : `${kickoff} (dt. Zeit)`}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-mute">
          {game.venue}
        </span>
      </div>

      <div className="space-y-4">
        {[game.home, game.away].map((team, idx) => (
          <div key={team.code} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center font-display font-bold text-lg text-white"
                style={{ backgroundColor: team.color }}
              >
                {team.code}
              </div>
              <div>
                <div className="font-semibold">{team.name}</div>
                <div className="text-xs text-mute font-mono">
                  {recordByCode.get(team.code) || 'Saison 2026'} · {idx === 0 ? 'Home' : 'Away'}
                </div>
              </div>
            </div>
            <div className={`font-display text-4xl font-bold ${idx === 1 ? 'text-mute' : ''}`}>
              {team.score}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-line grid grid-cols-3 gap-3 text-center">
        <MiniStat label="Saison" value={String(game.season ?? '—')} />
        <MiniStat label="Week" value={String(game.week ?? '—')} />
        <MiniStat label="Status" value={isLive ? 'LIVE' : game.state === 'post' ? 'Final' : 'Geplant'} accent={isLive} />
      </div>

      <Link
        href="/news"
        className="mt-6 block w-full text-center text-sm font-semibold py-2.5 rounded-lg border border-line hover:border-primary hover:text-primary transition"
      >
        Alle Spiele &amp; Team-News öffnen →
      </Link>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-mono text-mute uppercase tracking-wider">{label}</div>
      <div className={`font-mono font-bold mt-1 ${accent ? 'text-accent' : ''}`}>{value}</div>
    </div>
  );
}
