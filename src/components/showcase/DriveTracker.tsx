export function DriveTracker({
  offenseCode,
  defenseCode,
  yardLine,
  down,
  distance,
  driveStart,
  driveEnd,
  winProbability,
  totalEpa,
  plays,
}: {
  offenseCode: string;
  defenseCode: string;
  yardLine: number;
  down: number;
  distance: number;
  driveStart: number; // 0-100 from offense's own goal line
  driveEnd: number;   // 0-100
  winProbability: number;
  totalEpa: number;
  plays: number;
}) {
  const driveWidth = Math.max(driveEnd - driveStart, 1);
  const fdMarker = driveEnd + (distance / 100) * 100; // first-down line

  const ord = (n: number) => ['', '1st', '2nd', '3rd', '4th'][n] ?? `${n}th`;

  return (
    <div className="rounded-xl card p-5">
      <div className="flex justify-between text-xs font-mono text-mute mb-2">
        <span>{offenseCode} eigene {yardLine}</span>
        <span>
          {ord(down)} &amp; {distance}
        </span>
        <span>{defenseCode} EZ</span>
      </div>

      {/* Spielfeld */}
      <div className="relative h-5 rounded overflow-hidden"
           style={{ background: 'repeating-linear-gradient(90deg,#22c55e 0,#22c55e 9.99%,#16a34a 10%,#16a34a 10.01%)' }}>
        {/* Drive-Bereich */}
        <div
          className="absolute top-0 bottom-0 bg-danger/85 rounded"
          style={{ left: `${driveStart}%`, width: `${driveWidth}%` }}
        />
        {/* First-Down-Marker */}
        <div
          className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-warn"
          style={{ left: `${Math.min(fdMarker, 100)}%` }}
        />
      </div>

      {/* Yard-Achse */}
      <div className="flex justify-between text-[10px] text-mute font-mono mt-1.5">
        {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat label="Win-Prob." value={`${Math.round(winProbability)}%`} accent />
        <Stat label="Drive EPA" value={(totalEpa >= 0 ? '+' : '') + totalEpa.toFixed(1)} />
        <Stat label="Plays" value={plays.toString()} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center font-mono">
      <div className="text-[10px] text-mute uppercase">{label}</div>
      <div className={`text-sm font-bold tabular-nums mt-0.5 ${accent ? 'text-accent' : ''}`}>
        {value}
      </div>
    </div>
  );
}
