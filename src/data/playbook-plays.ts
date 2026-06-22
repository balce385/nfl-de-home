/**
 * Echte NFL-Spielzug-Konzepte für den Play-Designer.
 *
 * Jedes Konzept verteilt Routen auf die aktuell aufgestellten Skill-Spieler
 * (relativ zu ihrer Ausrichtung), liefert eine empfohlene Formation, einen
 * primären Read (Target) und eine kurze Erklärung. So lassen sich bekannte
 * Konzepte aus den Playbooks der Teams per Klick laden und simulieren.
 */

export type RoutePt = { x: number; y: number };
export type PlayPlayer = {
  id: string;
  pos: string;
  x: number;
  y: number;
  route: RoutePt[];
};

export type Concept = {
  key: string;
  name: string;
  type: 'pass' | 'run';
  formation: string; // muss ein Key aus OFF_FORMATIONS sein
  blurb: string;
  /** Setzt die Routen und gibt die Spieler-ID des primären Reads zurück. */
  apply: (off: PlayPlayer[]) => string;
};

/* ----------------------------- Routen-Bausteine --------------------------- */
/* y ist negativ = downfield. IN = zur Mitte, OUT = zur Seitenlinie.          */

const IN = (x: number) => (x >= 0 ? -1 : 1);
const OUT = (x: number) => (x >= 0 ? 1 : -1);

const r = {
  go: (p: PlayPlayer): RoutePt[] => [{ x: p.x, y: p.y - 22 }],
  seam: (p: PlayPlayer): RoutePt[] => [
    { x: p.x + (Math.abs(p.x) < 6 ? IN(p.x) * 2.5 : 0), y: p.y - 22 },
  ],
  post: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 11 },
    { x: p.x + IN(p.x) * 9, y: p.y - 21 },
  ],
  corner: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 11 },
    { x: p.x + OUT(p.x) * 8, y: p.y - 19 },
  ],
  dig: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 11 },
    { x: p.x + IN(p.x) * 15, y: p.y - 11 },
  ],
  in10: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 7 },
    { x: p.x + IN(p.x) * 10, y: p.y - 7 },
  ],
  out: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 8 },
    { x: p.x + OUT(p.x) * 8, y: p.y - 8 },
  ],
  curl: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 10 },
    { x: p.x + IN(p.x) * 1.5, y: p.y - 8 },
  ],
  slant: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 2 },
    { x: p.x + IN(p.x) * 7, y: p.y - 7 },
  ],
  hitch: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 6 },
    { x: p.x, y: p.y - 4.8 },
  ],
  flat: (p: PlayPlayer): RoutePt[] => [{ x: p.x + OUT(p.x) * 6, y: p.y - 1.5 }],
  shallow: (p: PlayPlayer): RoutePt[] => [
    { x: p.x + IN(p.x) * 6, y: p.y - 3.5 },
    { x: p.x + IN(p.x) * 26, y: p.y - 4.5 },
  ],
  cross: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 9 },
    { x: p.x + IN(p.x) * 24, y: p.y - 12 },
  ],
  wheel: (p: PlayPlayer): RoutePt[] => [
    { x: p.x + OUT(p.x) * 5, y: p.y - 1 },
    { x: p.x + OUT(p.x) * 6, y: p.y - 17 },
  ],
  comeback: (p: PlayPlayer): RoutePt[] => [
    { x: p.x, y: p.y - 15 },
    { x: p.x + OUT(p.x) * 1.5, y: p.y - 12.5 },
  ],
  swing: (p: PlayPlayer): RoutePt[] => [
    { x: p.x + OUT(p.x) * 6, y: p.y + 0.5 },
    { x: p.x + OUT(p.x) * 10, y: p.y - 1.5 },
  ],
  drag: (p: PlayPlayer): RoutePt[] => [
    { x: p.x + IN(p.x) * 5, y: p.y - 1.5 },
    { x: p.x + IN(p.x) * 17, y: p.y - 2.5 },
  ],
  check: (p: PlayPlayer): RoutePt[] => [{ x: p.x + OUT(p.x) * 4, y: p.y - 2 }],
  // Lauf-Pfade (kurzes Ziel; danach übernimmt die Ballträger-KI)
  runInside: (p: PlayPlayer): RoutePt[] => [
    { x: p.x * 0.3, y: p.y - 1.5 },
    { x: IN(p.x) * 1.5, y: -3 },
  ],
  runStretch: (p: PlayPlayer): RoutePt[] => [
    { x: p.x + OUT(p.x || 1) * 3, y: p.y - 0.5 },
    { x: p.x + OUT(p.x || 1) * 7, y: -3 },
  ],
  runOffTackle: (p: PlayPlayer): RoutePt[] => [
    { x: p.x + 2.5, y: p.y - 1 },
    { x: 4.5, y: -3 },
  ],
  runCounter: (p: PlayPlayer): RoutePt[] => [
    { x: p.x - 2, y: p.y - 0.2 },
    { x: -4.5, y: -3 },
  ],
};

/* ------------------------------- Helfer ----------------------------------- */

function groups(off: PlayPlayer[]) {
  const skill = off
    .filter((p) => ['WR', 'TE', 'RB', 'FB'].includes(p.pos))
    .sort((a, b) => a.x - b.x);
  const wide = skill.filter((p) => Math.abs(p.x) > 9 && p.pos !== 'RB' && p.pos !== 'FB');
  const inside = skill.filter(
    (p) => Math.abs(p.x) <= 9 && (p.pos === 'WR' || p.pos === 'TE')
  );
  const backs = skill.filter((p) => p.pos === 'RB' || p.pos === 'FB');
  return { skill, wide, inside, backs };
}

const set = (p: PlayPlayer | undefined, route: RoutePt[]) => {
  if (p) p.route = route;
};
const clearRoutes = (off: PlayPlayer[]) =>
  off.forEach((p) => {
    if (['WR', 'TE', 'RB', 'FB', 'QB'].includes(p.pos)) p.route = [];
  });

/* ------------------------------- Konzepte --------------------------------- */

export const CONCEPTS: Concept[] = [
  {
    key: 'four-verts',
    name: 'Four Verticals',
    type: 'pass',
    formation: 'Empty (10)',
    blurb: 'Vier Spieler vertikal — Außen-Go, innen Seams. Sprengt Single-High-Coverages.',
    apply: (off) => {
      clearRoutes(off);
      const { skill, backs } = groups(off);
      const verts = skill.filter((p) => !backs.includes(p));
      verts.forEach((p) => set(p, Math.abs(p.x) > 9 ? r.go(p) : r.seam(p)));
      backs.forEach((p) => set(p, r.check(p)));
      // Primär: innerer Seam-Läufer
      const seamGuy = verts.filter((p) => Math.abs(p.x) <= 9)[0] ?? verts[0];
      return seamGuy?.id ?? '';
    },
  },
  {
    key: 'mesh',
    name: 'Mesh',
    type: 'pass',
    formation: 'Gun Trips Right',
    blurb: 'Zwei flache Kreuzläufe bilden ein „Mesh“ — tötet Mann-Coverage, RB als Outlet.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const left = [...wide, ...inside].filter((p) => p.x < 0).sort((a, b) => a.x - b.x);
      const right = [...wide, ...inside].filter((p) => p.x >= 0).sort((a, b) => b.x - a.x);
      // Mesh: ein Receiver von links, einer von rechts flach kreuzen
      const meshA = inside[0] ?? left[0];
      const meshB = inside[inside.length - 1] ?? right[0];
      set(meshA, r.shallow(meshA));
      set(meshB, r.shallow(meshB));
      // Außen: Corner/Comeback als Sitzfenster
      set(left[0], r.corner(left[0]));
      set(right[0], r.corner(right[0]));
      // restliche innen: Sitz-/Curl
      [...left, ...right]
        .filter((p) => p !== meshA && p !== meshB && p !== left[0] && p !== right[0])
        .forEach((p) => set(p, r.curl(p)));
      set(backs[0], r.swing(backs[0]));
      return meshA?.id ?? '';
    },
  },
  {
    key: 'ycross',
    name: 'Y-Cross (Drive)',
    type: 'pass',
    formation: 'Gun Spread (11)',
    blurb: 'TE-Tiefkreuz hinter einem Shallow Drag — Andy Reids Lieblings-Highlow.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const te = off.find((p) => p.pos === 'TE') ?? inside[0];
      const shallowGuy = inside.find((p) => p !== te) ?? wide[0];
      set(te, r.cross(te)); // tiefer Crosser
      set(shallowGuy, r.shallow(shallowGuy));
      // Außen: Post (Schwächenseite) + Comeback
      const left = wide.filter((p) => p.x < 0)[0];
      const right = wide.filter((p) => p.x >= 0).slice(-1)[0];
      set(left, r.post(left));
      set(right, r.comeback(right));
      set(backs[0], r.check(backs[0]));
      return te?.id ?? '';
    },
  },
  {
    key: 'smash',
    name: 'Smash',
    type: 'pass',
    formation: 'Gun Spread (11)',
    blurb: 'Außen-Hitch unter Slot-Corner — der klassische High-Low gegen Cover 2.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const right = wide.filter((p) => p.x >= 0).sort((a, b) => b.x - a.x);
      const left = wide.filter((p) => p.x < 0).sort((a, b) => a.x - b.x);
      const slotR = inside.filter((p) => p.x >= 0)[0] ?? inside[0];
      set(right[0], r.hitch(right[0]));
      set(slotR ?? inside[0], r.corner(slotR ?? inside[0]));
      set(left[0], r.hitch(left[0]));
      inside.filter((p) => p !== slotR).forEach((p) => set(p, r.dig(p)));
      set(backs[0], r.flat(backs[0]));
      return (slotR ?? right[0])?.id ?? '';
    },
  },
  {
    key: 'slant-flat',
    name: 'Slant–Flat',
    type: 'pass',
    formation: 'Gun Trips Right',
    blurb: 'Schneller Rhythmus-Read: Außen-Slant über dem Flat-Läufer. Anti-Blitz.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      wide.forEach((p) => set(p, r.slant(p)));
      inside.forEach((p, i) => set(p, i === 0 ? r.flat(p) : r.slant(p)));
      set(backs[0], r.flat(backs[0]));
      const slant = wide[wide.length - 1] ?? wide[0];
      return slant?.id ?? '';
    },
  },
  {
    key: 'flood',
    name: 'Sail (Flood)',
    type: 'pass',
    formation: 'Gun Trips Right',
    blurb: 'Drei Ebenen auf eine Seite: Go – Sail/Out – Flat. Überlädt die Zonen-Verteidiger.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const right = [...wide, ...inside].filter((p) => p.x >= 0).sort((a, b) => b.x - a.x);
      set(right[0], r.go(right[0])); // Clearout
      set(right[1] ?? right[0], r.corner(right[1] ?? right[0])); // Sail
      const flatGuy = backs[0] ?? right[2];
      set(flatGuy, r.flat({ ...flatGuy, x: Math.abs(flatGuy.x) }));
      // Backside Dig als Checkdown gegen Rotation
      const left = wide.filter((p) => p.x < 0)[0];
      set(left, r.dig(left));
      return (right[1] ?? right[0])?.id ?? '';
    },
  },
  {
    key: 'dagger',
    name: 'Dagger',
    type: 'pass',
    formation: 'Gun Spread (11)',
    blurb: 'Slot-Go räumt tief, darunter schießt die Dig hinein. Tödlich gegen Cover 3.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const clearout = inside[0] ?? wide[0];
      set(clearout, r.go(clearout));
      const digGuy = wide.find((p) => p !== clearout) ?? wide[0];
      set(digGuy, r.dig(digGuy));
      const backside = wide.find((p) => p !== digGuy && p !== clearout);
      set(backside, r.post(backside ?? digGuy));
      inside.filter((p) => p !== clearout).forEach((p) => set(p, r.shallow(p)));
      set(backs[0], r.check(backs[0]));
      return digGuy?.id ?? '';
    },
  },
  {
    key: 'stick',
    name: 'Stick',
    type: 'pass',
    formation: 'Gun Trips Right',
    blurb: 'Slot-Stick (sitzen/auswenden), darüber Go, RB in den Flat. Sicherer Quick-Game-Read.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const stickGuy = inside[inside.length - 1] ?? inside[0];
      set(stickGuy, r.hitch(stickGuy));
      const outside = wide[wide.length - 1] ?? wide[0];
      set(outside, r.go(outside));
      wide.filter((p) => p !== outside).forEach((p) => set(p, r.slant(p)));
      inside.filter((p) => p !== stickGuy).forEach((p) => set(p, r.dig(p)));
      set(backs[0], r.flat(backs[0]));
      return stickGuy?.id ?? '';
    },
  },
  {
    key: 'pa-boot',
    name: 'PA Boot (Waggle)',
    type: 'pass',
    formation: 'I-Formation (21)',
    blurb: 'Play-Action, QB rollt aus: TE-Drag, tiefer Crosser, Flat — Shanahan-Stammkost.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const te = off.find((p) => p.pos === 'TE') ?? inside[0];
      set(te, r.drag(te));
      const crosser = wide.filter((p) => p.x < 0)[0] ?? wide[0];
      set(crosser, r.cross(crosser));
      const comeGuy = wide.filter((p) => p.x >= 0).slice(-1)[0];
      set(comeGuy, r.comeback(comeGuy));
      set(backs[0], r.flat({ ...backs[0], x: Math.abs(backs[0]?.x ?? 1) }));
      return te?.id ?? '';
    },
  },
  {
    key: 'shallow-cross',
    name: 'Shallow Cross',
    type: 'pass',
    formation: 'Gun Spread (11)',
    blurb: 'Shallow unter einer Dig dahinter — der „Drive“-Read, der jede Mann-Deckung zerlegt.',
    apply: (off) => {
      clearRoutes(off);
      const { wide, inside, backs } = groups(off);
      const shallowGuy = inside[0] ?? wide[0];
      set(shallowGuy, r.shallow(shallowGuy));
      const digGuy = inside.find((p) => p !== shallowGuy) ?? wide[0];
      set(digGuy, r.dig(digGuy));
      wide.forEach((p) => set(p, Math.abs(p.x) > 14 ? r.go(p) : r.curl(p)));
      set(backs[0], r.swing(backs[0]));
      return shallowGuy?.id ?? '';
    },
  },
  /* ------------------------------- Läufe -------------------------------- */
  {
    key: 'inside-zone',
    name: 'Inside Zone',
    type: 'run',
    formation: 'I-Formation (21)',
    blurb: 'Downhill zwischen die Tackles — lies den ersten Block und schneide hoch.',
    apply: (off) => {
      clearRoutes(off);
      const rb = off.find((p) => p.pos === 'RB') ?? off.find((p) => p.pos === 'FB');
      set(rb, r.runInside(rb!));
      return rb?.id ?? '';
    },
  },
  {
    key: 'outside-zone',
    name: 'Wide Zone',
    type: 'run',
    formation: 'Gun Spread (11)',
    blurb: 'Stretch zur Seitenlinie, dann der berühmte Cutback — das Herz von Shanahans System.',
    apply: (off) => {
      clearRoutes(off);
      const rb = off.find((p) => p.pos === 'RB') ?? off.find((p) => p.pos === 'FB');
      set(rb, r.runStretch(rb!));
      const wides = groups(off).wide;
      wides.forEach((p) => set(p, r.slant(p))); // Receiver blocken/zerren
      return rb?.id ?? '';
    },
  },
  {
    key: 'power-o',
    name: 'Power O',
    type: 'run',
    formation: 'I-Formation (21)',
    blurb: 'Gegenüberliegender Guard zieht durch das Loch, FB führt — Gewalt off-tackle.',
    apply: (off) => {
      clearRoutes(off);
      const rb = off.find((p) => p.pos === 'RB') ?? off.find((p) => p.pos === 'FB');
      set(rb, r.runOffTackle(rb!));
      return rb?.id ?? '';
    },
  },
  {
    key: 'counter',
    name: 'Counter',
    type: 'run',
    formation: 'Gun Spread (11)',
    blurb: 'Falscher Schritt, dann gegen den Strich — bestraft überaggressive Verteidiger.',
    apply: (off) => {
      clearRoutes(off);
      const rb = off.find((p) => p.pos === 'RB') ?? off.find((p) => p.pos === 'FB');
      set(rb, r.runCounter(rb!));
      return rb?.id ?? '';
    },
  },
  {
    key: 'tush-push',
    name: 'Tush Push',
    type: 'run',
    formation: 'I-Formation (21)',
    blurb: 'Der QB-Sneak mit Schub von hinten — Phillys quasi unaufhaltbare 4th-&-1-Waffe.',
    apply: (off) => {
      clearRoutes(off);
      const qb = off.find((p) => p.pos === 'QB');
      set(qb, [
        { x: 0, y: 0.3 },
        { x: 0, y: -2.5 },
      ]);
      return qb?.id ?? '';
    },
  },
];

export const CONCEPT_MAP: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.key, c])
);

/* --------------------------- Team-Signature-Plays ------------------------- */

const DEFAULT_PLAYS = ['four-verts', 'mesh', 'slant-flat', 'inside-zone'];

const TEAM_PLAYS: Record<string, string[]> = {
  KC: ['ycross', 'mesh', 'four-verts', 'smash'],
  SF: ['outside-zone', 'pa-boot', 'flood', 'mesh'],
  BUF: ['four-verts', 'dagger', 'smash', 'outside-zone'],
  MIA: ['mesh', 'shallow-cross', 'outside-zone', 'slant-flat'],
  PHI: ['tush-push', 'power-o', 'dagger', 'smash'],
  BAL: ['inside-zone', 'pa-boot', 'counter', 'four-verts'],
  DET: ['power-o', 'flood', 'ycross', 'counter'],
  DAL: ['stick', 'smash', 'inside-zone', 'dagger'],
  LAR: ['flood', 'dagger', 'pa-boot', 'outside-zone'],
  GB: ['four-verts', 'smash', 'ycross', 'outside-zone'],
  CIN: ['four-verts', 'dagger', 'smash', 'mesh'],
  HOU: ['stick', 'dagger', 'slant-flat', 'inside-zone'],
  MIN: ['ycross', 'dagger', 'flood', 'outside-zone'],
  LAC: ['four-verts', 'smash', 'stick', 'counter'],
  JAX: ['mesh', 'stick', 'slant-flat', 'inside-zone'],
};

/** Signature-Playbook eines Teams (oder ein sinnvolles Default-Set). */
export function getTeamPlays(team: string): Concept[] {
  const keys = TEAM_PLAYS[team] ?? DEFAULT_PLAYS;
  return keys.map((k) => CONCEPT_MAP[k]).filter(Boolean);
}
