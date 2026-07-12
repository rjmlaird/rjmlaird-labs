import type { Block, SimulationConfig, SimulationFrame, SimulationMetrics } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ensureInBounds(blocks: Block[], rampLength: number): Block[] {
  return blocks.map((block) => ({ ...block, x: clamp(block.x, 0, rampLength) }));
}

export function applyCollisionMode(blocks: Block[], restitution = 0.85): Block[] {
  if (blocks.length < 2) return blocks;

  const sorted = [...blocks].sort((a, b) => a.x - b.x);
  const [a, b] = sorted;

  const aRight = a.x + a.size / 2;
  const bLeft = b.x - b.size / 2;

  if (aRight < bLeft) return blocks;

  const totalMass = a.mass + b.mass;
  const nextV1 =
    ((a.mass - restitution * b.mass) * a.v + (1 + restitution) * b.mass * b.v) / totalMass;
  const nextV2 =
    ((b.mass - restitution * a.mass) * b.v + (1 + restitution) * a.mass * a.v) / totalMass;

  return blocks.map((block) => {
    if (block.id === a.id) return { ...block, v: nextV1, x: b.x - a.size / 2 - 0.001 };
    if (block.id === b.id) return { ...block, v: nextV2, x: a.x + b.size / 2 + 0.001 };
    return block;
  });
}

export function computeMetrics(config: SimulationConfig, blocks: Block[]): SimulationMetrics {
  const ramp = config.ramp;
  const avgMass = blocks.reduce((sum, b) => sum + b.mass, 0) / Math.max(blocks.length, 1);
  const avgSpeed = blocks.reduce((sum, b) => sum + Math.abs(b.v), 0) / Math.max(blocks.length, 1);
  const angleRad = (ramp.angle * Math.PI) / 180;

  const gravityAlong = ramp.gravity * Math.sin(angleRad);
  const normalForce = avgMass * ramp.gravity * Math.cos(angleRad);
  const frictionForce = ramp.friction * normalForce;
  const dragForce = (config.drag ?? 0) * avgSpeed * avgSpeed;
  const acceleration =
    gravityAlong - frictionForce / Math.max(avgMass, 0.0001) - dragForce / Math.max(avgMass, 0.0001);

  const momentum = blocks.reduce((sum, b) => sum + b.mass * b.v, 0);
  const kineticEnergy = blocks.reduce((sum, b) => sum + 0.5 * b.mass * b.v * b.v, 0);
  const potentialEnergy = blocks.reduce(
    (sum, b) => sum + b.mass * ramp.gravity * (ramp.length - b.x) * Math.sin(angleRad),
    0,
  );
  const energyLost = Math.max(0, frictionForce * avgSpeed + dragForce * avgSpeed);

  return {
    acceleration,
    normalForce,
    frictionForce,
    dragForce,
    momentum,
    kineticEnergy,
    potentialEnergy,
    energyLost,
  };
}

export function stepSimulation(frame: SimulationFrame, dt = 1 / 60): SimulationFrame {
  const { config } = frame;
  const ramp = config.ramp;
  const angleRad = (ramp.angle * Math.PI) / 180;

  let blocks = frame.blocks.map((block) => {
    const gravityAlong = ramp.gravity * Math.sin(angleRad);
    const normal = block.mass * ramp.gravity * Math.cos(angleRad);
    const friction = ramp.friction * normal;
    const drag = (config.drag ?? 0) * block.v * Math.abs(block.v);
    const net =
      gravityAlong - friction / Math.max(block.mass, 0.0001) - drag / Math.max(block.mass, 0.0001);

    const nextV = block.v + net * dt;
    const nextX = block.x + nextV * dt;

    return { ...block, v: nextV, x: nextX };
  });

  if (config.collisionMode && config.collisionMode !== 'none') {
    blocks = applyCollisionMode(blocks, config.restitution ?? 0.85);
  }

  blocks = ensureInBounds(blocks, ramp.length);

  return {
    ...frame,
    time: frame.time + dt,
    blocks,
  };
}
