/**
 * Depth Chart eines Teams, gruppiert für die Anzeige.
 *
 * Die Zeilen kommen aus `depth_charts` (nflverse, jüngster Tagesstand). Eine
 * Position kann mehrfach besetzt sein — drei WR, zwei CB —, deshalb trennt
 * `slot` die Zeilen, nicht das Kürzel.
 */

export type DepthRow = {
  formation: string | null;
  position: string;
  slot: number | null;
  depth_position: number;
  name: string;
};

/** players[0] = Starter, players[1] = erster Backup; null, wenn unbesetzt. */
export type DepthLine = { position: string; slot: number; players: (string | null)[] };
export type DepthGroup = { formation: string; label: string; lines: DepthLine[] };

/** nflverse nennt die Formationen "3WR 1TE", "Base 4-3 D", "Special Teams". */
export function formationLabel(formation: string): string {
  if (formation === 'Special Teams') return formation;
  const defense = formation.match(/^(?:Base )?(.+) D$/);
  return defense ? `Defense · ${defense[1]}` : `Offense · ${formation}`;
}

function sideOrder(formation: string): number {
  if (formation === 'Special Teams') return 2;
  return / D$/.test(formation) ? 1 : 0;
}

export function groupDepthChart(rows: DepthRow[]): DepthGroup[] {
  const groups = new Map<string, Map<string, DepthLine>>();

  for (const r of rows) {
    const formation = r.formation ?? '';
    const slot = r.slot ?? 0;
    const lines = groups.get(formation) ?? new Map<string, DepthLine>();
    groups.set(formation, lines);

    const key = `${slot}|${r.position}`;
    const line = lines.get(key) ?? { position: r.position, slot, players: [] };
    lines.set(key, line);
    // Per Index statt push: fehlt der Starter, rückt der Backup nicht auf.
    line.players[r.depth_position - 1] = r.name;
  }

  return [...groups.entries()]
    .map(([formation, lines]) => ({
      formation,
      label: formationLabel(formation),
      lines: [...lines.values()]
        .map((l) => ({ ...l, players: Array.from(l.players, (p) => p ?? null) }))
        .sort((a, b) => a.slot - b.slot),
    }))
    .sort((a, b) => sideOrder(a.formation) - sideOrder(b.formation));
}
