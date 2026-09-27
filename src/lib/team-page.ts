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

/** Divisionen seit der Neuordnung 2002 — ändern sich praktisch nie. */
export const DIVISION: Record<string, string> = {
  BUF: 'AFC East', MIA: 'AFC East', NE: 'AFC East', NYJ: 'AFC East',
  BAL: 'AFC North', CIN: 'AFC North', CLE: 'AFC North', PIT: 'AFC North',
  HOU: 'AFC South', IND: 'AFC South', JAX: 'AFC South', TEN: 'AFC South',
  DEN: 'AFC West', KC: 'AFC West', LV: 'AFC West', LAC: 'AFC West',
  DAL: 'NFC East', NYG: 'NFC East', PHI: 'NFC East', WAS: 'NFC East',
  CHI: 'NFC North', DET: 'NFC North', GB: 'NFC North', MIN: 'NFC North',
  ATL: 'NFC South', CAR: 'NFC South', NO: 'NFC South', TB: 'NFC South',
  ARI: 'NFC West', LAR: 'NFC West', SF: 'NFC West', SEA: 'NFC West',
};

/**
 * Teams mit Marketingrechten für Deutschland im Global Markets Program der NFL
 * (Stand September 2026, nfl.com/international/global-markets-program).
 * Diese Teams dürfen hier offiziell vermarkten und um Fans werben.
 */
export const GERMANY_RIGHTS = new Set(['ATL', 'CAR', 'DET', 'GB', 'IND', 'KC', 'NE', 'NYG', 'PIT', 'SEA', 'TB']);

type IntroInput = {
  abbr: string;
  name: string;
  shortName: string;
  record: string;
  standingSummary: string;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: boolean;
  venue: { name: string; location: string; capacity: number | null } | null;
  founded: number | null;
  coach: { name: string; experience: number | null } | null;
  next: { opponentName: string; home: boolean; when: string } | null;
};

/**
 * Eigener Einleitungstext je Team aus Stammdaten und Live-Bilanz. Damit steht
 * auf jeder der 32 Seiten echter, unterschiedlicher Text statt nur Widgets.
 */
export function teamIntro(t: IntroInput): string[] {
  const out: string[] = [];
  const division = DIVISION[t.abbr];
  const home = t.venue
    ? ` Ihre Heimspiele tragen sie im ${t.venue.name} in ${t.venue.location} aus${
        t.venue.capacity ? ` (${t.venue.capacity.toLocaleString('de-DE')} Plätze)` : ''
      }.`
    : '';
  out.push(
    `Die ${t.name} spielen ${division ? `in der ${division}` : 'in der NFL'}` +
      `${t.founded ? ` und wurden ${t.founded} gegründet` : ''}.${home}` +
      (t.coach
        ? ` Head Coach ist ${t.coach.name}${t.coach.experience ? ` mit ${t.coach.experience} Jahren Erfahrung als NFL-Cheftrainer` : ''}.`
        : ''),
  );

  const season = t.gamesPlayed
    ? `Aktuell stehen die ${t.shortName} bei einer Bilanz von ${t.record}` +
      `${t.standingSummary ? ` (${standingDe(t.standingSummary)})` : ''}` +
      ` und ${t.pointsFor}:${t.pointsAgainst} Punkten.`
    : `Die ${t.shortName} haben in dieser Saison noch kein Spiel absolviert.`;
  const next = t.next
    ? ` Nächstes Spiel: ${t.next.home ? 'zu Hause gegen die' : 'auswärts bei den'} ${t.next.opponentName}, ${t.next.when} (deutsche Zeit).`
    : '';
  out.push(season + next);

  if (GERMANY_RIGHTS.has(t.abbr)) {
    out.push(
      `Für Fans in Deutschland sind die ${t.shortName} besonders nah dran: Sie gehören zu den elf Teams, ` +
        'die im Global Markets Program der NFL offizielle Marketingrechte für Deutschland besitzen und hier gezielt um Fans werben.',
    );
  }
  out.push(
    `Hier findest du den kompletten Kader der ${t.shortName}, den Spielplan mit deutschen Anstoßzeiten und die neuesten News — täglich aktualisiert.`,
  );
  return out;
}
