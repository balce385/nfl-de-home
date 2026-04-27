'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';
import { featuredPlayer } from '@/lib/mock-data';

const chartData = featuredPlayer.trend.map((value, i) => ({
  week: `W${i + 1}`,
  yards: value * 5,
}));

export function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="py-24 border-y border-line bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip">Dashboard</span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mt-4 leading-tight">
              Daten, die du <span className="grad-text italic">verstehst.</span>
            </h2>
            <p className="text-mute mt-4 text-lg leading-relaxed">
              Schluss mit zehn offenen Tabs. Wir aggregieren Stats aus nflverse, Sleeper, PFR
              und ESPN — und bauen daraus ein Dashboard, das die wichtigen Fragen beantwortet —
              nicht alle.
            </p>

            <ul className="mt-8 space-y-4">
              <Item color="accent" title="Personalisierte Watchlist">
                Folge Spielern, Teams oder Divisions — der Feed passt sich an.
              </Item>
              <Item color="primary" title="Fantasy-Sync">
                Importiere dein ESPN- oder Sleeper-Roster in einem Klick.
              </Item>
              <Item color="warn" title="Push-Alerts auf Deutsch">
                TD, Verletzung, Snap-Count-Spike — du entscheidest, was du wissen willst.
              </Item>
            </ul>
          </div>

          <div className="card p-5 lg:p-6 field-lines">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-mono text-mute uppercase tracking-wider">
                  Watchlist
                </div>
                <div className="font-display font-bold text-lg">
                  {featuredPlayer.name}{' '}
                  <span className="text-mute font-body font-normal">
                    · {featuredPlayer.position} · {featuredPlayer.team}
                  </span>
                </div>
              </div>
              <span className="chip-accent chip">+18% YPG</span>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-5">
              <StatBox label="Pass YDS" value={featuredPlayer.stats.passYards.toLocaleString('de-DE')} />
              <StatBox label="TD" value={featuredPlayer.stats.touchdowns.toString()} />
              <StatBox label="INT" value={featuredPlayer.stats.interceptions.toString()} tone="danger" />
              <StatBox label="QBR" value={featuredPlayer.stats.qbr.toString()} tone="accent" />
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-line">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-mute uppercase tracking-wider">
                  Pass-Yards / Game
                </span>
                <span className="text-[10px] font-mono text-accent">↗ Trend positiv</span>
              </div>
              <div className="h-24 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="yards"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#trendGradient)"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0a0f1c',
                        border: '1px solid #1f2a44',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#22c55e' }}
                    />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <ProgressBar label="Snap %" value={featuredPlayer.stats.snapPercent} />
              <ProgressBar label="Win-Prob." value={71} accent />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Item({
  color,
  title,
  children,
}: {
  color: 'accent' | 'primary' | 'warn';
  title: string;
  children: React.ReactNode;
}) {
  const colorClass = color === 'accent' ? 'text-accent' : color === 'primary' ? 'text-primary' : 'text-warn';
  return (
    <li className="flex gap-4">
      <span className={`text-xl leading-none ${colorClass}`}>●</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-mute">{children}</div>
      </div>
    </li>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'accent' }) {
  const toneClass = tone === 'danger' ? 'text-danger' : tone === 'accent' ? 'text-accent' : '';
  return (
    <div className="bg-black/40 rounded-lg p-3 border border-line">
      <div className="text-[10px] font-mono text-mute uppercase">{label}</div>
      <div className={`font-display font-bold text-xl mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}

function ProgressBar({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-black/40 rounded-lg p-3 border border-line">
      <div className="flex justify-between text-xs">
        <span className="text-mute">{label}</span>
        <span className={`font-mono font-bold ${accent ? 'text-accent' : ''}`}>{value}%</span>
      </div>
      <div className="yard mt-2">
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
