import { makeBody, type Body, type SimConfig } from './physics';
import { G_ASTRO, G_ABSTRACT, circularVelocity, periapsisVelocity, periapsisDistance } from './units';

export interface Preset {
  id: string;
  label: string;
  description: string;
  unit: 'astro' | 'abstract'; // 'astro' = AU / M☉ / yr, 'abstract' = normalised sim units
  config: Partial<SimConfig>;
  pixelsPerAU: number; // initial camera zoom, tuned per preset so the system fits the canvas
  keplerDemo?: boolean; // if true, area-sweep + orbital-elements overlays are enabled by default
  build: () => Body[];
}

const SUN = '#F5A623';
const TEAL = '#00C2A8';
const WHITE = '#E8ECF4';
const RED = '#E4572E';
const BLUE = '#4C8DFF';
const PURPLE = '#B388FF';

/**
 * Place a body on a Keplerian orbit around a fixed/dominant central mass,
 * starting at periapsis. `angle` rotates the periapsis point around the
 * central body so several orbits don't all start lined up.
 */
function orbitingBody(opts: {
  label: string;
  mass: number;
  radius: number;
  color: string;
  centralMass: number;
  centralPos?: { x: number; y: number };
  a: number;
  e: number;
  angle?: number;
  G?: number;
  retrograde?: boolean;
}): Body {
  const G = opts.G ?? G_ASTRO;
  const centralPos = opts.centralPos ?? { x: 0, y: 0 };
  const angle = opts.angle ?? 0;
  const GM = G * opts.centralMass;
  const rp = periapsisDistance(opts.a, opts.e);
  const speed = periapsisVelocity(GM, opts.a, opts.e) * (opts.retrograde ? -1 : 1);

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  // periapsis point along local +x, velocity perpendicular (local +y), then rotate by `angle`
  const localPos = { x: rp, y: 0 };
  const localVel = { x: 0, y: speed };
  const pos = {
    x: centralPos.x + localPos.x * cosA - localPos.y * sinA,
    y: centralPos.y + localPos.x * sinA + localPos.y * cosA,
  };
  const vel = {
    x: localVel.x * cosA - localVel.y * sinA,
    y: localVel.x * sinA + localVel.y * cosA,
  };

  return makeBody({
    label: opts.label,
    mass: opts.mass,
    radius: opts.radius,
    color: opts.color,
    pos,
    vel,
  });
}

/** Two mutually orbiting bodies about their shared centre of mass (zero total momentum). */
function twoBodySystem(opts: {
  labelA: string;
  labelB: string;
  massA: number;
  massB: number;
  radiusA: number;
  radiusB: number;
  colorA: string;
  colorB: string;
  a: number;
  e: number;
  G?: number;
}): Body[] {
  const G = opts.G ?? G_ASTRO;
  const total = opts.massA + opts.massB;
  const GM = G * total;
  const rp = periapsisDistance(opts.a, opts.e);
  const vRel = periapsisVelocity(GM, opts.a, opts.e);

  // split separation and relative velocity by mass ratio so the centre of mass stays at the origin
  const rA = (opts.massB / total) * rp;
  const rB = (opts.massA / total) * rp;
  const vA = (opts.massB / total) * vRel;
  const vB = (opts.massA / total) * vRel;

  return [
    makeBody({
      label: opts.labelA,
      mass: opts.massA,
      radius: opts.radiusA,
      color: opts.colorA,
      pos: { x: -rA, y: 0 },
      vel: { x: 0, y: -vA },
    }),
    makeBody({
      label: opts.labelB,
      mass: opts.massB,
      radius: opts.radiusB,
      color: opts.colorB,
      pos: { x: rB, y: 0 },
      vel: { x: 0, y: vB },
    }),
  ];
}

export const presets: Preset[] = [
  {
    id: 'keplers-laws',
    label: "Kepler's laws",
    description:
      "A single star with three orbiting bodies chosen to make all three of Kepler's laws visible at once: an eccentric comet traces a clear ellipse (1st law) and visibly speeds up near the star (2nd law), while all three orbits confirm T\u00B2 \u221D a\u00B3 (3rd law) in the live table.",
    unit: 'astro',
    config: { G: G_ASTRO, softening: 0.02, dt: 0.0008, trailLength: 2000 },
    pixelsPerAU: 90,
    keplerDemo: true,
    build: () => {
      const sun = makeBody({
        label: 'Star (1 M\u2609)',
        mass: 1,
        radius: 16,
        color: SUN,
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        fixed: true,
      });
      const comet = orbitingBody({
        label: 'Comet',
        mass: 0.0000001,
        radius: 5,
        color: RED,
        centralMass: 1,
        a: 2.2,
        e: 0.75,
        angle: 0,
      });
      const innerPlanet = orbitingBody({
        label: 'Inner planet',
        mass: 0.000003,
        radius: 6,
        color: TEAL,
        centralMass: 1,
        a: 1,
        e: 0.02,
        angle: Math.PI * 0.6,
      });
      const outerPlanet = orbitingBody({
        label: 'Outer planet',
        mass: 0.0000955,
        radius: 9,
        color: BLUE,
        centralMass: 1,
        a: 3.8,
        e: 0.04,
        angle: Math.PI * 1.3,
      });
      return [sun, comet, innerPlanet, outerPlanet];
    },
  },

  {
    id: 'solar-system',
    label: 'Inner solar system',
    description:
      'The Sun plus Mercury, Venus, Earth, Mars, and Jupiter, using real masses (in solar masses), semi-major axes (AU), and eccentricities. Jupiter is included specifically to stretch the a\u00B3 range for the 3rd-law check.',
    unit: 'astro',
    config: { G: G_ASTRO, softening: 0.01, dt: 0.0004, trailLength: 3000 },
    pixelsPerAU: 70,
    keplerDemo: true,
    build: () => {
      const sun = makeBody({
        label: 'Sun',
        mass: 1,
        radius: 15,
        color: SUN,
        pos: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        fixed: true,
      });
      const planets = [
        { label: 'Mercury', mass: 1.6601e-7, a: 0.387, e: 0.2056, color: '#B0B0B0', radius: 3 },
        { label: 'Venus', mass: 2.4478e-6, a: 0.723, e: 0.0068, color: '#E8C99B', radius: 5 },
        { label: 'Earth', mass: 3.0035e-6, a: 1.0, e: 0.0167, color: TEAL, radius: 5.5 },
        { label: 'Mars', mass: 3.2271e-7, a: 1.524, e: 0.0934, color: RED, radius: 4 },
        { label: 'Jupiter', mass: 9.5458e-4, a: 5.203, e: 0.0489, color: '#E0A96D', radius: 11 },
      ];
      return [
        sun,
        ...planets.map((p, i) =>
          orbitingBody({
            label: p.label,
            mass: p.mass,
            radius: p.radius,
            color: p.color,
            centralMass: 1,
            a: p.a,
            e: p.e,
            angle: (i / planets.length) * Math.PI * 2,
          })
        ),
      ];
    },
  },

  {
    id: 'binary',
    label: 'Binary star (\u03b1 Centauri AB)',
    description:
      'The real masses and orbit of Alpha Centauri A and B: 1.1 and 0.907 solar masses, semi-major axis 23.5 AU, eccentricity 0.52. Both stars orbit their common centre of mass.',
    unit: 'astro',
    config: { G: G_ASTRO, softening: 0.05, dt: 0.002, trailLength: 2500 },
    pixelsPerAU: 12,
    build: () =>
      twoBodySystem({
        labelA: '\u03b1 Cen A (1.1 M\u2609)',
        labelB: '\u03b1 Cen B (0.907 M\u2609)',
        massA: 1.1,
        massB: 0.907,
        radiusA: 13,
        radiusB: 11,
        colorA: SUN,
        colorB: TEAL,
        a: 23.5,
        e: 0.52,
      }),
  },

  {
    id: 'figure-eight',
    label: 'Figure-8 three-body',
    description:
      'The Chenciner\u2013Montgomery choreography: three equal masses chasing each other around a single figure-8 curve. A famous stable exact solution to the three-body problem, discovered numerically in 1993. Defined in normalised units (not physical AU/M\u2609) \u2014 it\u2019s a mathematical curiosity, not a real system.',
    unit: 'abstract',
    config: { G: G_ABSTRACT, softening: 0.01, dt: 0.006, trailLength: 800 },
    pixelsPerAU: 130,
    build: () => {
      const SCALE = 1.6;
      const VSCALE = 1.6;
      return [
        makeBody({
          label: 'Body 1',
          mass: 1,
          radius: 9,
          color: TEAL,
          pos: { x: 0.97000436 * SCALE, y: -0.24308753 * SCALE },
          vel: { x: 0.466203685 * VSCALE, y: 0.43236573 * VSCALE },
        }),
        makeBody({
          label: 'Body 2',
          mass: 1,
          radius: 9,
          color: SUN,
          pos: { x: -0.97000436 * SCALE, y: 0.24308753 * SCALE },
          vel: { x: 0.466203685 * VSCALE, y: 0.43236573 * VSCALE },
        }),
        makeBody({
          label: 'Body 3',
          mass: 1,
          radius: 9,
          color: WHITE,
          pos: { x: 0, y: 0 },
          vel: { x: -0.93240737 * VSCALE, y: -0.86473146 * VSCALE },
        }),
      ];
    },
  },

  {
    id: 'cluster',
    label: 'Chaotic cluster',
    description:
      'A scattering of bodies with random positions and small velocities, in normalised units. No two runs unfold the same way \u2014 a hands-on look at how sensitive N-body systems are to initial conditions.',
    unit: 'abstract',
    config: { G: G_ABSTRACT * 0.6, softening: 0.15, dt: 0.01, trailLength: 500 },
    pixelsPerAU: 130,
    build: () => {
      const colors = [TEAL, SUN, WHITE, RED, BLUE, PURPLE];
      const bodies: Body[] = [];
      const n = 18;
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + Math.random() * 0.3;
        const radius = 0.8 + Math.random() * 3;
        const mass = 0.3 + Math.random() * 1.2;
        bodies.push(
          makeBody({
            label: `Body ${i + 1}`,
            mass,
            radius: 3 + mass * 3,
            color: colors[i % colors.length],
            pos: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
            vel: {
              x: (Math.random() - 0.5) * 0.6,
              y: (Math.random() - 0.5) * 0.6,
            },
          })
        );
      }
      return bodies;
    },
  },

  {
    id: 'empty',
    label: 'Blank canvas',
    description:
      'Nothing here yet. Use the Add Body panel to place objects by mass (M\u2609) and orbital distance (AU) \u2014 or click-drag directly on the canvas for a quick freehand launch.',
    unit: 'astro',
    config: { G: G_ASTRO, softening: 0.02, dt: 0.0008, trailLength: 2000 },
    pixelsPerAU: 90,
    build: () => [],
  },
];

export function getPreset(id: string): Preset {
  return presets.find((p) => p.id === id) ?? presets[0];
}
