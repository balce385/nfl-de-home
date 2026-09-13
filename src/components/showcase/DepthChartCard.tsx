'use client';

import { useEffect, useState } from 'react';
import type { DepthGroup } from '@/lib/depth-chart';

type Payload = { asOf: string | null; groups: DepthGroup[] };

const stamp = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Berlin',
});

export function DepthChartCard({ team }: { team: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setFailed(false);
    fetch(`/api/team-depth?team=${encodeURIComponent(team)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('depth'))))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [team]);

  if (failed) {
    return <div className="card p-5 text-sm text-mute">Depth Chart gerade nicht erreichbar.</div>;
  }
  if (!data) {
    return <div className="card p-5 text-sm text-mute">Lade Depth Chart …</div>;
  }
  if (data.groups.length === 0) {
    return <div className="card p-5 text-sm text-mute">Für dieses Team liegt noch kein Depth Chart vor.</div>;
  }

  return (
    <div className="card p-5">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.groups.map((g) => (
          <div key={g.formation} className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute mb-2">{g.label}</div>
            <table className="w-full table-fixed text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Position</th>
                  <th scope="col">Starter</th>
                  <th scope="col">Backup</th>
                </tr>
              </thead>
              <tbody>
                {g.lines.map((l) => (
                  <tr key={`${l.slot}-${l.position}`} className="border-b border-line/50 last:border-0">
                    <th scope="row" className="w-12 text-left font-mono text-xs font-normal text-mute py-1">
                      {l.position}
                    </th>
                    <td className="truncate py-1 pr-2">{l.players[0] ?? '—'}</td>
                    <td className="truncate py-1 text-mute">{l.players[1] ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <p className="text-xs text-mute mt-4">
        {data.asOf ? `Stand ${stamp.format(new Date(data.asOf))} · ` : ''}Starter und erster Backup ·
        Quelle: nflverse
      </p>
    </div>
  );
}
