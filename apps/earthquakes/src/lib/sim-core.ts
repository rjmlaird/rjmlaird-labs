/** Pure, framework-free physics helpers. Units: km, km/s, s unless stated. */
export const G = 9.81; // m/s²

export interface Pt { x: number; y: number }
export interface Circle { c: Pt; r: number; tol: number }
export interface Segment { km: number; depth: number }

// ---- Seismic waves ----
export const arrivalTime = (distance: number, speed: number) => distance / speed;
export const psDelay = (distance: number, vp: number, vs: number) => distance / vs - distance / vp;

/** Distance (km) per second of P–S delay: 1 / (1/vS − 1/vP). */
export function kmPerSecondOfDelay(vp: number, vs: number): number {
  if (!(vp > vs && vs > 0)) throw new RangeError('Require vP > vS > 0');
  return 1 / (1 / vs - 1 / vp);
}
/** d = Δt / (1/vS − 1/vP) */
export const distanceFromPS = (dt: number, vp: number, vs: number) => dt * kmPerSecondOfDelay(vp, vs);

// ---- Location ----
const err = (p: Pt, k: Circle) => Math.hypot(p.x - k.c.x, p.y - k.c.y) - k.r;
const sse = (p: Pt, ks: Circle[]) => ks.reduce((s, k) => s + err(p, k) ** 2, 0);

/** Least-squares point closest to all circles (coarse grid, then a fine local pass). */
export function locate(circles: Circle[], size = 200): Pt {
  let best: Pt = { x: size / 2, y: size / 2 };
  let bs = Infinity;
  const scan = (x0: number, x1: number, y0: number, y1: number, step: number) => {
    for (let x = x0; x <= x1; x += step)
      for (let y = y0; y <= y1; y += step) {
        const s = sse({ x, y }, circles);
        if (s < bs) { bs = s; best = { x, y }; }
      }
  };
  scan(0, size, 0, size, 1);
  const c = best;
  scan(c.x - 1, c.x + 1, c.y - 1, c.y + 1, 0.05);
  return best;
}
/** Grid cells (corner coordinates) consistent with every circle within its tolerance. */
export function uncertaintyCells(circles: Circle[], size = 200, step = 2): Pt[] {
  const out: Pt[] = [];
  for (let x = 0; x < size; x += step)
    for (let y = 0; y < size; y += step) {
      const p = { x: x + step / 2, y: y + step / 2 };
      if (circles.every((k) => Math.abs(err(p, k)) <= Math.max(k.tol, 0.01))) out.push({ x, y });
    }
  return out;
}

// ---- Magnitude ----
export const amplitudeRatio = (m1: number, m2: number) => 10 ** (m2 - m1);
export const magnitudeDifference = (a1: number, a2: number) => Math.log10(a2 / a1);
export const magnitudeFromAmplitude = (a: number, a0: number) => Math.log10(a / a0);
/** Approximate radiated energy (J): log10 E ≈ 1.5 M + 4.8 */
export const energyJoules = (m: number) => 10 ** (1.5 * m + 4.8);
export const energyRatio = (m1: number, m2: number) => 10 ** (1.5 * (m2 - m1));

// ---- Tsunami (shallow-water approximation) ----
export function tsunamiSpeed(depthM: number): number {
  if (!(depthM > 0)) throw new RangeError('Depth must be > 0');
  return Math.sqrt(G * depthM);
}
export const msToKmh = (v: number) => v * 3.6;
export const msToMph = (v: number) => v * 2.236936;
export const wavelength = (v: number, period: number) => v * period;
export const wavePeriod = (v: number, lambda: number) => lambda / v;
export const segmentSeconds = (km: number, depthM: number) => (km * 1000) / tsunamiSpeed(depthM);
export const totalSeconds = (segs: Segment[]) => segs.reduce((s, g) => s + segmentSeconds(g.km, g.depth), 0);
/** Green's law (illustrative): H2/H1 = (d1/d2)^(1/4) */
export const heightRatio = (deepM: number, shallowM: number) => (deepM / shallowM) ** 0.25;
