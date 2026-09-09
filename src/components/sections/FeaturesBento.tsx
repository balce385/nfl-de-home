'use client';

/**
 * "Dein Team" — Bento-Grid mit Live-Daten des gewählten Teams.
 *
 * Alle Kacheln speisen sich aus den server-seitigen Proxys
 * /api/team-overview, /api/team-news und /api/team-stats (ESPN sendet keine
 * CORS-Header). Das Team kommt aus dem TeamSelectionProvider im Root-Layout
 * und ist im Browser gespeichert.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CalendarDays, Heart, MapPin, Newspaper, Trophy } from 'lucide-react';
import { useTeamSelection } from '@/components/TeamSelectionContext';

type TeamOption = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string | null;
};

type TeamGame = {
  week: number | null;
  date: string | null;
  state: 'pre' | 'in' | 'post';
  opponent: string;
  opponentName: string;
  opponentLogo: string | null;
  home: boolean;
  teamScore: number | null;
  opponentScore: number | null;
  venue: string;
};

type Overview = {
  id: string;
  name: string;
  shortName: string;
  logo: string | null;
  color: string;
  standingSummary: string;
  record: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  next: TeamGame | null;
  last: TeamGame | null;
  upcoming: TeamGame[];
};

type NewsItem = { headline: string; description: string; published: string | null; link: string | null };

type QbStats = {
  name: string;
  position: string;
  stats: { passYards: number; touchdowns: number; interceptions: number; qbr: number };
  trend: number[];
};

const dateFmt = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});
const shortFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Europe/Berlin',
});

const formatKickoff = (iso: string | null) => (iso ? `${dateFmt.format(new Date(iso))} Uhr` : 'Termin offen');

function daysUntil(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  return `in ${days} Tagen`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

/** Kleines Logo mit Farbpunkt als Rückfallebene. */
function TeamLogo({ src, alt, size = 28, color }: { src: string | null; alt: string; size?: number; color?: string }) {
  if (!src) {
    return (
      <span
        className="inline-block rounded-full shrink-0"
        style={{ width: size, height: size, backgroundColor: color ?? '#3b82f6' }}
        aria-hidden
      />
    );
  }
  return <Image src={src} alt={alt} width={size} height={size} unoptimized className="shrink-0" />;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

export function FeaturesBento({ teams }: { teams: TeamOption[] }) {
  const shared = useTeamSelection();
  const local = useState<string>('KC');
  const selected = shared ? shared.selected : local[0];
  const setSelected = shared ? shared.setSelected : local[1];

  const [overview, setOverview] = useState<Overview | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [qb, setQb] = useState<QbStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setOverview(null);
    setNews(null);
    setQb(null);
    setFailed(false);

    const json = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(url))));
    const team = encodeURIComponent(selected);

    json(`/api/team-overview?team=${team}`)
      .then((d) => !cancelled && setOverview(d))
      .catch(() => !cancelled && setFailed(true));
    json(`/api/team-news?team=${team}&limit=4`)
      .then((d) => !cancelled && setNews(d?.articles ?? []))
      .catch(() => !cancelled && setNews([]));
    json(`/api/team-stats?team=${team}`)
      .then((d) => !cancelled && setQb(d))
      .catch(() => !cancelled && setQb(null));

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const team = teams.find((t) => t.id === selected);
  const teamName = overview?.name ?? team?.name ?? selected;
  const accent = overview?.color ?? team?.color ?? '#3b82f6';
  const trend = qb?.trend?.length ? qb.trend : null;
  const maxTrend = trend ? Math.max(...trend, 1) : 1;

  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="chip">Dein Team, deine Daten</span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
              Alles zu den <span className="grad-text italic">{overview?.shortName ?? team?.shortName ?? 'Chiefs'}</span>.
            </h2>
            <p className="text-mute mt-4 text-lg">
              Bilanz, nächstes Spiel, Spielplan und News — live von ESPN, für das Team deiner Wahl.
            </p>
          </div>

          {/* Team-Wechsel direkt hier, damit man für die Kacheln nicht scrollen muss */}
          <label className="flex items-center gap-3">
            <span className="text-xs font-mono text-mute uppercase tracking-wide">Team</span>
            <span className="flex items-center gap-2 card px-3 py-2">
              <TeamLogo src={overview?.logo ?? team?.logo ?? null} alt="" size={22} color={accent} />
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                aria-label="Team auswählen"
                className="bg-transparent text-sm font-medium outline-none cursor-pointer"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-bg text-ink">
                    {t.name}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>

        {failed && (
          <p className="card p-5 text-sm text-mute mb-6">
            Live-Daten von ESPN sind gerade nicht erreichbar. Die Kacheln füllen sich, sobald die
            Verbindung wieder steht.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {/* Großes Tile: Team + Bilanz + QB-Trend */}
          <div className="card card-glow p-6 md:col-span-2 lg:col-span-2 row-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <TeamLogo src={overview?.logo ?? team?.logo ?? null} alt={teamName} size={44} color={accent} />
                <div>
                  <h3 className="font-display text-2xl font-bold leading-tight">{teamName}</h3>
                  {overview ? (
                    <p className="text-xs text-mute font-mono mt-0.5">
                      {overview.record} · {overview.standingSummary || 'Division-Platz folgt'}
                    </p>
                  ) : (
                    <Skeleton className="h-3 w-40 mt-2" />
                  )}
                </div>
              </div>

              {qb ? (
                <div className="mt-6 grid grid-cols-4 gap-3">
                  {[
                    ['Pass-Yards', qb.stats.passYards.toLocaleString('de-DE')],
                    ['TD', String(qb.stats.touchdowns)],
                    ['INT', String(qb.stats.interceptions)],
                    ['QBR', String(qb.stats.qbr)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="font-display text-xl font-bold">{value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-mute">{label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              )}
              {qb && (
                <p className="text-xs text-mute mt-3">
                  {qb.name} · {qb.position} — Saisonwerte, Balken = Pass-Yards der letzten Spiele.
                </p>
              )}
            </div>

            <div className="flex items-end gap-2 h-24 mt-6" aria-hidden>
              {(trend ?? Array(10).fill(0)).map((yds, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t transition-all ${trend ? '' : 'animate-pulse'}`}
                  style={{
                    height: `${trend ? Math.max(8, (yds / maxTrend) * 100) : 30}%`,
                    backgroundColor: i === (trend?.length ?? 0) - 1 ? accent : 'rgba(255,255,255,0.14)',
                  }}
                  title={trend ? `${yds} Yards` : undefined}
                />
              ))}
            </div>
          </div>

          {/* Nächstes Spiel */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <CalendarDays size={18} className="text-primary" />
            </div>
            {overview?.next ? (
              <div>
                <span className="chip-accent chip text-[9px]">
                  {overview.next.home ? 'Heimspiel' : 'Auswärts'}
                  {overview.next.week ? ` · Woche ${overview.next.week}` : ''}
                </span>
                <h3 className="font-display text-lg font-bold mt-2 flex items-center gap-2">
                  <TeamLogo src={overview.next.opponentLogo} alt="" size={20} />
                  {overview.next.opponent}
                </h3>
                <p className="text-xs text-mute mt-1">{formatKickoff(overview.next.date)}</p>
                {daysUntil(overview.next.date) && (
                  <p className="text-[11px] font-mono text-primary mt-1">{daysUntil(overview.next.date)}</p>
                )}
              </div>
            ) : overview ? (
              <p className="text-xs text-mute">Kein weiteres Spiel angesetzt.</p>
            ) : (
              <Skeleton className="h-16" />
            )}
          </div>

          {/* Bilanz / Punkte */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-warn/15 border border-warn/30 flex items-center justify-center">
              <Trophy size={18} className="text-warn" />
            </div>
            {overview ? (
              <div>
                <h3 className="font-display text-lg font-bold">
                  {overview.wins}&ndash;{overview.losses}
                  {overview.ties ? `–${overview.ties}` : ''}
                </h3>
                <p className="text-xs text-mute mt-1">{overview.standingSummary || 'Saisonstart'}</p>
                <p className="text-[11px] font-mono text-mute mt-2">
                  {overview.pointsFor} : {overview.pointsAgainst} Punkte
                </p>
              </div>
            ) : (
              <Skeleton className="h-16" />
            )}
          </div>

          {/* Team-News */}
          <div className="card p-6 lg:col-span-2 overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="chip">Live · ESPN</span>
                <h3 className="font-display text-lg font-bold mt-2">News zu deinem Team</h3>
              </div>
              <Newspaper size={18} className="text-mute shrink-0" />
            </div>
            {news === null ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : news.length === 0 ? (
              <p className="text-xs text-mute mt-4">Aktuell keine News für {teamName}.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {news.slice(0, 3).map((n, i) => (
                  <li key={i} className="text-xs leading-snug">
                    <a
                      href={n.link ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary transition line-clamp-1"
                    >
                      {n.headline}
                    </a>
                    <span className="text-[10px] font-mono text-mute">{relativeTime(n.published)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Spielplan */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              Nächste Spiele
              {overview?.last && (
                <span className="chip text-[9px]">
                  zuletzt {overview.last.teamScore}:{overview.last.opponentScore} vs {overview.last.opponent}
                </span>
              )}
            </h3>
            {overview ? (
              overview.upcoming.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  {overview.upcoming.slice(0, 4).map((g, i) => (
                    <div key={i} className="bg-black/30 rounded px-3 py-2 border border-line">
                      <div className="flex items-center gap-1.5">
                        <span className="text-mute">{g.home ? 'vs' : '@'}</span>
                        <TeamLogo src={g.opponentLogo} alt="" size={16} />
                        <span className="font-semibold">{g.opponent}</span>
                      </div>
                      <div className="text-mute mt-1">{g.date ? shortFmt.format(new Date(g.date)) : '—'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-mute mt-4">Saison beendet — der neue Spielplan folgt.</p>
              )
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            )}
          </div>

          {/* Stadion des nächsten Spiels */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <MapPin size={18} className="text-accent" />
            </div>
            {overview?.next ? (
              <div>
                <h3 className="font-display text-base font-bold leading-tight">{overview.next.venue || 'Stadion offen'}</h3>
                <p className="text-xs text-mute mt-1">
                  {overview.next.home ? 'Heimspiel' : `zu Gast bei ${overview.next.opponentName}`}
                </p>
              </div>
            ) : (
              <Skeleton className="h-12" />
            )}
          </div>

          {/* Kostenlos */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Heart size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">100 % kostenlos</h3>
              <p className="text-xs text-mute mt-1">Keine Paywall · keine Kreditkarte</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
