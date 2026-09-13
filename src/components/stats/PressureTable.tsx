import type { PressureRow } from '@/lib/pfr-advanced';

/**
 * Druck und Wurfqualität je Quarterback.
 *
 * Keine Interaktion nötig — die Tabelle steht fest nach Druckrate sortiert,
 * deshalb eine reine Server-Komponente ohne Client-Code.
 */
export function PressureTable({ rows }: { rows: PressureRow[] }) {
  if (rows.length === 0) return null;

  const pct = (v: number | null) => (v == null ? '—' : `${v.toLocaleString('de-DE')} %`);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th
                scope="col"
                className="text-left font-mono text-[10px] uppercase tracking-wider text-mute px-4 py-3"
              >
                Quarterback
              </th>
              {[
                ['Würfe', 'Pässe in der Saison'],
                ['Unter Druck', 'Anteil der Dropbacks, bei denen die Defense ihn erreicht hat'],
                ['Geblitzt', 'Wie oft die Defense mit Zusatzspielern angegriffen hat'],
                ['Pocket-Zeit', 'Sekunden bis zum Wurf'],
                ['Ins Ziel', 'Anteil der Würfe, die der Receiver fangen konnte'],
                ['Fehlwürfe', 'Anteil schlechter Würfe, ohne Throwaways und Spikes'],
                ['Drops', 'Anteil guter Bälle, die der Receiver fallen ließ'],
              ].map(([label, hint]) => (
                <th
                  key={label}
                  scope="col"
                  title={hint}
                  className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-mute whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.player}-${r.team}`}
                className={`border-b border-line/50 last:border-0 ${i < 3 ? 'bg-primary/5' : ''}`}
              >
                <th scope="row" className="text-left px-4 py-3 font-normal">
                  <span className="font-medium">{r.player}</span>
                  <span className="text-mute font-mono text-xs"> · {r.team}</span>
                </th>
                <td className="px-3 py-3 text-right tabular-nums">
                  {r.attempts.toLocaleString('de-DE')}
                </td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">
                  {pct(r.pressurePct)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{r.blitzed ?? '—'}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {r.pocketTime == null ? '—' : `${r.pocketTime.toLocaleString('de-DE')} s`}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{pct(r.onTargetPct)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{pct(r.badThrowPct)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{pct(r.dropPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
