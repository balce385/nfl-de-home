'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import type { Player } from '@/types';

export function PlayerStatsCard({ player }: { player: Player }) {
  const data = player.trend.map((v, i) => ({ week: `W${i + 1}`, yards: v * 5 }));

  return (
    <div className="card p-6 field-lines">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs font-mono text-mute uppercase tracking-wider">Watchlist</div>
          <div className="font-display font-bold text-xl">
            {player.name}{' '}
            <span className="text-mute font-body font-normal">
              · {player.position} · {player.team}
            </span>
          </div>
        </div>
        <span className="chip-accent chip">+18% YPG</span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <Stat label="Pass YDS" value={player.stats.passYards.toLocaleString('de-DE')} />
        <Stat label="TD" value={player.stats.touchdowns.toString()} />
        <Stat label="INT" value={player.stats.interceptions.toString()} tone="danger" />
        <Stat label="QBR" value={player.stats.qbr.toString()} tone="accent" />
      </div>

      <div className="bg-black/30 rounded-lg p-4 border border-line">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-mute uppercase tracking-wider">Pass-Yards / Game</span>
          <span className="text-[10px] font-mono text-accent">↗ Trend positiv</span>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="yards" stroke="#22c55e" strokeWidth={2} fill="url(#g)" />
              <Tooltip
                contentStyle={{
                  background: '#0a0f1c',
                  border: '1px solid #1f2a44',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis hide />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'accent' }) {
  const cls = tone === 'danger' ? 'text-danger' : tone === 'accent' ? 'text-accent' : '';
  return (
    <div className="bg-black/40 rounded-lg p-3 border border-line">
      <div className="text-[10px] font-mono text-mute uppercase">{label}</div>
      <div className={`font-display font-bold text-xl mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
