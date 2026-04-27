export type RankedTeam = {
  rank: number;
  code: string;
  name: string;
  color: string; // hex
  movement: number; // positive = up, negative = down, 0 = same
};

export function PowerRankings({ teams }: { teams: RankedTeam[] }) {
  return (
    <div className="card p-4 text-sm">
      {teams.map((t, i) => {
        const isLast = i === teams.length - 1;
        const movementColor =
          t.movement > 0 ? 'text-accent' : t.movement < 0 ? 'text-danger' : 'text-mute';
        const movementIcon = t.movement > 0 ? '▲' : t.movement < 0 ? '▼' : '—';
        return (
          <div
            key={t.code}
            className={`flex items-center gap-2.5 py-1.5 ${
              isLast ? '' : 'border-b border-line/50'
            }`}
          >
            <span className="font-mono text-xs text-mute w-5">#{t.rank}</span>
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.code}
            </div>
            <span className="flex-1">{t.name}</span>
            <span className={`font-mono text-xs ${movementColor}`}>
              {movementIcon} {Math.abs(t.movement) || ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
