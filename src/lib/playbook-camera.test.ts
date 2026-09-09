import { describe, it, expect, afterEach } from 'vitest';
import {
  CAM,
  CAM_PRESETS,
  type CamKey,
  applyCamPreset,
  project,
  unproject,
  FIELD_W,
  VIEW_TOP,
  VIEW_BOT,
  W,
  H,
} from './playbook-camera';

const keys = Object.keys(CAM_PRESETS) as CamKey[];

afterEach(() => applyCamPreset('broadcast', 1));

describe('Kamera-Presets', () => {
  it.each(keys)('%s hält das ganze Feld auf der Leinwand', (key) => {
    applyCamPreset(key, 1);

    const near = project(0, VIEW_BOT);
    const far = project(0, VIEW_TOP);

    // Vertikal: fernes Ende oben, nahes Ende unten, beides im Bild.
    expect(far.Y).toBeGreaterThanOrEqual(0);
    expect(near.Y).toBeLessThanOrEqual(H);
    expect(near.Y).toBeGreaterThan(far.Y);

    // Horizontal: die nahen Seitenlinien sind die breiteste Stelle.
    const sideline = project(FIELD_W / 2, VIEW_BOT);
    expect(sideline.X).toBeLessThanOrEqual(W);
    expect(sideline.X).toBeGreaterThan(W / 2);

    // Maßstab nimmt mit der Entfernung ab — sonst stimmt die Perspektive nicht.
    expect(near.s).toBeGreaterThan(far.s);
  });

  it.each(keys)('%s lässt sich wieder in Yards zurückrechnen', (key) => {
    applyCamPreset(key, 1);

    for (const p of [
      { x: 0, y: 0 },
      { x: -18, y: -12 },
      { x: 21, y: 8 },
    ]) {
      const { X, Y } = project(p.x, p.y);
      const back = unproject(X, Y);
      expect(back).not.toBeNull();
      expect(back!.x).toBeCloseTo(p.x, 6);
      expect(back!.y).toBeCloseTo(p.y, 6);
    }
  });

  it('Zoom skaliert den Maßstab, ohne die Rückrechnung zu brechen', () => {
    applyCamPreset('broadcast', 1);
    const normal = project(0, 0).s;

    applyCamPreset('broadcast', 1.25);
    expect(project(0, 0).s).toBeCloseTo(normal * 1.25, 6);

    const { X, Y } = project(12, -6);
    const back = unproject(X, Y);
    expect(back!.x).toBeCloseTo(12, 6);
    expect(back!.y).toBeCloseTo(-6, 6);
  });

  it('unproject gibt oberhalb des Horizonts null zurück', () => {
    applyCamPreset('broadcast', 1);
    expect(unproject(W / 2, CAM.horizon - 10)).toBeNull();
  });
});
