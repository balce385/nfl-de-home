import { User, Search, Zap, Heart } from 'lucide-react';

export function FeaturesBento() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <span className="chip">Was du bekommst</span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
            Alles, was ein <span className="grad-text italic">echter Fan</span> braucht.
          </h2>
          <p className="text-mute mt-4 text-lg">
            Neun Module, ein Login. Vom Live-Score bis zur Trade-Analyse.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {/* Dashboard - groß */}
          <div className="card card-glow p-6 md:col-span-2 lg:col-span-2 row-span-2 flex flex-col justify-between">
            <div>
              <span className="chip-accent chip">Personalisiert</span>
              <h3 className="font-display text-2xl font-bold mt-4">
                Dein Dashboard, deine Teams.
              </h3>
              <p className="text-mute mt-2 text-sm">
                Live-Stats, Win-Probability, Snap-Counts und Verletztenreport — alles auf einen
                Blick.
              </p>
            </div>
            <div className="flex items-end gap-2 h-24 mt-6">
              {[30, 55, 42, 78, 60, 38, 88, 65, 50, 95].map((h, i) => (
                <div
                  key={i}
                  className={`w-full ${i % 3 === 0 ? 'bar-accent' : 'bar'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Auth */}
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
              <User size={18} className="text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold">Sicherer Login</h3>
            <p className="text-xs text-mute mt-1">E-Mail, Google, Apple · DSGVO-konform</p>
          </div>

          {/* Suche */}
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-warn/15 border border-warn/30 flex items-center justify-center mb-4">
              <Search size={18} className="text-warn" />
            </div>
            <h3 className="font-display text-lg font-bold">Blitz-Suche</h3>
            <p className="text-xs text-mute mt-1">Spieler, Teams, Saisons · &lt;500ms</p>
          </div>

          {/* Chat */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="chip">Echtzeit</span>
                <h3 className="font-display text-lg font-bold mt-3">Community-Chat</h3>
                <p className="text-xs text-mute mt-1 max-w-xs">
                  Diskutiere jede Play in Live-Channels mit anderen Fans.
                </p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-primary border-2 border-bg text-[10px] font-bold flex items-center justify-center text-white">
                  JM
                </div>
                <div className="w-7 h-7 rounded-full bg-accent border-2 border-bg text-[10px] font-bold flex items-center justify-center text-white">
                  LK
                </div>
                <div className="w-7 h-7 rounded-full bg-warn border-2 border-bg text-[10px] font-bold flex items-center justify-center text-white">
                  +8
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-accent font-mono font-bold">@thomas_b</span>
                <span className="text-ink">Mahomes ist heute on fire 🔥</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-warn font-mono font-bold">@nina_82</span>
                <span className="text-ink">Diese Defense von KC ist nicht zu stoppen</span>
              </div>
            </div>
          </div>

          {/* API */}
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center mb-4">
              <Zap size={18} className="text-accent" />
            </div>
            <h3 className="font-display text-lg font-bold">API v1</h3>
            <p className="text-xs text-mute mt-1">REST · JWT · OpenAPI-Docs</p>
          </div>

          {/* Magazin */}
          <div className="card p-6">
            <span className="chip-warn chip">Magazin</span>
            <h3 className="font-display text-lg font-bold mt-3">Redaktion</h3>
            <p className="text-xs text-mute mt-1">Wöchentliche Tiefenanalysen</p>
          </div>

          {/* Auto-Posting */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              Auto-Scheduler
              <span className="chip-accent chip text-[9px]">NEU</span>
            </h3>
            <p className="text-xs text-mute mt-1">
              Plane Posts auf X, Threads &amp; Bluesky direkt aus dem Hub.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[11px] font-mono">
              <div className="flex-1 bg-black/30 rounded px-3 py-2 border border-line">
                ▶ Mi 14:00 · Game-Recap
              </div>
              <div className="flex-1 bg-black/30 rounded px-3 py-2 border border-line">
                ⏸ Do 09:30 · Power Rankings
              </div>
            </div>
          </div>

          {/* Komplett kostenlos */}
          <div className="card p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center mb-4">
              <Heart size={18} className="text-accent" />
            </div>
            <h3 className="font-display text-lg font-bold">100 % kostenlos</h3>
            <p className="text-xs text-mute mt-1">Keine Paywall · keine Kreditkarte</p>
          </div>
        </div>
      </div>
    </section>
  );
}
