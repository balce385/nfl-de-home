import { Play } from 'lucide-react';
import Image from 'next/image';

export type TeamVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt?: string | null;
  channelTitle?: string | null;
};

function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 30) return `vor ${days} Tagen`;
  const months = Math.floor(days / 30);
  return `vor ${months} Mon.`;
}

export function YouTubeFeed({
  teamName,
  videos,
  channelHandle,
}: {
  teamName: string;
  videos: TeamVideo[];
  channelHandle?: string;
}) {
  if (videos.length === 0) {
    return (
      <div className="card p-5">
        <span className="chip">YouTube</span>
        <p className="text-sm text-mute mt-3">
          Noch keine Videos für {teamName}. Scraper läuft beim nächsten Cron.
        </p>
      </div>
    );
  }

  const visible = videos.slice(0, 4);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="chip">YouTube</span>
          <h3 className="font-display text-lg font-bold mt-2">{teamName} Channel</h3>
        </div>
        {channelHandle && (
          <a
            href={`https://youtube.com/${channelHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-primary hover:text-accent"
          >
            {channelHandle}
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visible.map((v) => (
          <a
            key={v.videoId}
            href={`https://www.youtube.com/watch?v=${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg overflow-hidden bg-black/30 border border-line hover:border-primary/50 transition"
          >
            <div className="relative aspect-video bg-black">
              <Image
                src={v.thumbnailUrl}
                alt={v.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition">
                <div className="w-10 h-10 rounded-full bg-danger/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Play size={16} className="text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="p-2.5">
              <div className="text-xs font-medium line-clamp-2 leading-snug">{v.title}</div>
              <div className="text-[10px] text-mute font-mono mt-1.5">
                {relativeTime(v.publishedAt)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
