import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { getNews } from '@/lib/nfl-live';
import { Bell, ExternalLink } from 'lucide-react';

export const metadata = { title: 'Alerts — wichtige Meldungen' };
export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  // Bis personalisierte Alerts kommen: die neuesten Liga-Meldungen
  const news = await getNews(undefined, 8);

  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 p-6 lg:p-10 max-w-4xl">
        <span className="chip-warn chip">Alerts</span>
        <h1 className="font-display text-4xl font-bold mt-3">
          Wichtige <span className="grad-text italic">Meldungen.</span>
        </h1>
        <p className="text-mute mt-1 text-sm mb-8">
          Personalisierte Alerts (Verletzungen, Trades, Snap-Spikes) kommen in einer
          späteren Phase — hier vorerst die neuesten Liga-Meldungen von ESPN.
        </p>

        <div className="space-y-3">
          {news.length === 0 && (
            <div className="card p-6 text-sm text-mute">Keine Meldungen verfügbar.</div>
          )}
          {news.map((n, i) => (
            <a
              key={i}
              href={n.link ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 flex items-start gap-3 hover:border-primary/50 transition group"
            >
              <span className="w-8 h-8 rounded-lg bg-warn/10 border border-warn/30 text-warn flex items-center justify-center shrink-0">
                <Bell size={14} />
              </span>
              <span className="min-w-0">
                <span className="text-sm font-semibold leading-snug block group-hover:text-primary transition">
                  {n.headline}
                </span>
                {n.published && (
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider">
                    {new Date(n.published).toLocaleString('de-DE', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </span>
              <ExternalLink size={13} className="text-mute shrink-0 ml-auto mt-1" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
