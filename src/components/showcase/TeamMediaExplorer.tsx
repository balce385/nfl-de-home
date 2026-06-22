'use client';

/**
 * Team-Auswahl für alle 32 NFL-Teams:
 * Logo-Grid → Beat Writers (Quelle: fiddlespicks.substack.com) + offizieller
 * YouTube-Channel + Live-News des Teams über den server-seitigen Proxy
 * /api/team-news (umgeht ESPNs fehlenden CORS-Header).
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Newspaper, Youtube } from 'lucide-react';
import { BeatWriters } from './BeatWriters';
import { getTeamMedia } from '@/data/team-media';
import { useTeamSelection } from '@/components/TeamSelectionContext';

export type ExplorerTeam = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string | null;
};

type News = {
  headline: string;
  description: string;
  published: string | null;
  link: string | null;
};

function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

export function TeamMediaExplorer({ teams }: { teams: ExplorerTeam[] }) {
  // Geteilter Status mit der Vorschau-Karte oben; lokaler Fallback ohne Provider.
  const shared = useTeamSelection();
  const local = useState<string>('KC');
  const selected = shared ? shared.selected : local[0];
  const setSelected = shared ? shared.setSelected : local[1];

  const [news, setNews] = useState<News[] | null>(null);
  const [newsError, setNewsError] = useState(false);

  const team = teams.find((t) => t.id === selected);
  const media = getTeamMedia(selected);

  useEffect(() => {
    let cancelled = false;
    setNews(null);
    setNewsError(false);
    fetch(`/api/team-news?team=${encodeURIComponent(selected)}&limit=5`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setNews(
          (data?.articles ?? []).map((a: any) => ({
            headline: a.headline ?? '',
            description: a.description ?? '',
            published: a.published ?? null,
            link: a.link ?? null,
          }))
        );
      })
      .catch(() => !cancelled && setNewsError(true));
    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <div>
      {/* Team-Grid: alle 32 Teams */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            title={t.name}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition ${
              selected === t.id
                ? 'border-primary bg-primary/10'
                : 'border-line bg-white/5 hover:bg-white/10'
            }`}
          >
            {t.logo ? (
              <Image src={t.logo} alt={t.name} width={28} height={28} unoptimized />
            ) : (
              <span
                className="w-7 h-7 rounded-full inline-block"
                style={{ backgroundColor: t.color }}
              />
            )}
            <span className="text-[10px] font-mono text-mute">{t.id}</span>
          </button>
        ))}
      </div>

      {team && (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Beat Writers + YouTube */}
          <div className="space-y-4">
            {media ? (
              <BeatWriters teamName={team.name} writers={media.writers} />
            ) : (
              <div className="card p-5 text-sm text-mute">
                Keine Beat-Writer für {team.name} hinterlegt.
              </div>
            )}
            {media && (
              <a
                href={`https://youtube.com/${media.youtubeHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 flex items-center justify-between hover:border-primary/50 transition"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Youtube size={18} className="text-danger" />
                  Offizieller YouTube-Channel
                </span>
                <span className="text-xs font-mono text-primary flex items-center gap-1">
                  {media.youtubeHandle} <ExternalLink size={11} />
                </span>
              </a>
            )}
          </div>

          {/* Live-News (ESPN) */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="chip chip-accent">Live-News · ESPN</span>
                <h3 className="font-display text-lg font-bold mt-2">{team.name}</h3>
              </div>
              <Newspaper size={18} className="text-mute" />
            </div>
            {news === null && !newsError && (
              <p className="text-sm text-mute animate-pulse">Lade News …</p>
            )}
            {newsError && (
              <p className="text-sm text-mute">News momentan nicht erreichbar.</p>
            )}
            {news && news.length === 0 && (
              <p className="text-sm text-mute">Keine aktuellen News.</p>
            )}
            {news && news.length > 0 && (
              <ul className="space-y-3">
                {news.map((n, i) => (
                  <li key={i} className="py-2 px-3 rounded-lg bg-white/5">
                    <a
                      href={n.link ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-primary transition leading-snug block"
                    >
                      {n.headline}
                    </a>
                    {n.description && (
                      <p className="text-xs text-mute mt-1 line-clamp-2">{n.description}</p>
                    )}
                    <span className="text-[10px] font-mono text-mute">
                      {relativeTime(n.published)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
