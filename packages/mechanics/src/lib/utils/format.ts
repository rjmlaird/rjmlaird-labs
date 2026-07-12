// -----------------------------------------------------------------------------
// Mechanics Lab physics engine
//
// The scene is a 1D path: a ramp of arc-length `rampLength` (metres) at angle
// `rampAngle` (radians), followed by a flat, frictional/drag-affected run-out.
// Every block's state lives on that path as a scalar arc-length `s` (metres,
// 0 = top of ramp) and a signed velocity `v` (m/s, positive = down/along the
// path). Working in real SI units (not pixels) means every readout — speed,
// force, energy — is physically meaningful, and `pathToXY` is the only place
// that ever converts to pixels for drawing.
// -----------------------------------------------------------------------------

export type Vec2 = { x: number; y: number };

export type Block = {
  id: number;
  mass: number; // kg
  s: number; // metres along the path from the top of the ramp
  v: number; // m/s, signed, positive = moving down/along the path
  size: number; // px, for drawing only
  color: string;
  label: string;
  distance: number; // m, cumulative path length travelled (odometer)
  acceleration: number; // m/s^2, last computed value (signed, along path)
  energyDissipated: number; // J, cumulative energy lost to friction + drag
  initialEnergy: number; // J, mechanical energy at t=0 (for the conservation check)
  locked: boolean; // true while static friction is holding it at rest
};

export type LabConfig = {
  gravity: number; // m/s^2
  muKinetic: number; // coefficient of kinetic friction
  muStatic: number; // coefficient of static friction (>= muKinetic)
  rampAngle: number; // radians
  rampLength: number; // metres, arc length of the incline
  rampX: number; // px, canvas x of the top of the ramp
  groundY: number; // px, canvas y of the flat run-out
  dragEnabled: boolean;
  dragCoefficient: number; // k in F_drag = k * v^2 (lumps together 0.5 * Cd * rho * A)
  collisionsEnabled: boolean;
  restitution: number; // 0 = perfectly inelastic, 1 = perfectly elastic
};

export const PX_PER_M = 55;
export const CONTACT_M = 0.55; // how close two block centres get before they "touch"

export const PLANETS: Record<string, number> = {
  Moon: 1.62,
  Mars: 3.71,
  Earth: 9.81,
  Jupiter: 24.79,
};

const PALETTE = ['#60a5fa', '#f5a623', '#34d399', '#f87171', '#a78bfa'];
export function colorForIndex(i: number) {
  return PALETTE[i % PALETTE.length];
}

export function createBlock(
  id: number,
  mass: number,
  s: number,
  v: number,
  color: string,
  label: string,
  cfg: LabConfig
): Block {
  const block: Block = {
    id,
    mass,
    s,
    v,
    size: 26,
    color,
    label,
    distance: 0,
    acceleration: 0,
    energyDissipated: 0,
    initialEnergy: 0,
    locked: false,
  };
  block.initialEnergy = kineticEnergy(block) + potentialEnergy(block, cfg);
  return block;
}

/** Height above the flat ground, in metres, for a point at arc-length s. */
export function heightAboveGround(s: number, cfg: LabConfig): number {
  if (s >= cfg.rampLength) return 0;
  return (cfg.rampLength - s) * Math.sin(cfg.rampAngle);
}

/** Convert an arc-length position to canvas pixel coordinates. */
export function pathToXY(s: number, cfg: LabConfig): Vec2 {
  const rampBottomX = cfg.rampX + cfg.rampLength * Math.cos(cfg.rampAngle) * PX_PER_M;
  if (s <= cfg.rampLength) {
    return {
      x: cfg.rampX + s * Math.cos(cfg.rampAngle) * PX_PER_M,
      y: cfg.groundY - heightAboveGround(s, cfg) * PX_PER_M,
    };
  }
  return { x: rampBottomX + (s - cfg.rampLength) * PX_PER_M, y: cfg.groundY };
}

export function speedOf(block: Block) {
  return Math.abs(block.v);
}
export function kineticEnergy(block: Block) {
  return 0.5 * block.mass * block.v * block.v;
}
export function potentialEnergy(block: Block, cfg: LabConfig) {
  return block.mass * cfg.gravity * heightAboveGround(block.s, cfg);
}
export function momentum(block: Block) {
  return block.mass * block.v;
}
export function totalMechanicalEnergy(block: Block, cfg: LabConfig) {
  return kineticEnergy(block) + potentialEnergy(block, cfg);
}

export type ForceBreakdown = {
  onRamp: boolean;
  weight: number; // N, mg
  normal: number; // N
  gravityAlong: number; // N, component of weight along the path (0 on flat ground)
  frictionStaticMax: number; // N, mu_s * N
  frictionKineticForce: number; // N, mu_k * N (magnitude)
  dragForce: number; // N, magnitude
  netForce: number; // N, signed, along the path
  acceleration: number; // m/s^2, signed
};

/** Pure read-only force breakdown for the formula panel and vector overlay. */
export function computeForces(block: Block, cfg: LabConfig): ForceBreakdown {
  const onRamp = block.s <= cfg.rampLength;
  const weight = block.mass * cfg.gravity;
  const normal = onRamp ? weight * Math.cos(cfg.rampAngle) : weight;
  const gravityAlong = onRamp ? weight * Math.sin(cfg.rampAngle) : 0;
  const frictionStaticMax = cfg.muStatic * normal;
  const frictionKineticForce = cfg.muKinetic * normal;
  const speed = Math.abs(block.v);
  const dragForce = cfg.dragEnabled ? cfg.dragCoefficient * speed * speed : 0;

  let netForce = 0;
  if (onRamp) {
    if (block.locked) {
      netForce = 0;
    } else {
      const dir = Math.abs(block.v) < 1e-3 ? Math.sign(gravityAlong) || 1 : Math.sign(block.v);
      netForce = gravityAlong - dir * frictionKineticForce - dir * dragForce;
    }
  } else if (speed > 1e-3) {
    const dir = Math.sign(block.v);
    netForce = -dir * (frictionKineticForce + dragForce);
  }

  return {
    onRamp,
    weight,
    normal,
    gravityAlong,
    frictionStaticMax,
    frictionKineticForce,
    dragForce,
    netForce,
    acceleration: netForce / block.mass,
  };
}

/** The frictionless, drag-free "textbook" acceleration, for comparison. */
export function idealAcceleration(cfg: LabConfig) {
  return cfg.gravity * (Math.sin(cfg.rampAngle) - cfg.muKinetic * Math.cos(cfg.rampAngle));
}

/** Advance one block by dt seconds. Mutates the block in place. */
export function updateBlock(block: Block, dt: number, cfg: LabConfig) {
  const onRamp = block.s <= cfg.rampLength;

  if (onRamp) {
    const weight = block.mass * cfg.gravity;
    const normal = weight * Math.cos(cfg.rampAngle);
    const gravityAlong = weight * Math.sin(cfg.rampAngle);
    const frictionStaticMax = cfg.muStatic * normal;

    // Static friction: a block at rest only starts moving once gravity's
    // pull along the slope exceeds the maximum static friction force.
    if (Math.abs(block.v) < 1e-3 && gravityAlong <= frictionStaticMax) {
      block.locked = true;
      block.v = 0;
      block.acceleration = 0;
      return;
    }
    block.locked = false;

    const dir = Math.abs(block.v) < 1e-3 ? Math.sign(gravityAlong) || 1 : Math.sign(block.v);
    const frictionForce = cfg.muKinetic * normal;
    const speed = Math.abs(block.v);
    const dragForce = cfg.dragEnabled ? cfg.dragCoefficient * speed * speed : 0;
    const netForce = gravityAlong - dir * frictionForce - dir * dragForce;
    const a = netForce / block.mass;

    const prevV = block.v;
    let newV = prevV + a * dt;
    // Kinetic friction/drag can brake a block to rest but shouldn't be able
    // to fling it backwards on their own within a single step.
    if (Math.sign(newV) !== 0 && Math.sign(newV) !== dir && Math.abs(prevV) > 1e-3) {
      newV = 0;
    }

    const ds = ((prevV + newV) / 2) * dt; // trapezoidal integration keeps energy bookkeeping tight
    block.acceleration = a;
    block.v = newV;
    block.s = Math.max(0, block.s + ds);
    block.distance += Math.abs(ds);
    block.energyDissipated += (frictionForce + dragForce) * Math.abs(ds);
    return;
  }

  // Flat run-out: no ramp component of gravity, only friction + drag act.
  const weight = block.mass * cfg.gravity;
  const normal = weight;
  const speed = Math.abs(block.v);
  if (speed < 1e-3) {
    block.v = 0;
    block.acceleration = 0;
    return;
  }
  const dir = Math.sign(block.v);
  const frictionForce = cfg.muKinetic * normal;
  const dragForce = cfg.dragEnabled ? cfg.dragCoefficient * speed * speed : 0;
  const decel = (frictionForce + dragForce) / block.mass;
  let newV = block.v - dir * decel * dt;
  if (Math.sign(newV) !== dir) newV = 0;
  const ds = ((block.v + newV) / 2) * dt;
  block.acceleration = -dir * decel;
  block.v = newV;
  block.s += ds;
  block.distance += Math.abs(ds);
  block.energyDissipated += (frictionForce + dragForce) * Math.abs(ds);
}

/**
 * 1D collision resolution using the standard restitution formula:
 *   v1' = ((m1 - e*m2)v1 + (1+e)m2 v2) / (m1+m2)
 *   v2' = ((m2 - e*m1)v2 + (1+e)m1 v1) / (m1+m2)
 * e = 1 is perfectly elastic (kinetic energy conserved), e = 0 is perfectly
 * inelastic (blocks move off at a shared velocity).
 */
export function resolveCollisions(blocks: Block[], cfg: LabConfig) {
  if (!cfg.collisionsEnabled || blocks.length < 2) return;
  const sorted = [...blocks].sort((a, b) => a.s - b.s);
  for (let i = 0; i < sorted.length - 1; i++) {
    const A = sorted[i];
    const B = sorted[i + 1];
    const gap = B.s - A.s;
    if (gap <= CONTACT_M && A.v > B.v) {
      const { mass: m1, v: v1 } = A;
      const { mass: m2, v: v2 } = B;
      const e = cfg.restitution;
      const v1p = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const v2p = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
      A.v = v1p;
      B.v = v2p;
      const overlap = CONTACT_M - gap;
      A.s = Math.max(0, A.s - overlap / 2);
      B.s += overlap / 2;
      A.locked = false;
      B.locked = false;
    }
  }
}

export type Sample = {
  t: number;
  s: number;
  v: number;
  a: number;
  ke: number;
  pe: number;
  total: number;
  dissipated: number;
};
