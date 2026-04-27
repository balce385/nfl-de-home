type Team = {
  code: string;
  name: string;
  score: number;
  color: string; // CSS hex
};

export function StadiumScoreboard({
  home,
  away,
  quarter = 3,
  clock = '8:42',
  venue = 'SoFi Stadium',
  isLive = true,
}: {
  home: Team;
  away: Team;
  quarter?: number;
  clock?: string;
  venue?: string;
  isLive?: boolean;
}) {
  const winner = home.score > away.score ? 'home' : away.score > home.score ? 'away' : null;

  return (
    <div className="rounded-xl bg-[#0a0e1a] border border-line p-5 font-mono text-white">
      <div className="flex justify-between items-center text-[10px] tracking-widest mb-4">
        <span className={`flex items-center gap-2 ${isLive ? 'text-danger' : 'text-mute'}`}>
          {isLive && <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />}
          {isLive ? `LIVE · Q${quarter} · ${clock}` : 'FINAL'}
        </span>
        <span className="text-mute uppercase">{venue}</span>
      </div>

      {[
        { ...home, side: 'home' as const },
        { ...away, side: 'away' as const },
      ].map((t) => {
        const isWinner = winner === t.side;
        return (
          <div
            key={t.code}
            className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-2 border-b border-white/5 last:border-0"
          >
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: t.color }}
            >
              {t.code}
            </div>
            <span className={`text-sm ${isWinner ? 'text-white' : 'text-mute'}`}>{t.name}</span>
            <span
              className={`text-3xl font-bold tabular-nums ${
                isWinner ? 'text-accent' : 'text-mute'
              }`}
            >
              {t.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
