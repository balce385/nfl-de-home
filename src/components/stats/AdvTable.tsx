'use client';

/**
 * Sortier- und durchsuchbare Tabelle für die Advanced Stats aus nflverse
 * (Pro Football Reference und ESPN QBR).
 *
 * Bewusst generisch gehalten: Receiving, Rushing, Defense und QBR haben
 * komplett unterschiedliche Spalten, teilen sich aber Aufbau, Sortierung,
 * Suche und Legende. Die Spalten kommen deshalb als Prop aus der Seite.
 *
 * Schwester der AdvancedStatsTable, die dasselbe für die Next Gen Stats aus
 * der Datenbank tut. Getrennt, weil dort jede Zeile feste Felder hat und hier
 * die Kennzahlen in `stats` liegen.
 */

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { METRICS, formatMetric } from '@/lib/nfl-stats';
import type { AdvPlayerRow } from '@/lib/pfr-advanced';

export type AdvColumn = {
  /** Schlüssel in AdvPlayerRow['stats']. */
  key: string;
  /** Schlüssel in METRICS für Label, Erklärung und Nachkommastellen. */
  metric?: string;
  /** Eigenes Label, wenn die Spalte keine erklärungsbedürftige Kennzahl ist. */
  label?: string;
  /** Ganze Zahl ohne Nachkommastellen (Volumen wie Versuche, Yards, Tackles). */
  plain?: boolean;
};

function label(c: AdvColumn) {
  return c.metric ? METRICS[c.metric].label : (c.label ?? c.key);
}
function hint(c: AdvColumn) {
  return c.metric ? METRICS[c.metric].hint : undefined;
}
function cell(row: AdvPlayerRow, c: AdvColumn) {
  const v = row.stats[c.key];
  if (v === null || v === undefined) return '—';
  if (c.plain) return v.toLocaleString('de-DE');
  return formatMetric(c.metric ?? c.key, v);
}

export function AdvTable({
  rows,
  columns,
  defaultSort,
  caption,
}: {
  rows: AdvPlayerRow[];
  columns: AdvColumn[];
  /** Spaltenschlüssel, nach dem beim ersten Rendern sortiert wird. */
  defaultSort: string;
  /** Zeile über der Tabelle, z. B. "Receiver & Tight Ends · Saison 2025". */
  caption: string;
}) {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [asc, setAsc] = useState(false);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.player.toLowerCase().includes(q) ||
            r.team.toLowerCase().includes(q) ||
            (r.pos ?? '').toLowerCase().includes(q)
        )
      : rows;

    return [...filtered].sort((a, b) => {
      const av = a.stats[sortKey] ?? null;
      const bv = b.stats[sortKey] ?? null;
      // Fehlende Werte immer ans Ende, egal in welche Richtung sortiert wird.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return asc ? av - bv : bv - av;
    });
  }, [rows, query, sortKey, asc]);

  const toggleSort = (key: string) => {
    if (key === sortKey) {
      setAsc((v) => !v);
      return;
    }
    setSortKey(key);
    // Bei Kennzahlen, wo weniger besser ist (Drops, zugelassenes Rating),
    // steht der beste Wert unten — dort aufsteigend starten.
    const col = columns.find((c) => c.key === key);
    setAsc(Boolean(col?.metric && METRICS[col.metric]?.lowerIsBetter));
  };

  if (rows.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-mute">
          {caption} · <span className="font-mono">{visible.length}</span> Spieler
        </p>
        <label className="flex items-center gap-2 card px-3 py-2">
          <Search size={14} className="text-mute shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Spieler, Team oder Position …"
            className="bg-transparent text-sm outline-none w-52"
            aria-label="Spieler suchen"
          />
        </label>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th
                scope="col"
                className="text-left font-mono text-[10px] uppercase tracking-wider text-mute px-4 py-3"
              >
                Spieler
              </th>
              {columns.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className="px-3 py-3 text-right"
                    aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => toggleSort(c.key)}
                      title={hint(c)}
                      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap transition ${
                        active ? 'text-primary' : 'text-mute hover:text-ink'
                      }`}
                    >
                      {label(c)}
                      {active && (asc ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-line/50 last:border-0 hover:bg-white/5 transition ${
                  i < 3 && sortKey === defaultSort && !asc ? 'bg-primary/5' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-mute w-6 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{row.player}</div>
                      <div className="text-[10px] font-mono text-mute">
                        {row.pos ?? '—'} · {row.team}
                      </div>
                    </div>
                  </div>
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-3 text-right font-mono tabular-nums">
                    {cell(row, c)}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-mute text-sm">
                  Keine Spieler gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legende: jede erklärungsbedürftige Kennzahl in einem Satz */}
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {columns
          .filter((c) => c.metric)
          .map((c) => (
            <div key={c.key} className="card p-4">
              <dt className="font-display text-sm font-bold">{METRICS[c.metric!].label}</dt>
              <dd className="text-xs text-mute mt-1 leading-relaxed">{METRICS[c.metric!].hint}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
