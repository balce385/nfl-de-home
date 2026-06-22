import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { getNews } from '@/lib/nfl-live';
import { ExternalLink } from 'lucide-react';

export const metadata = { title: 'News-Feed — aktuelle NFL-Meldungen' };
export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const news = await getNews(undefined, 20);

  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-10 max-w-4xl">
        <span className="chip">News-Feed</span>
        <h1 className="font-display text-4xl font-bold mt-3">
          Aktuelle <span className="grad-text italic">Meldungen.</span>
        </h1>
        <p className="text-mute mt-1 text-sm mb-8">
          Liga-weite News, live von der ESPN-API (5-Minuten-Cache).
        </p>

        {news.length === 0 && (
          <div className="card p-6 text-sm text-mute">News momentan nicht erreichbar.</div>
        )}

        <div className="space-y-4">
          {news.map((n, i) => (
            <a
              key={i}
              href={n.link ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-5 block hover:border-primary/50 transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug group-hover:text-primary transition">
                    {n.headline}
                  </h2>
                  {n.description && (
                    <p className="text-sm text-mute mt-1.5 leading-relaxed">{n.description}</p>
                  )}
                  <div className="text-[10px] font-mono text-mute mt-2 uppercase tracking-wider">
                    ESPN
                    {n.published &&
                      ` · ${new Date(n.published).toLocaleString('de-DE', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                  </div>
                </div>
                <ExternalLink size={14} className="text-mute shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
