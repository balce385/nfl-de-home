'use client';

/**
 * Sortier- und durchsuchbare Tabelle der Advanced- und Next-Gen-Stats.
 * Je Positionsgruppe andere Spalten, weil andere Kennzahlen zählen.
 */

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { METRICS, formatMetric, ratingLabel } from '@/lib/nfl-stats';
import type { AdvancedRow, PositionGroup } from '@/lib/advanced-stats';

type Column = {
  key: keyof AdvancedRow;
  /** Schlüssel in METRICS für Label und Erklärung; sonst eigenes Label. */
  metric?: string;
  label?: string;
  digits?: number;
  /** Zahl ohne Nachkommastellen (Volumen wie Versuche, Yards). */
  plain?: boolean;
};

const COLUMNS: Record<PositionGroup, Column[]> = {
  QB: [
    { key: 'attempts', label: 'Versuche', plain: true },
    { key: 'pass_yards', label: 'Yards', plain: true },
    { key: 'pass_touchdowns', label: 'TD', plain: true },
    { key: 'interceptions', label: 'INT', plain: true },
    { key: 'passer_rating', metric: 'passer_rating' },
    { key: 'cpoe', metric: 'cpoe' },
    { key: 'avg_time_to_throw', metric: 'time_to_throw' },
    { key: 'aggressiveness', metric: 'aggressiveness' },
  ],
  REC: [
    { key: 'targets', label: 'Targets', plain: true },
    { key: 'receptions', label: 'Fänge', plain: true },
    { key: 'rec_yards', label: 'Yards', plain: true },
    { key: 'rec_touchdowns', label: 'TD', plain: true },
    { key: 'avg_separation', metric: 'separation' },
    { key: 'avg_cushion', metric: 'cushion' },
    { key: 'avg_yac_above_expectation', metric: 'yac_oe' },
  ],
  RUSH: [
    { key: 'rush_attempts', label: 'Läufe', plain: true },
    { key: 'rush_yards', label: 'Yards', plain: true },
    { key: 'rush_touchdowns', label: 'TD', plain: true },
    { key: 'rush_yards_over_expected_per_att', metric: 'ryoe_per_att' },
    { key: 'avg_time_to_los', metric: 'time_to_los' },
    { key: 'pct_attempts_8plus_box', metric: 'eight_in_box' },
  ],
};

const DEFAULT_SORT: Record<PositionGroup, keyof AdvancedRow> = {
  QB: 'passer_rating',
  REC: 'rec_yards',
  RUSH: 'rush_yards',
};

const GROUP_LABEL: Record<PositionGroup, string> = {
  QB: 'Quarterbacks',
  REC: 'Receiver & Tight Ends',
  RUSH: 'Running Backs',
};

function headerLabel(c: Column) {
  return c.metric ? METRICS[c.metric].label : (c.label ?? String(c.key));
}
function headerHint(c: Column) {
  return c.metric ? METRICS[c.metric].hint : undefined;
}

function cellValue(row: AdvancedRow, c: Column) {
  const v = row[c.key] as number | null;
  if (v === null || v === undefined) return '—';
  if (c.plain) return v.toLocaleString('de-DE');
  return formatMetric(c.metric ?? String(c.key), v);
}

export function AdvancedStatsTable({
  group,
  rows,
  season,
}: {
  group: PositionGroup;
  rows: AdvancedRow[];
  season: number | null;
}) {
  const columns = COLUMNS[group];
  const [sortKey, setSortKey] = useState<keyof AdvancedRow>(DEFAULT_SORT[group]);
  const [asc, setAsc] = useState(false);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) => r.name.toLowerCase().includes(q) || (r.team_id ?? '').toLowerCase().includes(q)
        )
      : rows;

    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      // Fehlende Werte immer ans Ende, egal in welche Richtung sortiert wird.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return asc ? av - bv : bv - av;
    });
  }, [rows, query, sortKey, asc]);

  const toggleSort = (key: keyof AdvancedRow) => {
    if (key === sortKey) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      // Bei Zeit-Kennzahlen ist weniger besser — dort aufsteigend starten.
      const col = columns.find((c) => c.key === key);
      const lower = col?.metric ? METRICS[col.metric]?.lowerIsBetter : false;
      setAsc(Boolean(lower));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-mute">
          {GROUP_LABEL[group]} · Saison {season ?? '—'} ·{' '}
          <span className="font-mono">{visible.length}</span> Spieler
        </p>
        <label className="flex items-center gap-2 card px-3 py-2">
          <Search size={14} className="text-mute shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Spieler oder Team suchen …"
            className="bg-transparent text-sm outline-none w-52"
            aria-label="Spieler suchen"
          />
        </label>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-mute px-4 py-3">
                Spieler
              </th>
              {columns.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={String(c.key)}
                    className="px-3 py-3 text-right"
                    aria-sort={active ? (asc ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      onClick={() => toggleSort(c.key)}
                      title={headerHint(c)}
                      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition ${
                        active ? 'text-primary' : 'text-mute hover:text-ink'
                      }`}
                    >
                      {headerLabel(c)}
                      {active &&
                        (asc ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={row.player_id}
                className={`border-b border-line/50 hover:bg-white/5 transition ${
                  i < 3 && sortKey === DEFAULT_SORT[group] && !asc ? 'bg-primary/5' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-mute w-6 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{row.name}</div>
                      <div className="text-[10px] font-mono text-mute">
                        {row.position} · {row.team_id ?? '—'}
                      </div>
                    </div>
                  </div>
                </td>
                {columns.map((c) => {
                  const isRating = c.metric === 'passer_rating';
                  const v = row[c.key] as number | null;
                  return (
                    <td key={String(c.key)} className="px-3 py-3 text-right font-mono tabular-nums">
                      {isRating && v !== null ? (
                        <span
                          className={
                            ratingLabel(v) === 'elite'
                              ? 'text-accent font-bold'
                              : ratingLabel(v) === 'stark'
                              ? 'text-primary'
                              : ratingLabel(v) === 'schwach'
                              ? 'text-mute'
                              : ''
                          }
                        >
                          {cellValue(row, c)}
                        </span>
                      ) : (
                        cellValue(row, c)
                      )}
                    </td>
                  );
                })}
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

      {/* Legende: jede Kennzahl in einem Satz erklärt */}
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {columns
          .filter((c) => c.metric)
          .map((c) => (
            <div key={String(c.key)} className="card p-4">
              <dt className="font-display text-sm font-bold">{METRICS[c.metric!].label}</dt>
              <dd className="text-xs text-mute mt-1 leading-relaxed">{METRICS[c.metric!].hint}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
