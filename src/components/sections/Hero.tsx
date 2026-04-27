import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { liveGame } from '@/lib/mock-data';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 animate-reveal">
          <div className="flex items-center gap-3 mb-6">
            <span className="chip-accent chip">Saison 2026 · Week 8</span>
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
              href="/register"
              className="btn-primary text-sm font-semibold px-6 py-3.5 rounded-lg inline-flex items-center gap-2 text-white"
            >
              Account erstellen
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/dashboard"
              className="btn-ghost text-sm font-semibold px-6 py-3.5 rounded-lg inline-flex items-center gap-2"
            >
              Live-Dashboard ansehen
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
            <Stat value="12.4k" label="Aktive Fans" />
            <Stat value="2.6k" label="Spieler-Profile" />
            <Stat value="< 500ms" label="Suche" />
          </div>
        </div>

        <div className="lg:col-span-5 animate-reveal" style={{ animationDelay: '.15s' }}>
          <LiveGameCard />
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
          <span className="text-accent">● täglich aktualisiert</span>
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

function LiveGameCard() {
  const colorMap: Record<string, string> = {
    red: 'bg-red-600/20 border-red-500/40',
    emerald: 'bg-emerald-700/20 border-emerald-500/40',
    blue: 'bg-blue-600/20 border-blue-500/40',
    purple: 'bg-purple-700/20 border-purple-500/40',
    orange: 'bg-orange-700/20 border-orange-500/40',
  };

  return (
    <div className="card card-glow p-6 lg:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs font-mono font-bold tracking-wider text-danger">
            LIVE · Q{liveGame.quarter} · {liveGame.clock}
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-mute">
          {liveGame.venue}
        </span>
      </div>

      <div className="space-y-4">
        {[liveGame.home, liveGame.away].map((team, idx) => (
          <div key={team.code} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-lg border flex items-center justify-center font-display font-bold text-xl ${colorMap[team.color]}`}
              >
                {team.code}
              </div>
              <div>
                <div className="font-semibold">{team.name}</div>
                <div className="text-xs text-mute font-mono">
                  {team.record} · {team.conference}
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
        <MiniStat label="Total YDS" value={`${liveGame.totalYards.home} / ${liveGame.totalYards.away}`} />
        <MiniStat label="Turnovers" value={`${liveGame.turnovers.home} / ${liveGame.turnovers.away}`} />
        <MiniStat label="Win-Prob." value={`${liveGame.winProbability.home}%`} accent />
      </div>

      {liveGame.drive && (
        <div className="mt-5">
          <div className="flex justify-between text-[10px] font-mono text-mute mb-2 uppercase tracking-wider">
            <span>{liveGame.drive.team} eigene {liveGame.drive.yardLine}</span>
            <span>
              {liveGame.drive.down} &amp; {liveGame.drive.distance}
            </span>
            <span>{liveGame.away.code} EZ</span>
          </div>
          <div className="yard">
            <i style={{ width: `${liveGame.drive.progress}%` }} />
          </div>
        </div>
      )}

      <button className="mt-6 w-full text-sm font-semibold py-2.5 rounded-lg border border-line hover:border-primary hover:text-primary transition">
        Vollständige Box-Score öffnen →
      </button>
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
