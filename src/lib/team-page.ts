/**
 * Reine Helfer für die Team-Seiten (/teams/[team]): ESPN liefert Platzierung
 * und Kader englisch bzw. verschachtelt, die Seite braucht beides deutsch und flach.
 */

const ORDINAL = /^(T-)?(\d+)(?:st|nd|rd|th) in (.+)$/i;

/** "1st in NFC West" -> "Platz 1 in der NFC West"; Unbekanntes bleibt stehen. */
export function standingDe(summary: string): string {
  const m = ORDINAL.exec(summary.trim());
  if (!m) return summary;
  return `${m[1] ? 'geteilter ' : ''}Platz ${m[2]} in der ${m[3]}`;
}

export type RosterEntry = { name: string; position: string; jersey: string | null };
export type RosterGroup = { key: string; label: string; players: RosterEntry[] };

const GROUP_LABELS: Record<string, string> = {
  offense: 'Offense',
  defense: 'Defense',
  specialTeam: 'Special Teams',
  injuredReserveOrOut: 'Verletzt / Injured Reserve',
  practiceSquad: 'Practice Squad',
};

/** ESPN-Roster (nach Gruppen geschachtelt) in Gruppen mit sortierten Spielern. */
export function rosterGroups(athletes: any[]): RosterGroup[] {
  return (athletes ?? [])
    .map((g: any) => ({
      key: String(g?.position ?? ''),
      label: GROUP_LABELS[g?.position] ?? String(g?.position ?? ''),
      players: ((g?.items ?? []) as any[])
        .map((a) => ({
          name: a?.fullName ?? a?.displayName ?? '',
          position: a?.position?.abbreviation ?? '',
          jersey: a?.jersey ?? null,
        }))
        .filter((p) => p.name)
        .sort((a, b) => Number(a.jersey ?? 999) - Number(b.jersey ?? 999)),
    }))
    .filter((g) => g.players.length > 0);
}
