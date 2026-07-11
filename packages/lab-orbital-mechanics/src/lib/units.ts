// Astronomical unit system: distances in AU, masses in solar masses (M☉),
// time in years. This is the natural unit system for solar-system-scale
// N-body work because it makes the gravitational constant a clean number:
//
//   G = 4π² AU³ / (M☉ · yr²)
//
// This falls straight out of Kepler's third law applied to Earth's orbit
// (a = 1 AU, T = 1 yr, M = 1 M☉): T² = 4π²a³ / (GM)  ⇒  G = 4π².
// Using this G means any preset built from real masses (in M☉) and real
// distances (in AU) produces physically correct periods and speeds with no
// further scaling — Kepler's third law isn't just illustrated, it's
// literally what the integrator obeys.

export const G_ASTRO = 4 * Math.PI * Math.PI; // AU³ M☉⁻¹ yr⁻²

// A separate, dimensionless G=1 is kept for presets that aren't meant to
// represent physical bodies (the figure-8 three-body choreography is a
// mathematical curiosity defined in normalised units, not AU/M☉/yr).
export const G_ABSTRACT = 1;

/** Circular orbital speed at distance r from a central mass M (both in AU / M☉). Returns AU/yr. */
export function circularVelocity(GM: number, r: number): number {
  return Math.sqrt(GM / r);
}

/** Speed at periapsis for an orbit with semi-major axis a and eccentricity e. Returns AU/yr. */
export function periapsisVelocity(GM: number, a: number, e: number): number {
  const rp = a * (1 - e);
  return Math.sqrt((GM * (1 + e)) / (rp * (1 - e)));
}

/** Periapsis distance for a given semi-major axis and eccentricity, in AU. */
export function periapsisDistance(a: number, e: number): number {
  return a * (1 - e);
}

/** Orbital period from semi-major axis, via Kepler's third law. Returns years. */
export function orbitalPeriod(GM: number, a: number): number {
  return 2 * Math.PI * Math.sqrt((a * a * a) / GM);
}

export interface OrbitalElements {
  a: number; // semi-major axis, AU (NaN if unbound)
  T: number; // period, years (NaN if unbound)
  bound: boolean;
}

/**
 * Estimate the two-body orbital elements of a body relative to a dominant
 * central mass, from its instantaneous position/velocity relative to that
 * mass (vis-viva + specific orbital energy). This treats the rest of the
 * system as a perturbation, which is exactly what makes Kepler's third law
 * only approximately true in a real N-body system — and exactly true in
 * the idealised two-body case.
 */
export function estimateOrbitalElements(
  relPos: { x: number; y: number },
  relVel: { x: number; y: number },
  GM: number
): OrbitalElements {
  const r = Math.hypot(relPos.x, relPos.y);
  const v2 = relVel.x * relVel.x + relVel.y * relVel.y;
  const energy = v2 / 2 - GM / r; // specific orbital energy
  if (energy >= 0 || GM <= 0) return { a: NaN, T: NaN, bound: false };
  const a = -GM / (2 * energy);
  const T = orbitalPeriod(GM, a);
  return { a, T, bound: true };
}
