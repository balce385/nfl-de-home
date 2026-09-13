import Link from 'next/link';
import { TrendingUp, Trophy, Users, Bell, type LucideIcon } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { PlayerExplorer } from '@/components/dashboard/PlayerExplorer';
import { createClient } from '@/lib/supabase/server';
import { getScoreboard, getStandings, getAllTeams, getNews } from '@/lib/nfl-live';
import { getCommunityStats } from '@/lib/community';
import { featuredPlayer, topTeams, articles, liveGame } from '@/lib/mock-data';

type DashboardData = {
  featuredPlayer: typeof featuredPlayer;
  topTeams: typeof topTeams;
  articles: typeof articles;
  liveGame: typeof liveGame;
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
      isLive: true,
    };
  } catch {
    return fallback;
  }
}

export const metadata = { title: 'Dashboard — dein Wochenueberblick' };

export default async function DashboardPage() {
  // Kein Login mehr nötig — Dashboard ist offen.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Live-Daten (ESPN) parallel zu den Dashboard-Daten laden
  const [data, liveGames, standings, allTeams, community, news] = await Promise.all([
    fetchDashboardData(session?.access_token ?? null),
    getScoreboard(),
    getStandings(),
    getAllTeams(),
    getCommunityStats(),
    getNews(undefined, 20),
  ]);

  // Woche und Saison kommen aus den Live-Daten, nicht aus einer festen Zahl.
  const season = liveGames.find((g) => g.season)?.season ?? null;
  const week = liveGames.find((g) => g.week)?.week ?? null;
  const liveNow = liveGames.filter((g) => g.state === 'in').length;
  const bestTeam = standings[0] ?? null;

  // Mock-Daten durch Live-Daten ersetzen, sobald verfügbar
  const espnGame =
    liveGames.find((g) => g.state === 'in') ??
    liveGames.find((g) => g.state === 'post') ??
    liveGames[0] ??
    null;
  const recordByCode = new Map(standings.map((s) => [s.code, s.record]));
  if (espnGame) {
    data.liveGame = {
      ...data.liveGame,
      status: espnGame.state === 'in' ? 'live' : espnGame.state === 'post' ? 'final' : 'scheduled',
      clock: espnGame.statusText,
      venue: espnGame.venue,
      home: {
        ...data.liveGame.home,
        code: espnGame.home.code,
        name: espnGame.home.name,
        score: espnGame.home.score,
        record: recordByCode.get(espnGame.home.code) ?? '',
      },
      away: {
        ...data.liveGame.away,
        code: espnGame.away.code,
        name: espnGame.away.name,
        score: espnGame.away.score,
        record: recordByCode.get(espnGame.away.code) ?? '',
      },
    };
  }
  if (standings.length > 0) {
    data.topTeams = standings.slice(0, 6).map((s) => ({
      code: s.code,
      name: s.name,
      record: s.record,
      conference: s.conference,
      score: 0,
      color: 'blue' as const,
    }));
  }

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Fan';

  return (
    <div className="flex">
      <DashboardSidebar />

      <div className="flex-1 p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            {liveGames.length === 0 && (
              <span className="chip-accent chip">Keine Live-Daten erreichbar</span>
            )}
            <h1 className="font-display text-4xl font-bold mt-3">
              Hallo <span className="grad-text italic">{firstName}.</span>
            </h1>
            <p className="text-mute mt-1 text-sm">
              {week && season
                ? `Dein Wochenüberblick für Week ${week} der Saison ${season}.`
                : 'Dein Wochenüberblick — sobald die nächsten Spiele angesetzt sind.'}
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
            label="Spiele diese Woche"
            value={String(liveGames.length)}
            change={liveNow > 0 ? `${liveNow} laufen gerade` : 'keins läuft gerade'}
            tone="accent"
          />
          <KPI
            icon={Trophy}
            label="Bestes Team"
            value={bestTeam?.code ?? '—'}
            change={bestTeam ? bestTeam.record : 'Standings laden'}
            tone="primary"
          />
          <KPI
            icon={Users}
            label="Channels"
            value={String(community.channels.length)}
            change={`${community.memberCount.toLocaleString('de-DE')} ${
              community.memberCount === 1 ? 'Mitglied' : 'Mitglieder'
            }`}
            tone="warn"
          />
          <KPI
            icon={Bell}
            label="Meldungen"
            value={String(news.length)}
            change="live von ESPN"
            tone="danger"
          />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Spieler-Auswahl (alle Teams, Live-Roster) */}
          <div className="lg:col-span-2">
            <PlayerExplorer
              teams={allTeams.map((t) => ({
                id: t.id,
                name: t.name,
                shortName: t.shortName,
                color: t.color,
                logo: t.logo,
              }))}
            />

            {/* Live Game */}
            <div className="card p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="text-xs font-mono font-bold text-danger">
                    {data.liveGame.status === 'live' ? 'LIVE · ' : ''}
                    {data.liveGame.clock}
                  </span>
                </div>
                <Link href="/news" className="text-xs text-primary hover:text-accent">
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
