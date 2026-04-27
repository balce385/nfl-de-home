import { ExternalLink } from 'lucide-react';
import type { BeatWriter } from '@/data/team-media';

export function BeatWriters({
  teamName,
  writers,
}: {
  teamName: string;
  writers: BeatWriter[];
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="chip">Beat Writers</span>
          <h3 className="font-display text-lg font-bold mt-2">{teamName}</h3>
        </div>
        <span className="text-xs text-mute font-mono">{writers.length} Quellen</span>
      </div>
      <ul className="space-y-2">
        {writers.map((w) => (
          <li
            key={w.handle}
            className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{w.name || `@${w.handle}`}</div>
              {w.outlet && (
                <div className="text-xs text-mute truncate">{w.outlet}</div>
              )}
            </div>
            <a
              href={`https://x.com/${w.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-primary hover:text-accent flex items-center gap-1 shrink-0"
            >
              @{w.handle}
              <ExternalLink size={11} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
