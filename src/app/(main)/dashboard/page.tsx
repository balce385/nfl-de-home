import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Trophy, Users, Bell, type LucideIcon } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { PlayerStatsCard } from '@/components/dashboard/PlayerStatsCard';
import { createClient } from '@/lib/supabase/server';
import { featuredPlayer, topTeams, articles, liveGame } from '@/lib/mock-data';

type DashboardData = {
  featuredPlayer: typeof featuredPlayer;
  topTeams: typeof topTeams;
  articles: typeof articles;
  liveGame: typeof liveGame;
  stats: { watchlistCount: number; fantasyRank: string; channels: number; alerts: number };
  isLive: boolean;
};

async function fetchDashboardData(token: string | null): Promise<DashboardData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // Graceful fallback to mock data if backend not configured yet
  const fallback: DashboardData = {
    featuredPlayer,
    topTeams,
    articles,
    liveGame,
    stats: { watchlistCount: 12, fantasyRank: '#2', channels: 7, alerts: 4 },
    isLive: false,
  };

  if (!apiUrl || !token) return fallback;

  try {
    const res = await fetch(`${apiUrl}/api/v1/data`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return {
      featuredPlayer: data.featuredPlayer ?? featuredPlayer,
      topTeams: data.topTeams ?? topTeams,
      articles: data.articles ?? articles,
      liveGame: data.liveGame ?? liveGame,
      stats: data.stats ?? fallback.stats,
      isLive: true,
    };
  } catch {
    return fallback;
  }
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const data = await fetchDashboardData(session?.access_token ?? null);

  const firstName =
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'Fan';

  return (
    <div className="flex">
      <DashboardSidebar />

      <div className="flex-1 p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            {!data.isLive && (
              <span className="chip-accent chip">Demo · Backend nicht erreichbar</span>
            )}
            <h1 className="font-display text-4xl font-bold mt-3">
              Hallo <span className="grad-text italic">{firstName}.</span>
            </h1>
            <p className="text-mute mt-1 text-sm">
              Dein Wochenüberblick für Week 8 der Saison 2026.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-mute">
            <span className="live-dot" /> Letzte Aktualisierung: jetzt
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPI
            icon={TrendingUp}
            label="Watchlist-Spieler"
            value={String(data.stats.watchlistCount)}
            change="+3 diese Woche"
            tone="accent"
          />
          <KPI
            icon={Trophy}
            label="Fantasy-Rang"
            value={data.stats.fantasyRank}
            change="von 14"
            tone="primary"
          />
          <KPI
            icon={Users}
            label="Channels"
            value={String(data.stats.channels)}
            change="218 online"
            tone="warn"
          />
          <KPI
            icon={Bell}
            label="Offene Alerts"
            value={String(data.stats.alerts)}
            change="3 ungelesen"
            tone="danger"
          />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Featured Player */}
          <div className="lg:col-span-2">
            <PlayerStatsCard player={data.featuredPlayer} />

            {/* Live Game */}
            <div className="card p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="text-xs font-mono font-bold text-danger">
                    LIVE · Q{data.liveGame.quarter} · {data.liveGame.clock}
                  </span>
                </div>
                <Link href="#" className="text-xs text-primary hover:text-accent">
                  Box-Score →
                </Link>
              </div>
              <div className="space-y-3">
                {[data.liveGame.home, data.liveGame.away].map((t, i) => (
                  <div key={t.code} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-line flex items-center justify-center font-display font-bold">
                        {t.code}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-mute font-mono">{t.record}</div>
                      </div>
                    </div>
                    <div
                      className={`font-display text-3xl font-bold ${i === 1 ? 'text-mute' : ''}`}
                    >
                      {t.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Top Teams + News */}
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold">Top-Teams</h3>
                <span className="chip">Power Ranking</span>
              </div>
              <div className="space-y-3">
                {data.topTeams.map((t, i) => (
                  <div key={t.code} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-mute w-4">{i + 1}.</span>
                    <div className="w-8 h-8 rounded bg-white/5 border border-line flex items-center justify-center text-xs font-bold">
                      {t.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.name}</div>
                      <div className="text-[10px] font-mono text-mute">{t.conference}</div>
                    </div>
                    <span className="text-xs font-mono text-accent">{t.record}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold">Aus dem Magazin</h3>
                <Link href="/magazin" className="text-xs text-primary hover:text-accent">
                  Alle →
                </Link>
              </div>
              <div className="space-y-4">
                {data.articles.slice(0, 3).map((a) => (
                  <Link key={a.slug} href={`/magazin/${a.slug}`} className="block group">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-mute">
                      {a.category} · {a.readingMinutes} Min
                    </div>
                    <div className="text-sm font-semibold mt-0.5 group-hover:text-primary transition leading-snug">
                      {a.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  change,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change: string;
  tone: 'accent' | 'primary' | 'warn' | 'danger';
}) {
  const toneMap = {
    accent: 'text-accent bg-accent/10 border-accent/30',
    primary: 'text-primary bg-primary/10 border-primary/30',
    warn: 'text-warn bg-warn/10 border-warn/30',
    danger: 'text-danger bg-danger/10 border-danger/30',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center ${toneMap[tone]}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="text-xs font-mono text-mute uppercase tracking-wider">{label}</div>
      <div className="font-display font-bold text-3xl mt-1">{value}</div>
      <div className="text-xs text-mute mt-1">{change}</div>
    </div>
  );
}
