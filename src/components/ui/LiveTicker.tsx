import { tickerScores } from '@/lib/mock-data';

export function LiveTicker() {
  const items = (
    <div className="flex items-center gap-12">
      {tickerScores.map((s, i) => (
        <span key={i} className="flex items-center gap-2 text-mute">
          {s.live && (
            <>
              <span className="live-dot" />
              <span className="text-danger font-bold">LIVE</span>
            </>
          )}
          <span>{s.away}</span>
          <span className="text-ink">{s.awayScore}</span>
          <span>—</span>
          <span>{s.home}</span>
          <span className="text-ink">{s.homeScore}</span>
          <span>· {s.status}</span>
        </span>
      ))}
      <span className="text-accent">▲ Mahomes 312 YDS · 3 TD</span>
      <span className="text-warn">★ Hurts 287 YDS · 2 TD · 1 INT</span>
      <span className="text-mute">Waiver-Wire öffnet Mi 03:00 MEZ</span>
    </div>
  );

  return (
    <div className="border-b border-line bg-black/30 backdrop-blur-sm overflow-hidden">
      <div className="flex gap-12 py-2 text-xs font-mono tracking-wider whitespace-nowrap animate-ticker">
        {items}
        <div aria-hidden="true">{items}</div>
      </div>
    </div>
  );
}
