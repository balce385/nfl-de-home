'use client';

/**
 * Play-Designer — 3D-Football-Spielzug-Editor mit KI-Defense.
 *
 * Features:
 *  - Broadcast-3D-Feld (perspektivisch) inkl. Stadion-Atmosphäre & Flutlicht
 *  - Echte NFL-Konzepte je Team (Four Verticals, Mesh, Y-Cross, Wide Zone …)
 *  - Spieler frei verschieben (Drag), Routen zeichnen (Klick = Wegpunkt)
 *  - Simulation: Man-/Zone-Coverage reagiert live, QB wirft, Ergebnis-Analyse
 *  - 3D-Ball-Flugbahn mit Schatten, Bewegungs-Trails, Replay, PNG-Export
 *  - Respektiert prefers-reduced-motion
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { getTeamPlays, CONCEPT_MAP, type Concept } from '@/data/playbook-plays';

export type PdTeam = { id: string; name: string; color: string; altColor: string };

type Pt = { x: number; y: number };
type OffPos = 'QB' | 'RB' | 'FB' | 'WR' | 'TE' | 'C' | 'G' | 'T';
type DefPos = 'DE' | 'DT' | 'LB' | 'CB' | 'NB' | 'FS' | 'SS';

type Player = {
  id: string;
  side: 'O' | 'D';
  pos: OffPos | DefPos;
  x: number;
  y: number;
  route: Pt[];
  sx?: number;
  sy?: number;
  manTarget?: string;
  zone?: Pt;
  rush?: boolean;
  blockShed?: number;
};

/* ------------------------------- Geometrie -------------------------------- */

const FIELD_W = 53.3;
const VIEW_TOP = -33; // Yards downfield (oben/fern)
const VIEW_BOT = 12; // Backfield (unten/nah)
const GOAL_Y = -25; // Torlinie
const W = 980;
const H = 600;

// Perspektivische 3D-Kamera (Pinhole, Bodenebene). z = Höhe über dem Rasen.
const CAM = { back: 15, height: 24, focal: 270, horizon: 120, cx: W / 2 };

function project(x: number, y: number, z = 0) {
  const depth = VIEW_BOT - y + CAM.back; // > 0
  const s = CAM.focal / depth;
  return { X: CAM.cx + x * s, Y: CAM.horizon + (CAM.height - z) * s, s };
}
function unproject(X: number, Y: number): Pt | null {
  const s = (Y - CAM.horizon) / CAM.height;
  if (s <= 0.0001) return null;
  const depth = CAM.focal / s;
  return { x: (X - CAM.cx) / s, y: VIEW_BOT - (depth - CAM.back) };
}
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const hashAt = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (h >>> 0) / 4294967296;
};

const SPEED: Record<string, number> = {
  QB: 7.5, RB: 8.6, FB: 7.6, WR: 8.8, TE: 8.0, C: 5.5, G: 5.5, T: 5.5,
  DE: 7.6, DT: 6.8, LB: 8.0, CB: 8.7, NB: 8.5, FS: 8.4, SS: 8.3,
};

/* ------------------------------ Formationen ------------------------------- */

const oid = (i: number) => `O${i}`;
const did = (i: number) => `D${i}`;

function olne(): Player[] {
  return [
    { id: oid(5), side: 'O', pos: 'T', x: -4.2, y: 0.6, route: [] },
    { id: oid(6), side: 'O', pos: 'G', x: -2.1, y: 0.6, route: [] },
    { id: oid(7), side: 'O', pos: 'C', x: 0, y: 0.6, route: [] },
    { id: oid(8), side: 'O', pos: 'G', x: 2.1, y: 0.6, route: [] },
    { id: oid(9), side: 'O', pos: 'T', x: 4.2, y: 0.6, route: [] },
  ];
}

const OFF_FORMATIONS: Record<string, () => Player[]> = {
  'Gun Spread (11)': () => [
    { id: oid(0), side: 'O', pos: 'QB', x: 0, y: 5, route: [] },
    { id: oid(1), side: 'O', pos: 'RB', x: -2.8, y: 5, route: [] },
    { id: oid(2), side: 'O', pos: 'WR', x: -21, y: 0.8, route: [] },
    { id: oid(3), side: 'O', pos: 'WR', x: -12, y: 1.2, route: [] },
    { id: oid(4), side: 'O', pos: 'WR', x: 16, y: 0.8, route: [] },
    { id: oid(10), side: 'O', pos: 'TE', x: 6.4, y: 0.8, route: [] },
    ...olne(),
  ],
  'Gun Trips Right': () => [
    { id: oid(0), side: 'O', pos: 'QB', x: 0, y: 5, route: [] },
    { id: oid(1), side: 'O', pos: 'RB', x: 2.8, y: 5, route: [] },
    { id: oid(2), side: 'O', pos: 'WR', x: -21, y: 0.8, route: [] },
    { id: oid(3), side: 'O', pos: 'WR', x: 11, y: 1.2, route: [] },
    { id: oid(4), side: 'O', pos: 'WR', x: 15.5, y: 0.8, route: [] },
    { id: oid(10), side: 'O', pos: 'TE', x: 19.5, y: 1.2, route: [] },
    ...olne(),
  ],
  'I-Formation (21)': () => [
    { id: oid(0), side: 'O', pos: 'QB', x: 0, y: 1.8, route: [] },
    { id: oid(1), side: 'O', pos: 'FB', x: 0, y: 4.6, route: [] },
    { id: oid(2), side: 'O', pos: 'RB', x: 0, y: 7.2, route: [] },
    { id: oid(3), side: 'O', pos: 'WR', x: -21, y: 0.8, route: [] },
    { id: oid(4), side: 'O', pos: 'WR', x: 21, y: 1.2, route: [] },
    { id: oid(10), side: 'O', pos: 'TE', x: 6.4, y: 0.8, route: [] },
    ...olne(),
  ],
  'Empty (10)': () => [
    { id: oid(0), side: 'O', pos: 'QB', x: 0, y: 5, route: [] },
    { id: oid(1), side: 'O', pos: 'WR', x: -23, y: 0.8, route: [] },
    { id: oid(2), side: 'O', pos: 'WR', x: -15, y: 1.2, route: [] },
    { id: oid(3), side: 'O', pos: 'WR', x: -8, y: 1.2, route: [] },
    { id: oid(4), side: 'O', pos: 'WR', x: 15, y: 1.2, route: [] },
    { id: oid(10), side: 'O', pos: 'WR', x: 23, y: 0.8, route: [] },
    ...olne(),
  ],
};

function baseDefense(): Player[] {
  return [
    { id: did(0), side: 'D', pos: 'DE', x: -5.2, y: -1, route: [] },
    { id: did(1), side: 'D', pos: 'DT', x: -1.6, y: -1, route: [] },
    { id: did(2), side: 'D', pos: 'DT', x: 1.6, y: -1, route: [] },
    { id: did(3), side: 'D', pos: 'DE', x: 5.2, y: -1, route: [] },
    { id: did(4), side: 'D', pos: 'LB', x: -3.5, y: -4.5, route: [] },
    { id: did(5), side: 'D', pos: 'LB', x: 3.5, y: -4.5, route: [] },
    { id: did(6), side: 'D', pos: 'CB', x: -21, y: -6, route: [] },
    { id: did(7), side: 'D', pos: 'CB', x: 21, y: -6, route: [] },
    { id: did(8), side: 'D', pos: 'NB', x: -12, y: -5, route: [] },
    { id: did(9), side: 'D', pos: 'FS', x: 0, y: -13, route: [] },
    { id: did(10), side: 'D', pos: 'SS', x: 9, y: -10, route: [] },
  ];
}

const COVERAGES = ['Cover 1 — Man Free', 'Cover 2 — Zone', 'Cover 3 — Zone', 'Cover 0 — Blitz'] as const;
type Coverage = (typeof COVERAGES)[number];

/* ----------------------- Coverage-Zuordnung (KI-Setup) -------------------- */

function eligibles(off: Player[]): Player[] {
  return off
    .filter((p) => ['WR', 'TE', 'RB', 'FB'].includes(p.pos))
    .sort((a, b) => a.x - b.x);
}

function assignCoverage(def: Player[], off: Player[], cov: Coverage) {
  const el = eligibles(off);
  const byId = (pos: DefPos, idx = 0) => def.filter((d) => d.pos === pos)[idx];
  def.forEach((d) => {
    d.manTarget = undefined;
    d.zone = undefined;
    d.rush = ['DE', 'DT'].includes(d.pos);
  });

  const cbL = byId('CB', 0).x < byId('CB', 1).x ? byId('CB', 0) : byId('CB', 1);
  const cbR = cbL === byId('CB', 0) ? byId('CB', 1) : byId('CB', 0);
  const [lb1, lb2] = def.filter((d) => d.pos === 'LB');
  const nb = byId('NB');
  const fs = byId('FS');
  const ss = byId('SS');

  const wrs = el.filter((p) => p.pos === 'WR' || (p.pos === 'TE' && Math.abs(p.x) > 8));
  const backs = el.filter((p) => !wrs.includes(p));
  const outerL = wrs[0];
  const outerR = wrs[wrs.length - 1];
  const slots = wrs.filter((p) => p !== outerL && p !== outerR);

  const man = () => {
    if (outerL) cbL.manTarget = outerL.id;
    if (outerR) cbR.manTarget = outerR.id;
    if (slots[0]) nb.manTarget = slots[0].id;
    if (slots[1]) ss.manTarget = slots[1].id;
    if (backs[0]) lb1.manTarget = backs[0].id;
    if (backs[1]) lb2.manTarget = backs[1].id;
    else lb2.zone = { x: 0, y: -8 };
  };

  if (cov === 'Cover 1 — Man Free') {
    man();
    fs.zone = { x: 0, y: -18 };
    if (!slots[1]) ss.zone = { x: 4, y: -9 };
  } else if (cov === 'Cover 0 — Blitz') {
    man();
    fs.rush = true;
    if (!slots[1]) ss.rush = true;
  } else if (cov === 'Cover 2 — Zone') {
    cbL.zone = { x: -19, y: -4 };
    cbR.zone = { x: 19, y: -4 };
    nb.zone = { x: -10, y: -7 };
    lb1.zone = { x: -3, y: -8.5 };
    lb2.zone = { x: 6, y: -8.5 };
    fs.zone = { x: -12, y: -17 };
    ss.zone = { x: 12, y: -17 };
  } else if (cov === 'Cover 3 — Zone') {
    cbL.zone = { x: -16, y: -15 };
    cbR.zone = { x: 16, y: -15 };
    fs.zone = { x: 0, y: -17 };
    ss.zone = { x: 11, y: -5.5 };
    nb.zone = { x: -11, y: -5.5 };
    lb1.zone = { x: -4, y: -8 };
    lb2.zone = { x: 4, y: -8 };
  }

  def.forEach((d) => {
    if (d.manTarget) {
      const t = off.find((o) => o.id === d.manTarget)!;
      if (['CB', 'NB'].includes(d.pos)) {
        d.x = t.x + (t.x > 0 ? -0.6 : 0.6);
        d.y = -2.2;
        if (Math.abs(t.x) < 9) d.y = -3.5;
      }
    }
  });
}

/* ================================ Component ================================ */

export function PlayDesigner({ teams }: { teams: PdTeam[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playersRef = useRef<Player[]>([]);
  const [, force] = useState(0);
  const rerender = () => force((v) => v + 1);

  const [offTeam, setOffTeam] = useState('KC');
  const [defTeam, setDefTeam] = useState('DET');
  const [formation, setFormation] = useState<string>('Gun Spread (11)');
  const [coverage, setCoverage] = useState<Coverage>('Cover 1 — Man Free');
  const [playType, setPlayType] = useState<'pass' | 'run'>('pass');
  const [target, setTarget] = useState<string>('');
  const [selected, setSelected] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [simState, setSimState] = useState<'edit' | 'running' | 'done'>('edit');
  const [result, setResult] = useState<string>('');
  const [activePlay, setActivePlay] = useState<string>('');

  // Refs für die persistente Animationsschleife (vermeiden stale closures)
  const targetRef = useRef(target);
  const playTypeRef = useRef(playType);
  const coverageRef = useRef(coverage);
  const speedRef = useRef(speed);
  const runningRef = useRef(false);
  const reducedRef = useRef(false);
  const trailRef = useRef<Map<string, Pt[]>>(new Map());
  const ambientRef = useRef(0);
  const snapRef = useRef(0); // Zeitpunkt des Snaps für Kamera-Puls
  targetRef.current = target;
  playTypeRef.current = playType;
  coverageRef.current = coverage;
  speedRef.current = speed;

  const simRef = useRef<{
    t: number;
    ball: Pt & {
      carrier: string | null;
      thrown: boolean;
      flight?: { from: Pt; to: Pt; t0: number; dur: number; to_id: string };
    };
    phase: 'live' | 'over';
    routeDur: Map<string, number>;
    throwAt: number;
    outcome: string;
  } | null>(null);

  const oCol = teams.find((t) => t.id === offTeam)?.color ?? '#E31837';
  const dCol = teams.find((t) => t.id === defTeam)?.color ?? '#0076B6';
  const offName = teams.find((t) => t.id === offTeam)?.name ?? 'Offense';
  const defName = teams.find((t) => t.id === defTeam)?.name ?? 'Defense';

  /* ------------------------------ Setup/Reset ----------------------------- */

  const loadFormation = useCallback((form: string, cov: Coverage) => {
    const off = OFF_FORMATIONS[form]();
    const def = baseDefense();
    assignCoverage(def, off, cov);
    playersRef.current = [...off, ...def];
    const el = eligibles(off);
    setTarget((t) => (el.some((e) => e.id === t) ? t : el[0]?.id ?? ''));
    setSelected(null);
    setSimState('edit');
    setResult('');
    runningRef.current = false;
    simRef.current = null;
    trailRef.current.clear();
    rerender();
  }, []);

  useEffect(() => {
    reducedRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    loadFormation(formation, coverage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reassign = useCallback((cov: Coverage) => {
    const off = playersRef.current.filter((p) => p.side === 'O');
    const def = playersRef.current.filter((p) => p.side === 'D');
    assignCoverage(def, off, cov);
    rerender();
  }, []);

  /* ------------------------------ Spielzug laden -------------------------- */

  const loadPlay = useCallback(
    (concept: Concept) => {
      // Passende Formation aufbauen
      const off = OFF_FORMATIONS[concept.formation]();
      const def = baseDefense();
      const tgt = concept.apply(off as any);
      assignCoverage(def, off, coverageRef.current);
      playersRef.current = [...off, ...def];
      setFormation(concept.formation);
      setPlayType(concept.type);
      setTarget(tgt);
      setSelected(null);
      setSimState('edit');
      setResult('');
      setActivePlay(concept.key);
      runningRef.current = false;
      simRef.current = null;
      trailRef.current.clear();
      rerender();
    },
    []
  );

  /* -------------------------------- Zeichnen ------------------------------ */

  const drawToken = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      g: { X: number; Y: number; s: number },
      color: string,
      label: string,
      o: { selected?: boolean; bob?: number; ghost?: boolean }
    ) => {
      const r = Math.max(5, Math.min(26, g.s * 1.0));
      const h = r * 1.55 + (o.bob ?? 0);
      const topY = g.Y - h;
      ctx.globalAlpha = o.ghost ? 0.5 : 1;

      // Bodenschatten
      ctx.fillStyle = 'rgba(0,0,0,.38)';
      ctx.beginPath();
      ctx.ellipse(g.X + r * 0.25, g.Y, r * 1.12, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Zylinder-Körper (Seitenfläche mit Verlauf)
      const grad = ctx.createLinearGradient(g.X - r, 0, g.X + r, 0);
      grad.addColorStop(0, shade(color, -0.4));
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, shade(color, -0.55));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(g.X - r, g.Y);
      ctx.lineTo(g.X - r, topY);
      ctx.lineTo(g.X + r, topY);
      ctx.lineTo(g.X + r, g.Y);
      ctx.closePath();
      ctx.fill();
      // untere Rundung
      ctx.beginPath();
      ctx.ellipse(g.X, g.Y, r, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade(color, -0.5);
      ctx.fill();

      // Deckel (heller, Lichtkante)
      ctx.beginPath();
      ctx.ellipse(g.X, topY, r, r * 0.42, 0, 0, Math.PI * 2);
      const cap = ctx.createLinearGradient(g.X, topY - r * 0.42, g.X, topY + r * 0.42);
      cap.addColorStop(0, shade(color, 0.45));
      cap.addColorStop(1, shade(color, 0.05));
      ctx.fillStyle = cap;
      ctx.fill();

      // Auswahl-Ring
      if (o.selected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(g.X, topY, r + 2.5, r * 0.42 + 2.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(g.X, topY, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label
      if (r > 7) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(r * 0.62)}px var(--font-jetbrains, monospace)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, g.X, topY);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
      ctx.globalAlpha = 1;
    },
    []
  );

  const draw = useCallback(
    (t: number) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, W, H);

      const sim = simRef.current;
      const ps = playersRef.current;
      const flash = snapRef.current && t - snapRef.current < 0.4
        ? 1 - (t - snapRef.current) / 0.4
        : 0;

      /* --- Atmosphäre / Stadion über dem Horizont --- */
      const skyTop = project(0, VIEW_TOP).Y;
      const sky = ctx.createLinearGradient(0, 0, 0, skyTop + 40);
      sky.addColorStop(0, '#070b16');
      sky.addColorStop(0.6, '#0b1226');
      sky.addColorStop(1, '#0f1a33');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, skyTop + 40);
      // Crowd-Speckle
      ctx.fillStyle = 'rgba(148,163,184,.10)';
      for (let i = 0; i < 220; i++) {
        const sx = (i * 137.5) % W;
        const sy = ((i * 53.3) % (skyTop - 16)) + 8;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      // Flutlicht-Sweeps
      for (let i = 0; i < 3; i++) {
        const phase = t * 0.25 + i * 2.1;
        const lx = W * (0.2 + 0.3 * i) + Math.sin(phase) * 80;
        const grd = ctx.createRadialGradient(lx, 6, 0, lx, 6, 230);
        const col = [oCol, '#9fd0ff', dCol][i];
        grd.addColorStop(0, hexA(col, 0.22));
        grd.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, skyTop + 60);
      }

      /* --- Rasen (perspektivisches Trapez) --- */
      const cTL = project(-FIELD_W / 2, VIEW_TOP);
      const cTR = project(FIELD_W / 2, VIEW_TOP);
      const cBL = project(-FIELD_W / 2, VIEW_BOT);
      const cBR = project(FIELD_W / 2, VIEW_BOT);
      ctx.beginPath();
      ctx.moveTo(cTL.X, cTL.Y);
      ctx.lineTo(cTR.X, cTR.Y);
      ctx.lineTo(cBR.X, cBR.Y);
      ctx.lineTo(cBL.X, cBL.Y);
      ctx.closePath();
      const turf = ctx.createLinearGradient(0, skyTop, 0, H);
      turf.addColorStop(0, '#0a3a22');
      turf.addColorStop(1, '#0f5230');
      ctx.fillStyle = turf;
      ctx.fill();

      // Mähstreifen (jede 5 Yards leicht abwechselnd)
      for (let y = VIEW_TOP; y < VIEW_BOT; y += 5) {
        const a = project(-FIELD_W / 2, y);
        const b = project(FIELD_W / 2, y);
        const a2 = project(-FIELD_W / 2, y + 5);
        const b2 = project(FIELD_W / 2, y + 5);
        if ((Math.round((y - VIEW_TOP) / 5) % 2) === 0) {
          ctx.beginPath();
          ctx.moveTo(a.X, a.Y);
          ctx.lineTo(b.X, b.Y);
          ctx.lineTo(b2.X, b2.Y);
          ctx.lineTo(a2.X, a2.Y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255,255,255,.025)';
          ctx.fill();
        }
      }

      // Endzone (fern) in Defense-Farbe
      const ezA = project(-FIELD_W / 2, VIEW_TOP);
      const ezB = project(FIELD_W / 2, VIEW_TOP);
      const ezC = project(FIELD_W / 2, GOAL_Y);
      const ezD = project(-FIELD_W / 2, GOAL_Y);
      ctx.beginPath();
      ctx.moveTo(ezA.X, ezA.Y);
      ctx.lineTo(ezB.X, ezB.Y);
      ctx.lineTo(ezC.X, ezC.Y);
      ctx.lineTo(ezD.X, ezD.Y);
      ctx.closePath();
      ctx.fillStyle = hexA(dCol, 0.6);
      ctx.fill();
      // Endzone-Schriftzug
      const ezMid = project(0, (VIEW_TOP + GOAL_Y) / 2);
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.font = `bold ${Math.round(ezMid.s * 1.6)}px var(--font-playfair, serif)`;
      ctx.textAlign = 'center';
      ctx.fillText(defName.toUpperCase(), ezMid.X, ezMid.Y);
      ctx.textAlign = 'left';

      // Yard-Linien + Nummern
      for (let y = VIEW_TOP; y <= VIEW_BOT; y++) {
        if (((y % 5) + 5) % 5 !== 0) continue;
        const a = project(-FIELD_W / 2, y);
        const b = project(FIELD_W / 2, y);
        const isLos = y === 0;
        const isGoal = y === GOAL_Y;
        ctx.strokeStyle = isLos
          ? `rgba(96,165,250,${0.7 + flash * 0.3})`
          : isGoal
          ? 'rgba(255,255,255,.9)'
          : 'rgba(255,255,255,.30)';
        ctx.lineWidth = isLos ? 2.5 : isGoal ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(a.X, a.Y);
        ctx.lineTo(b.X, b.Y);
        ctx.stroke();
        if (!isLos && !isGoal && y < VIEW_BOT) {
          const n = project(-15, y);
          ctx.fillStyle = 'rgba(255,255,255,.38)';
          ctx.font = `${Math.round(n.s * 1.05)}px var(--font-jetbrains, monospace)`;
          ctx.fillText(String(Math.abs(y)), n.X, n.Y - 2);
        }
      }
      // Sidelines
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cTL.X, cTL.Y);
      ctx.lineTo(cBL.X, cBL.Y);
      ctx.moveTo(cTR.X, cTR.Y);
      ctx.lineTo(cBR.X, cBR.Y);
      ctx.stroke();
      // Hash-Marks
      ctx.strokeStyle = 'rgba(255,255,255,.20)';
      for (let y = VIEW_TOP; y <= VIEW_BOT; y++) {
        for (const hx of [-3.1, 3.1]) {
          const p = project(hx, y);
          ctx.beginPath();
          ctx.moveTo(p.X - 2, p.Y);
          ctx.lineTo(p.X + 2, p.Y);
          ctx.stroke();
        }
      }

      // LOS-Glow
      if (flash > 0) {
        const l = project(0, 0);
        const g = ctx.createRadialGradient(l.X, l.Y, 0, l.X, l.Y, 160);
        g.addColorStop(0, `rgba(96,165,250,${0.25 * flash})`);
        g.addColorStop(1, 'rgba(96,165,250,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      /* --- Zonen (Edit-Modus) --- */
      if (simState === 'edit') {
        for (const d of ps) {
          if (d.side !== 'D' || !d.zone) continue;
          const s = project(d.x, d.y);
          const z = project(d.zone.x, d.zone.y);
          ctx.strokeStyle = 'rgba(34,211,238,.35)';
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(s.X, s.Y);
          ctx.lineTo(z.X, z.Y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.ellipse(z.X, z.Y, 14, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      /* --- Routen (animierte Flow-Dashes auf dem Boden) --- */
      for (const p of ps) {
        if (p.side !== 'O' || p.route.length === 0) continue;
        const pts = [{ x: p.x, y: p.y }, ...p.route].map((w) => project(w.x, w.y));
        ctx.strokeStyle = p.id === selected ? '#fbbf24' : hexA(oCol, 0.95);
        ctx.lineWidth = 3;
        ctx.shadowColor = p.id === selected ? '#fbbf24' : oCol;
        ctx.shadowBlur = 8;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = reducedRef.current ? 0 : -t * 36;
        ctx.beginPath();
        ctx.moveTo(pts[0].X, pts[0].Y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].X, pts[i].Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        // Pfeilspitze
        const L = pts[pts.length - 1];
        const P = pts[pts.length - 2];
        const a = Math.atan2(L.Y - P.Y, L.X - P.X);
        ctx.fillStyle = p.id === selected ? '#fbbf24' : oCol;
        ctx.beginPath();
        ctx.moveTo(L.X, L.Y);
        ctx.lineTo(L.X - 11 * Math.cos(a - 0.4), L.Y - 11 * Math.sin(a - 0.4));
        ctx.lineTo(L.X - 11 * Math.cos(a + 0.4), L.Y - 11 * Math.sin(a + 0.4));
        ctx.closePath();
        ctx.fill();
      }

      /* --- Bewegungs-Trails (während Sim) --- */
      if (sim) {
        for (const [id, tr] of trailRef.current) {
          if (tr.length < 2) continue;
          const isOff = id.startsWith('O');
          for (let i = 1; i < tr.length; i++) {
            const a = project(tr[i - 1].x, tr[i - 1].y);
            const b = project(tr[i].x, tr[i].y);
            ctx.strokeStyle = hexA(isOff ? oCol : dCol, (i / tr.length) * 0.5);
            ctx.lineWidth = 3 * (i / tr.length);
            ctx.beginPath();
            ctx.moveTo(a.X, a.Y);
            ctx.lineTo(b.X, b.Y);
            ctx.stroke();
          }
        }
      }

      /* --- Spieler (von fern nach nah für korrekte Überdeckung) --- */
      const order = [...ps].sort((a, b) => {
        const ay = sim && a.sy !== undefined ? a.sy! : a.y;
        const by = sim && b.sy !== undefined ? b.sy! : b.y;
        return by - ay; // höhere y (näher) zuletzt
      });
      for (const p of order) {
        const pos = sim && p.sx !== undefined ? { x: p.sx!, y: p.sy! } : { x: p.x, y: p.y };
        const g = project(pos.x, pos.y);
        const bob = reducedRef.current || sim ? 0 : Math.sin(t * 2 + hashAt(p.id) * 6.28) * 1.6;
        if (sim) {
          const tr = trailRef.current.get(p.id) ?? [];
          tr.push({ x: pos.x, y: pos.y });
          if (tr.length > 14) tr.shift();
          trailRef.current.set(p.id, tr);
        }
        drawToken(ctx, g, p.side === 'O' ? oCol : dCol, p.pos, {
          selected: p.id === selected,
          bob,
        });
      }

      /* --- Ball (3D-Flugbahn mit Schatten) --- */
      if (sim) {
        let bp: Pt = sim.ball;
        let z = 0;
        if (sim.ball.flight) {
          const f = sim.ball.flight;
          const k = Math.min(1, (sim.t - f.t0) / f.dur);
          bp = { x: f.from.x + (f.to.x - f.from.x) * k, y: f.from.y + (f.to.y - f.from.y) * k };
          z = Math.sin(k * Math.PI) * (4 + dist(f.from, f.to) * 0.18);
        } else if (sim.ball.carrier) {
          const c = ps.find((q) => q.id === sim.ball.carrier);
          if (c) bp = { x: c.sx!, y: c.sy! };
          z = 1.2;
        }
        const sh = project(bp.x, bp.y, 0);
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath();
        ctx.ellipse(sh.X, sh.Y, 4, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        const bq = project(bp.x, bp.y, z);
        ctx.save();
        ctx.translate(bq.X, bq.Y);
        ctx.rotate(sim.ball.flight ? t * 8 : 0);
        ctx.beginPath();
        ctx.ellipse(0, 0, 6.5, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8b4a1f';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(3, 0);
        ctx.stroke();
        ctx.restore();

        // Spieluhr
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.font = 'bold 13px var(--font-jetbrains, monospace)';
        ctx.fillText(`${sim.t.toFixed(1)}s`, W - 58, 24);
      }

      // Vignette / Vordergrund
      const vg = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    },
    [oCol, dCol, defName, selected, simState, drawToken]
  );

  // draw + tick via Refs an die persistente Schleife geben
  const drawRef = useRef(draw);
  drawRef.current = draw;

  /* ------------------------------- Simulation ----------------------------- */

  const finish = (msg: string) => {
    const sim = simRef.current;
    if (sim) {
      sim.phase = 'over';
      sim.outcome = msg;
    }
    setResult(msg);
  };

  function moveToward(p: Player, goal: Pt, dt: number, spd: number) {
    const d = Math.hypot(goal.x - p.sx!, goal.y - p.sy!);
    if (d < 0.05) return;
    const step = Math.min(d, spd * dt);
    p.sx! += ((goal.x - p.sx!) / d) * step;
    p.sy! += ((goal.y - p.sy!) / d) * step;
  }

  function routeGoal(p: Player, traveled: number): Pt | null {
    let rem = traveled;
    let prev: Pt = { x: p.x, y: p.y };
    for (const w of p.route) {
      const seg = dist(prev, w);
      if (rem < seg) return w;
      rem -= seg;
      prev = w;
    }
    return null;
  }

  const tick = (dt: number) => {
    const sim = simRef.current!;
    const ps = playersRef.current;
    const off = ps.filter((p) => p.side === 'O');
    const def = ps.filter((p) => p.side === 'D');
    const qb = off.find((p) => p.pos === 'QB')!;
    const target = targetRef.current;
    const playType = playTypeRef.current;
    const coverage = coverageRef.current;
    const carrier = sim.ball.carrier ? ps.find((p) => p.id === sim.ball.carrier) : null;

    for (const p of off) {
      const spd = SPEED[p.pos] ?? 8;
      const isCarrier = carrier?.id === p.id && p.pos !== 'QB';
      if (['C', 'G', 'T'].includes(p.pos)) continue;
      if (p.pos === 'QB' && sim.ball.carrier === p.id) continue;
      if (isCarrier) {
        const near = def.reduce((a, b) =>
          Math.hypot(a.sx! - p.sx!, a.sy! - p.sy!) < Math.hypot(b.sx! - p.sx!, b.sy! - p.sy!) ? a : b
        );
        const away = Math.sign(p.sx! - near.sx!) || (Math.random() > 0.5 ? 1 : -1);
        const goal = { x: Math.max(-24, Math.min(24, p.sx! + away * 2)), y: p.sy! - 6 };
        moveToward(p, goal, dt, spd);
        continue;
      }
      const traveled = (SPEED[p.pos] ?? 8) * sim.t;
      const goal = routeGoal(p, traveled);
      if (goal) moveToward(p, goal, dt, spd);
      else if (p.route.length > 0) moveToward(p, { x: p.sx!, y: p.sy! - 2 }, dt, spd * 0.45);
    }

    let ballPos: Pt;
    if (sim.ball.flight) {
      const f = sim.ball.flight;
      const k = Math.min(1, (sim.t - f.t0) / f.dur);
      ballPos = { x: f.from.x + (f.to.x - f.from.x) * k, y: f.from.y + (f.to.y - f.from.y) * k };
    } else if (carrier) ballPos = { x: carrier.sx!, y: carrier.sy! };
    else ballPos = sim.ball;
    const ballLive = !!carrier && carrier.pos !== 'QB' && !sim.ball.flight;

    for (const d of def) {
      const spd = (SPEED[d.pos] ?? 8) * 0.97;
      if (ballLive) {
        moveToward(d, ballPos, dt, spd);
        continue;
      }
      if (d.rush) {
        const blocked = sim.t < (d.blockShed ?? 2.8);
        moveToward(d, { x: qb.sx!, y: qb.sy! }, dt, blocked ? spd * 0.22 : spd);
        continue;
      }
      if (d.manTarget) {
        const tt = ps.find((p) => p.id === d.manTarget)!;
        moveToward(d, { x: tt.sx!, y: tt.sy! }, dt, spd * 0.985);
        continue;
      }
      if (d.zone) {
        const inZone = Math.hypot(d.sx! - d.zone.x, d.sy! - d.zone.y) < 0.6;
        if (!inZone) moveToward(d, d.zone, dt, spd);
        else if (sim.ball.flight) moveToward(d, ballPos, dt, spd);
      }
    }

    if (sim.ball.carrier === qb.id && !sim.ball.flight) {
      for (const d of def) {
        if (d.rush && Math.hypot(d.sx! - qb.sx!, d.sy! - qb.sy!) < 0.8) {
          finish(`💥 SACK! ${coverage} bringt den QB zu Boden.`);
          return;
        }
      }
    }

    if (playType === 'pass' && sim.ball.carrier === qb.id && !sim.ball.flight && sim.t >= sim.throwAt) {
      const tgt = ps.find((p) => p.id === target);
      if (tgt) {
        const to = { x: tgt.sx! + (tgt.sx! - tgt.x) * 0.02, y: tgt.sy! - 0.45 };
        const dur = Math.max(0.25, dist({ x: qb.sx!, y: qb.sy! }, to) / 21);
        sim.ball.flight = { from: { x: qb.sx!, y: qb.sy! }, to, t0: sim.t, dur, to_id: tgt.id };
        sim.ball.carrier = null;
      }
    } else if (playType === 'run' && sim.ball.carrier === qb.id && sim.t >= sim.throwAt) {
      const tgt = ps.find((p) => p.id === target);
      if (tgt && tgt.id !== qb.id) sim.ball.carrier = tgt.id;
    }

    if (sim.ball.flight && sim.t - sim.ball.flight.t0 >= sim.ball.flight.dur) {
      const tgt = ps.find((p) => p.id === sim.ball.flight!.to_id)!;
      const arrive = sim.ball.flight.to;
      const catchDist = Math.hypot(tgt.sx! - arrive.x, tgt.sy! - arrive.y);
      let nearest = Infinity;
      for (const d of def) nearest = Math.min(nearest, Math.hypot(d.sx! - arrive.x, d.sy! - arrive.y));
      sim.ball.flight = undefined;
      if (catchDist > 2.2) finish('❌ INCOMPLETE — Wurf zu ungenau.');
      else if (nearest < 0.8) {
        if (Math.random() < 0.35) finish(`🛑 INTERCEPTION! ${coverage} liest den Wurf.`);
        else finish('❌ INCOMPLETE — Verteidiger schlägt den Ball weg.');
      } else if (nearest < 1.6 && Math.random() < 0.45) {
        finish('❌ INCOMPLETE — eng verteidigt (Contested Catch).');
      } else {
        sim.ball.carrier = tgt.id;
      }
      return;
    }

    if (carrier && carrier.pos !== 'QB') {
      for (const d of def) {
        if (Math.hypot(d.sx! - carrier.sx!, d.sy! - carrier.sy!) < 0.65) {
          const gain = Math.round(-carrier.sy!);
          finish(
            gain >= 0
              ? `✅ ${playType === 'pass' ? 'COMPLETE' : 'RUN'} — Tackle nach +${gain} Yards.`
              : `✅ Tackle für ${gain} Yards.`
          );
          return;
        }
      }
      if (carrier.sy! < GOAL_Y + 0.5) finish(`🏈 TOUCHDOWN! Niemand holt ihn ein!`);
    }
  };
  const tickRef = useRef(tick);
  tickRef.current = tick;

  const startSim = useCallback(() => {
    const ps = playersRef.current;
    const off = ps.filter((p) => p.side === 'O');
    ps.forEach((p) => {
      p.sx = p.x;
      p.sy = p.y;
      p.blockShed = 2.4 + Math.random() * 1.2;
    });
    trailRef.current.clear();
    const routeDur = new Map<string, number>();
    for (const p of off) {
      let len = 0;
      let prev: Pt = { x: p.x, y: p.y };
      for (const w of p.route) {
        len += dist(prev, w);
        prev = w;
      }
      routeDur.set(p.id, len / (SPEED[p.pos] ?? 8));
    }
    const qb = off.find((p) => p.pos === 'QB')!;
    const tgtDur = routeDur.get(targetRef.current) ?? 1.5;
    simRef.current = {
      t: 0,
      ball: { x: qb.x, y: qb.y, carrier: qb.id, thrown: false },
      phase: 'live',
      routeDur,
      throwAt: playTypeRef.current === 'pass' ? Math.min(Math.max(tgtDur * 0.78, 1.0), 3.4) : 0.7,
      outcome: '',
    };
    snapRef.current = ambientRef.current;
    setResult('');
    setSimState('running');
    runningRef.current = true;
  }, []);

  /* ----------------- Eine persistente Animationsschleife ------------------ */

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      if (!last) last = ts;
      let dt = (ts - last) / 1000;
      last = ts;
      dt = Math.min(dt, 0.05);
      ambientRef.current += dt;
      if (runningRef.current && simRef.current) {
        const sim = simRef.current;
        const sdt = Math.min(0.05, dt * speedRef.current);
        sim.t += sdt;
        tickRef.current(sdt);
        if (sim.phase !== 'live' || sim.t >= 12) {
          if (sim.phase === 'live') {
            sim.phase = 'over';
            setResult('⏱ Zeit abgelaufen — Play tot.');
          }
          runningRef.current = false;
          setSimState('done');
        }
      }
      drawRef.current(ambientRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* -------------------------------- Maus-Input ---------------------------- */

  const dragRef = useRef<string | null>(null);

  const pointerYd = (e: React.MouseEvent): Pt | null => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return unproject(
      ((e.clientX - rect.left) / rect.width) * W,
      ((e.clientY - rect.top) / rect.height) * H
    );
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (simState !== 'edit') return;
    const yd = pointerYd(e);
    if (!yd) return;
    const hit = playersRef.current.find((p) => dist(p, yd) < 1.4);
    if (hit) {
      setSelected(hit.id);
      dragRef.current = hit.id;
    } else if (selected) {
      const sp = playersRef.current.find((p) => p.id === selected);
      if (sp && sp.side === 'O' && !['C', 'G', 'T'].includes(sp.pos)) {
        sp.route.push(yd);
        setActivePlay('');
        rerender();
      }
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || simState !== 'edit') return;
    const yd = pointerYd(e);
    if (!yd) return;
    const p = playersRef.current.find((q) => q.id === dragRef.current);
    if (p) {
      p.x = Math.max(-26, Math.min(26, yd.x));
      p.y = Math.max(VIEW_TOP + 1, Math.min(VIEW_BOT - 0.5, yd.y));
      rerender();
    }
  };

  const onMouseUp = () => {
    if (dragRef.current) {
      dragRef.current = null;
      reassign(coverage);
    }
  };

  /* --------------------------------- Aktionen ----------------------------- */

  const replay = () => {
    if (simState === 'running') return;
    startSim();
  };
  const resetPositions = () => {
    runningRef.current = false;
    simRef.current = null;
    trailRef.current.clear();
    playersRef.current.forEach((p) => {
      p.sx = undefined;
      p.sy = undefined;
    });
    setSimState('edit');
    setResult('');
    rerender();
  };
  const clearRoute = () => {
    const p = playersRef.current.find((q) => q.id === selected);
    if (p) {
      p.route = [];
      setActivePlay('');
      rerender();
    }
  };
  const clearAll = () => {
    playersRef.current.forEach((p) => (p.route = []));
    setActivePlay('');
    rerender();
  };
  const savePng = () => {
    const a = document.createElement('a');
    a.download = `play-${offTeam}-vs-${defTeam}.png`;
    a.href = canvasRef.current!.toDataURL('image/png');
    a.click();
  };

  const el = eligibles(playersRef.current.filter((p) => p.side === 'O'));
  const selPlayer = playersRef.current.find((p) => p.id === selected);
  const teamPlays = getTeamPlays(offTeam);
  const activeConcept = activePlay ? CONCEPT_MAP[activePlay] : null;

  /* ---------------------------------- Render ------------------------------ */

  return (
    <div className="grid xl:grid-cols-[250px_1fr_240px] gap-4">
      {/* Offense / Playbook Panel */}
      <div className="card p-4 space-y-4 order-2 xl:order-1">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: oCol }}>
            ● Offense
          </div>
          <select value={offTeam} onChange={(e) => setOffTeam(e.target.value)} className="pd-select">
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="pd-label">Playbook · {offName.split(' ').slice(-1)[0]}</label>
          <div className="space-y-1.5">
            {teamPlays.map((c) => (
              <button
                key={c.key}
                onClick={() => loadPlay(c)}
                className={`pd-play ${activePlay === c.key ? 'pd-play-on' : ''}`}
              >
                <span className="pd-play-name">{c.name}</span>
                <span className={`pd-tag ${c.type === 'run' ? 'pd-tag-run' : 'pd-tag-pass'}`}>
                  {c.type === 'run' ? 'LAUF' : 'PASS'}
                </span>
              </button>
            ))}
          </div>
          {activeConcept && (
            <p className="text-[11px] text-mute leading-relaxed mt-2 border-l-2 pl-2" style={{ borderColor: oCol }}>
              {activeConcept.blurb}
            </p>
          )}
        </div>

        <div>
          <label className="pd-label">Formation</label>
          <select
            value={formation}
            onChange={(e) => {
              setFormation(e.target.value);
              setActivePlay('');
              loadFormation(e.target.value, coverage);
            }}
            className="pd-select"
          >
            {Object.keys(OFF_FORMATIONS).map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="pd-label">Play-Typ</label>
          <div className="flex gap-2">
            {(['pass', 'run'] as const).map((tp) => (
              <button
                key={tp}
                onClick={() => setPlayType(tp)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition ${
                  playType === tp ? 'border-primary bg-primary/15 text-primary' : 'border-line text-mute hover:text-ink'
                }`}
              >
                {tp === 'pass' ? 'Pass' : 'Run'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="pd-label">{playType === 'pass' ? 'Ziel-Receiver' : 'Ballträger'}</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="pd-select">
            {el.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pos} ({p.x < 0 ? 'links' : 'rechts'} {Math.abs(Math.round(p.x))})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <button onClick={clearRoute} disabled={!selPlayer} className="pd-btn w-full">
            ✕ Route löschen {selPlayer ? `(${selPlayer.pos})` : ''}
          </button>
          <button onClick={clearAll} className="pd-btn w-full">✕ Alle Routen löschen</button>
        </div>
        <p className="text-[11px] text-mute leading-relaxed">
          <strong className="text-ink">So geht&apos;s:</strong> Spielzug laden – oder Spieler anklicken &
          ins Feld klicken (= Wegpunkt). Spieler ziehen = Position ändern.
        </p>
      </div>

      {/* Feld */}
      <div className="order-1 xl:order-2">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={simState === 'running' ? undefined : replay}
            disabled={simState === 'running'}
            className="btn-primary text-sm font-bold px-5 py-2 rounded-lg text-white disabled:opacity-50"
          >
            {simState === 'running' ? '⏳ Läuft…' : simState === 'done' ? '↻ Replay' : '▶ Simulieren'}
          </button>
          <button onClick={resetPositions} className="pd-btn">↺ Zurück zum Editor</button>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="pd-select !w-auto">
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2×</option>
          </select>
          <button onClick={savePng} className="pd-btn ml-auto">💾 PNG</button>
        </div>

        {result && (
          <div className="card px-4 py-3 mb-3 text-sm font-semibold border-primary/40">{result}</div>
        )}

        <div className="pd-stage">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            className="w-full rounded-xl cursor-crosshair select-none"
          />
        </div>
        <p className="text-[11px] text-mute mt-2 font-mono">
          {offName} <span style={{ color: oCol }}>●</span> vs. {defName}{' '}
          <span style={{ color: dCol }}>●</span> · {coverage}
        </p>
      </div>

      {/* Defense Panel */}
      <div className="card p-4 space-y-4 order-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider mb-1.5" style={{ color: dCol }}>
            ● Defense
          </div>
          <select value={defTeam} onChange={(e) => setDefTeam(e.target.value)} className="pd-select">
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="pd-label">Coverage</label>
          <select
            value={coverage}
            onChange={(e) => {
              const c = e.target.value as Coverage;
              setCoverage(c);
              reassign(c);
            }}
            className="pd-select"
          >
            {COVERAGES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="text-[11px] text-mute leading-relaxed space-y-2">
          <p><strong className="text-ink">Cover 1:</strong> Manndeckung, ein tiefer Free Safety.</p>
          <p><strong className="text-ink">Cover 2/3:</strong> Zonen — gestrichelte Linien zeigen die Landmarken.</p>
          <p><strong className="text-ink">Cover 0:</strong> Blitz! 6 Rusher, Manndeckung ohne Hilfe.</p>
          <p className="text-warn">Die Defense richtet sich automatisch an deiner Formation aus und reagiert live.</p>
        </div>
      </div>

      <style jsx global>{`
        .pd-stage {
          border-radius: 0.75rem;
          padding: 1px;
          background: linear-gradient(160deg, rgba(96, 165, 250, 0.5), rgba(34, 197, 94, 0.25), transparent 70%);
          box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.7);
        }
        .pd-stage canvas {
          display: block;
          background: #070b16;
        }
        .pd-select {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid #1f2a44;
          border-radius: 0.5rem;
          padding: 0.45rem 0.6rem;
          font-size: 0.8rem;
          color: #e2e8f0;
          outline: none;
        }
        .pd-select:focus { border-color: #3b82f6; }
        .pd-label {
          display: block;
          font-size: 0.65rem;
          font-family: var(--font-jetbrains), monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin-bottom: 0.35rem;
        }
        .pd-btn {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.45rem 0.8rem;
          border-radius: 0.5rem;
          border: 1px solid #1f2a44;
          color: #94a3b8;
          transition: all 0.15s;
        }
        .pd-btn:hover:not(:disabled) { color: #e2e8f0; border-color: #3b82f6; }
        .pd-btn:disabled { opacity: 0.4; }
        .pd-play {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.5rem 0.65rem;
          border-radius: 0.55rem;
          border: 1px solid #1f2a44;
          background: rgba(0, 0, 0, 0.25);
          transition: all 0.15s;
        }
        .pd-play:hover { border-color: #3b82f6; transform: translateX(2px); }
        .pd-play-on {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.12);
        }
        .pd-play-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #e2e8f0;
        }
        .pd-tag {
          font-size: 0.55rem;
          font-family: var(--font-jetbrains), monospace;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 0.1rem 0.35rem;
          border-radius: 999px;
        }
        .pd-tag-pass { background: rgba(59, 130, 246, 0.18); color: #93c5fd; }
        .pd-tag-run { background: rgba(34, 197, 94, 0.18); color: #86efac; }
      `}</style>
    </div>
  );
}

/* ------------------------------- Farb-Helfer ------------------------------ */

function shade(hex: string, amt: number): string {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  let r = parseInt(full.slice(0, 2), 16);
  let g = parseInt(full.slice(2, 4), 16);
  let b = parseInt(full.slice(4, 6), 16);
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function hexA(hex: string, a: number): string {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
