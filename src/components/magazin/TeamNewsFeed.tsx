'use client';

/**
 * Live-News-Feed mit Team-Auswahl für das Magazin.
 *
 * Das gewählte Team kommt aus dem TeamSelectionProvider (Root-Layout) und gilt
 * damit auch auf der Startseite. Zusätzlich gibt es "Alle Teams" für die
 * ligaweiten News — diese Wahl bleibt lokal, sie überschreibt das Lieblingsteam
 * nicht.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useTeamSelection } from '@/components/TeamSelectionContext';

type TeamOption = { id: string; name: string; shortName: string; color: string; logo: string | null };

type NewsItem = {
  headline: string;
  description: string;
  published: string | null;
  link: string | null;
  image: string | null;
};

const ALL = '__ALL__';

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `vor ${Math.max(1, mins)} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'gestern' : `vor ${days} Tagen`;
}

export function TeamNewsFeed({ teams }: { teams: TeamOption[] }) {
  const shared = useTeamSelection();
  const fallback = useState<string>('KC');
  const favourite = shared ? shared.selected : fallback[0];
  const setFavourite = shared ? shared.setSelected : fallback[1];

  // ALL = ligaweite News. Sonst folgt der Feed dem Lieblingsteam.
  const [scope, setScope] = useState<string>(favourite);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Wechselt der Nutzer sein Team woanders, zieht der Feed mit —
  // außer er hat hier bewusst "Alle Teams" gewählt.
  useEffect(() => {
    setScope((current) => (current === ALL ? ALL : favourite));
  }, [favourite]);

  useEffect(() => {
    let cancelled = false;
    setNews(null);
    setFailed(false);

    const query = scope === ALL ? '' : `team=${encodeURIComponent(scope)}&`;
    fetch(`/api/team-news?${query}limit=12`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('news'))))
      .then((d) => !cancelled && setNews(d?.articles ?? []))
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [scope]);

  const activeTeam = teams.find((t) => t.id === scope);

  const choose = (id: string) => {
    setScope(id);
    // Ein echtes Team wird auch als Lieblingsteam gemerkt.
    if (id !== ALL) setFavourite(id);
  };

  return (
    <section className="mb-16">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="chip chip-accent">Live · ESPN</span>
          <h2 className="font-display text-3xl font-bold mt-3">
            News zu <span className="grad-text italic">{activeTeam?.shortName ?? 'allen Teams'}</span>
          </h2>
          <p className="text-mute mt-2 text-sm">
            Wähle dein Team — die Auswahl gilt auch auf der Startseite.
          </p>
        </div>
      </div>

      {/* Team-Auswahl */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => choose(ALL)}
          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
            scope === ALL ? 'border-primary bg-primary/10 text-ink' : 'border-line bg-white/5 text-mute hover:bg-white/10'
          }`}
        >
          Alle Teams
        </button>
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => choose(t.id)}
            title={t.name}
            aria-pressed={scope === t.id}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border transition ${
              scope === t.id ? 'border-primary bg-primary/10' : 'border-line bg-white/5 hover:bg-white/10'
            }`}
          >
            {t.logo ? (
              <Image src={t.logo} alt="" width={20} height={20} unoptimized />
            ) : (
              <span className="w-5 h-5 rounded-full inline-block" style={{ backgroundColor: t.color }} />
            )}
            <span className="text-[10px] font-mono text-mute">{t.id}</span>
          </button>
        ))}
      </div>

      {failed && <p className="card p-5 text-sm text-mute">News von ESPN gerade nicht erreichbar.</p>}

      {news === null && !failed && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-32 rounded bg-white/10" />
              <div className="h-4 w-4/5 rounded bg-white/10 mt-4" />
              <div className="h-3 w-3/5 rounded bg-white/10 mt-2" />
            </div>
          ))}
        </div>
      )}

      {news && news.length === 0 && (
        <p className="card p-5 text-sm text-mute">
          Keine aktuellen News für {activeTeam?.name ?? 'die NFL'}.
        </p>
      )}

      {news && news.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((n, i) => (
            <a
              key={i}
              href={n.link ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="card overflow-hidden hover:border-primary/50 transition flex flex-col"
            >
              {n.image ? (
                <Image
                  src={n.image}
                  alt=""
                  width={640}
                  height={360}
                  unoptimized
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-primary/20 via-bg to-bg" />
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-display text-lg font-bold leading-snug">{n.headline}</h3>
                {n.description && <p className="text-sm text-mute mt-2 line-clamp-3 flex-1">{n.description}</p>}
                <div className="flex items-center justify-between mt-4 text-[11px] font-mono text-mute">
                  <span>{relativeTime(n.published)}</span>
                  <span className="flex items-center gap-1 text-primary">
                    ESPN <ExternalLink size={11} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
