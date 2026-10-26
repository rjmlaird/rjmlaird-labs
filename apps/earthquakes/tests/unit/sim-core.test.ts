import { describe, expect, it } from 'vitest';
import * as s from '../../src/lib/sim-core';

describe('P–S distance', () => {
  it('round-trips distance → delay → distance', () => {
    const dt = s.psDelay(100, 6, 3.5);
    expect(dt).toBeCloseTo(11.9048, 3);
    expect(s.distanceFromPS(dt, 6, 3.5)).toBeCloseTo(100, 8);
  });
  it('rejects vS >= vP', () => expect(() => s.distanceFromPS(5, 3, 3)).toThrow());
  it('delay grows with distance', () => expect(s.psDelay(200, 6, 3.5)).toBeGreaterThan(s.psDelay(100, 6, 3.5)));
  it('locates a source from three exact circles', () => {
    const q = { x: 70, y: 110 };
    const st = [{ x: 30, y: 40 }, { x: 160, y: 60 }, { x: 90, y: 170 }];
    const p = s.locate(st.map((c) => ({ c, r: Math.hypot(c.x - q.x, c.y - q.y), tol: 0 })));
    expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeLessThan(0.2);
  });
});

describe('magnitude and energy', () => {
  it('one magnitude unit = 10× amplitude', () => expect(s.amplitudeRatio(5, 6)).toBeCloseTo(10));
  it('M5 vs M7 = 100× amplitude', () => expect(s.amplitudeRatio(5, 7)).toBeCloseTo(100));
  it('inverts amplitude ratio', () => expect(s.magnitudeDifference(1, 100)).toBeCloseTo(2));
  it('M = log10(A/A0)', () => expect(s.magnitudeFromAmplitude(1000, 1)).toBeCloseTo(3));
  it('energy rises ~31.6× per magnitude unit', () => expect(s.energyRatio(5, 6)).toBeCloseTo(31.6228, 3));
  it('energy of M0 is 10^4.8 J', () => expect(s.energyJoules(0)).toBeCloseTo(10 ** 4.8, 0));
});

describe('tsunami', () => {
  it('speed at 4000 m ≈ 198 m/s', () => expect(s.tsunamiSpeed(4000)).toBeCloseTo(198.09, 1));
  it('speed at 100 m ≈ 31.3 m/s', () => expect(s.tsunamiSpeed(100)).toBeCloseTo(31.32, 1));
  it('unit conversions', () => { expect(s.msToKmh(100)).toBeCloseTo(360); expect(s.msToMph(100)).toBeCloseTo(223.69, 1); });
  it('v = λ/T', () => expect(s.wavelength(200, 900)).toBe(180000));
  it('travel time over segments sums', () => {
    const segs = [{ km: 100, depth: 4000 }, { km: 10, depth: 100 }];
    expect(s.totalSeconds(segs)).toBeCloseTo(100000 / 198.09 + 10000 / 31.32, 0);
  });
  it('Green’s law raises height in shallow water', () => expect(s.heightRatio(4000, 100)).toBeCloseTo(2.515, 2));
  it('rejects non-positive depth', () => expect(() => s.tsunamiSpeed(0)).toThrow());
});
