import { describe, expect, it } from 'vitest';
import { CONCEPTS, CONCEPT_MAP, countersFor, strongAgainst } from '@/data/playbook-plays';
import { OFF_FORMATIONS, verdict } from '@/components/playbook/PlayDesigner';

describe('Erklärung unter dem Ergebnis', () => {
  it('widerspricht dem Ausgang nicht', () => {
    // Genau dieser Fall stand vorher als "stark gegen Cover 1" unter einem Sack.
    expect(verdict('Y-Cross', 'Cover 1', true, false, [])).toContain('Diesmal war die Defense schneller');
    expect(verdict('Smash', 'Cover 2', true, true, [])).toBe('Passt: Smash ist stark gegen Cover 2.');
    expect(verdict('Mesh', 'Cover 3', false, true, ['Dagger'])).toMatch(/^Hat geklappt.*Dagger/);
    expect(verdict('Mesh', 'Cover 3', false, false, [])).toBe('Mesh hat gegen Cover 3 keinen Vorteil.');
  });
});

describe('Spielzüge in ihrer Formation', () => {
  // Die Mini-Diagramme rechnen jeden Spielzug beim Server-Rendern durch. Ein
  // Absturz hier (Stick in Trips: "reading 'x'") legte die ganze Seite lahm.
  it.each(CONCEPTS.map((c) => [c.name, c] as const))('%s hat ein Ziel mit Route', (_, concept) => {
    const off = OFF_FORMATIONS[concept.formation]();
    const target = concept.apply(off);
    const player = off.find((p) => p.id === target);
    expect(player).toBeDefined();
    expect(player!.route.length).toBeGreaterThan(0);
  });
});

describe('Konzept vs. Coverage', () => {
  it('erkennt die Lehrbuch-Antwort am UI-Namen der Coverage', () => {
    expect(strongAgainst(CONCEPT_MAP.smash, 'Cover 2 — Zone')).toBe(true);
    expect(strongAgainst(CONCEPT_MAP.smash, 'Cover 3 — Zone')).toBe(false);
    expect(strongAgainst(CONCEPT_MAP['tush-push'], 'Cover 0 — Blitz')).toBe(false);
  });

  it('schlägt nur Spielzüge der gleichen Spielart als Alternative vor', () => {
    const runs = countersFor('Cover 2 — Zone', 'run');
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((c) => c.type === 'run')).toBe(true);
    expect(countersFor('Cover 1 — Man Free', 'pass').map((c) => c.key)).toContain('mesh');
  });
});
