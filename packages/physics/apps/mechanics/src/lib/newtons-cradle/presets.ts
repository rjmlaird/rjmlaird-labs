import type { CradleConfig, CradleScenario, Pendulum } from './types';

export type CradlePreset = {
  id: CradleScenario;
  label: string;
  description: string;
  notes?: string;
  config: CradleConfig;
  pendulums: Pendulum[];
};

const LENGTH = 1.2; // m, shared string length
const RADIUS = 0.18; // m, ball radius (so centres are 0.36 m apart when touching)
const SLOT = (i: number, n: number) => (i - (n - 1) / 2) * (2 * RADIUS);

function makeRow(n: number, masses: number[], colors: string[]): Pendulum[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `ball-${i + 1}`,
    mass: masses[i] ?? masses[masses.length - 1],
    length: LENGTH,
    theta: 0,
    omega: 0,
    restX: SLOT(i, n),
    color: colors[i % colors.length],
  }));
}

const PALETTE = ['#00c2a8', '#f5a623', '#60a5fa', '#f87171', '#a78bfa'];

export const cradlePresets: CradlePreset[] = [
  {
    id: 'one-in',
    label: 'One ball in',
    description: 'Pull one ball back and release — momentum and energy pass through the row so only the last ball flies out.',
    notes: 'With equal masses and elastic collisions, the middle balls barely move: each collision hands the full momentum and kinetic energy on to the next ball.',
    config: { gravity: 9.81, restitution: 1, ballRadius: RADIUS },
    pendulums: (() => {
      const row = makeRow(5, [1, 1, 1, 1, 1], PALETTE);
      row[0] = { ...row[0], theta: -0.6 };
      return row;
    })(),
  },
  {
    id: 'two-in',
    label: 'Two balls in',
    description: 'Pull back two balls together — two balls fly out the far side at (nearly) the same speed they arrived with.',
    config: { gravity: 9.81, restitution: 1, ballRadius: RADIUS },
    pendulums: (() => {
      const row = makeRow(5, [1, 1, 1, 1, 1], PALETTE);
      row[0] = { ...row[0], theta: -0.6 };
      row[1] = { ...row[1], theta: -0.6 };
      return row;
    })(),
  },
  {
    id: 'unequal-mass',
    label: 'Unequal masses',
    description: 'Swing a heavier ball into a row of lighter ones — momentum still balances, but it can no longer all leave as a single ball at the same speed.',
    notes: 'Compare the momentum and energy panels before and after: momentum is always conserved, but a mass mismatch means kinetic energy and momentum cannot both be carried away by a single equal-mass ball, so the outgoing motion looks different from the classic case.',
    config: { gravity: 9.81, restitution: 1, ballRadius: RADIUS },
    pendulums: (() => {
      const row = makeRow(5, [2.4, 1, 1, 1, 1], PALETTE);
      row[0] = { ...row[0], theta: -0.6 };
      return row;
    })(),
  },
  {
    id: 'inelastic',
    label: 'Inelastic collisions',
    description: 'The same one-ball swing, but with lossy collisions — momentum is still conserved, energy is not.',
    notes: 'Watch the energy panel: kinetic + potential energy visibly drops after each collision, while the momentum check still balances.',
    config: { gravity: 9.81, restitution: 0.6, ballRadius: RADIUS },
    pendulums: (() => {
      const row = makeRow(5, [1, 1, 1, 1, 1], PALETTE);
      row[0] = { ...row[0], theta: -0.6 };
      return row;
    })(),
  },
];

export function getCradlePreset(id: CradleScenario): CradlePreset {
  return cradlePresets.find((p) => p.id === id) ?? cradlePresets[0];
}
