export type RankedTeam = {
  rank: number;
  code: string;
  name: string;
  color: string; // hex
  /**
   * Punktedifferenz aus den Live-Standings. Vorher stand hier ein
   * Auf-/Absteiger-Pfeil, der immer 0 war und deshalb bei jedem Team nur
   * einen Strich zeigte — wir speichern keine Rangliste der Vorwoche.
   */
  differential: number;
};

export function PowerRankings({ teams }: { teams: RankedTeam[] }) {
  return (
    <div className="card p-4 text-sm">
      {teams.map((t, i) => {
        const isLast = i === teams.length - 1;
        const diffColor =
          t.differential > 0 ? 'text-accent' : t.differential < 0 ? 'text-danger' : 'text-mute';
        const sign = t.differential > 0 ? '+' : '';
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
            <span
              className={`font-mono text-xs tabular-nums ${diffColor}`}
              title="Punktedifferenz"
            >
              {sign}
              {t.differential}
            </span>
          </div>
        );
      })}
    </div>
  );
}
