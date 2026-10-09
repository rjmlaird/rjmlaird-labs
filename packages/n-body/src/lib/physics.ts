// N-body gravitational simulation core.
//
// Integrator: velocity Verlet (symplectic — conserves energy far better than
// forward Euler over long runs, which matters once you start watching a
// three-body system for a few thousand steps).
//
// Softening: pairwise forces use Plummer softening (epsilon^2 added to the
// squared distance) so two bodies passing close together don't produce a
// force that blows up toward infinity — a standard trick in N-body codes,
// trading a little physical accuracy at very close range for numerical
// stability.

import { type Vec2, sub, length, scale } from './vectors';

export interface Body {
  id: number;
  label: string;
  mass: number; // arbitrary simulation units
  radius: number; // for rendering + trail width, not part of the physics
  color: string;
  pos: Vec2;
  vel: Vec2;
  acc: Vec2;
  trail: Vec2[];
  fixed?: boolean; // if true, body does not move (useful for a "sun anchor" demo)
}

export interface SimConfig {
  G: number; // gravitational constant, scaled for simulation units
  softening: number; // epsilon, in position units
  dt: number; // timestep, in simulation time units
  trailLength: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  G: 1,
  softening: 8,
  dt: 0.12,
  trailLength: 600,
};

let nextId = 1;
export function makeBody(partial: Omit<Body, 'id' | 'acc' | 'trail'>): Body {
  return {
    ...partial,
    id: nextId++,
    acc: { x: 0, y: 0 },
    trail: [],
  };
}

/** Compute gravitational acceleration on every body from every other body. */
export function computeAccelerations(bodies: Body[], config: SimConfig): void {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    bodies[i].acc.x = 0;
    bodies[i].acc.y = 0;
  }
  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const d = sub(bj.pos, bi.pos);
      const distSq = d.x * d.x + d.y * d.y + config.softening * config.softening;
      const dist = Math.sqrt(distSq);
      const forceMag = config.G / distSq; // (G * m) applied per-body below

      // a_i = G * m_j * dhat / distSq ; a_j = -G * m_i * dhat / distSq
      const ax = (d.x / dist) * forceMag;
      const ay = (d.y / dist) * forceMag;

      if (!bi.fixed) {
        bi.acc.x += ax * bj.mass;
        bi.acc.y += ay * bj.mass;
      }
      if (!bj.fixed) {
        bj.acc.x -= ax * bi.mass;
        bj.acc.y -= ay * bi.mass;
      }
    }
  }
}

/** Advance the system by one timestep using velocity Verlet integration. */
export function step(bodies: Body[], config: SimConfig): void {
  const { dt } = config;

  // 1. Update positions using current velocity + half-step of current acceleration
  for (const b of bodies) {
    if (b.fixed) continue;
    b.pos.x += b.vel.x * dt + 0.5 * b.acc.x * dt * dt;
    b.pos.y += b.vel.y * dt + 0.5 * b.acc.y * dt * dt;
  }

  // 2. Stash old accelerations, recompute at new positions
  const oldAcc = bodies.map((b) => ({ x: b.acc.x, y: b.acc.y }));
  computeAccelerations(bodies, config);

  // 3. Update velocities using the average of old and new acceleration
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.fixed) continue;
    b.vel.x += 0.5 * (oldAcc[i].x + b.acc.x) * dt;
    b.vel.y += 0.5 * (oldAcc[i].y + b.acc.y) * dt;
  }

  // 4. Record trail
  for (const b of bodies) {
    b.trail.push({ x: b.pos.x, y: b.pos.y });
    if (b.trail.length > config.trailLength) b.trail.shift();
  }
}

/** Total kinetic + potential energy — should stay roughly constant. Useful
 * as an on-screen sanity check that the integrator isn't drifting. */
export function totalEnergy(bodies: Body[], config: SimConfig): number {
  let ke = 0;
  let pe = 0;
  for (const b of bodies) {
    ke += 0.5 * b.mass * (b.vel.x * b.vel.x + b.vel.y * b.vel.y);
  }
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dist = length(sub(bodies[j].pos, bodies[i].pos));
      pe -= (config.G * bodies[i].mass * bodies[j].mass) / Math.sqrt(dist * dist + config.softening * config.softening);
    }
  }
  return ke + pe;
}

export function centreOfMass(bodies: Body[]): Vec2 {
  let totalMass = 0;
  let cx = 0;
  let cy = 0;
  for (const b of bodies) {
    totalMass += b.mass;
    cx += b.pos.x * b.mass;
    cy += b.pos.y * b.mass;
  }
  if (totalMass === 0) return { x: 0, y: 0 };
  return { x: cx / totalMass, y: cy / totalMass };
}
