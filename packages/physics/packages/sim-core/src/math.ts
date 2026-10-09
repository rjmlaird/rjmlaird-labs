export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number): number =>
  outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

export const formatValue = (value: number, digits = 2): string =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";
export const formatUnit = (value: number, unit: string, digits = 2): string =>
  `${formatValue(value, digits)} ${unit}`;

/** Surface gravity (m/s²) for "world" selectors. */
export const PLANETS: Record<string, number> = { Moon: 1.62, Mars: 3.71, Earth: 9.81, Jupiter: 24.79 };

/** SI constants shared by physics modules. */
export const G_SI = 6.6743e-11;
export const C = 299_792_458;
export const G_ASTRO = 4 * Math.PI * Math.PI; // AU³ M☉⁻¹ yr⁻²
