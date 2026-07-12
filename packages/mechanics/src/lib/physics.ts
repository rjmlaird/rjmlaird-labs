export type Block = {
  id: number;
  mass: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  onRamp: boolean;
  distance: number;
  acceleration: number;
};

export type LabConfig = {
  gravity: number;
  friction: number;
  rampAngle: number;
  rampLength: number;
  rampX: number;
  rampY: number;
  groundY: number;
};

export function createBlock(id: number, x: number, y: number): Block {
  return {
    id,
    mass: 5,
    x,
    y,
    vx: 0,
    vy: 0,
    size: 28,
    color: '#60a5fa',
    onRamp: true,
    distance: 0,
    acceleration: 0,
  };
}

export function speedOf(b: Block) {
  return Math.sqrt(b.vx * b.vx + b.vy * b.vy);
}

export function kineticEnergy(b: Block) {
  const v = speedOf(b);
  return 0.5 * b.mass * v * v;
}

export function potentialEnergy(b: Block, groundY: number, gravity: number) {
  const height = Math.max(0, groundY - b.y);
  return b.mass * gravity * height;
}

export function momentum(b: Block) {
  return b.mass * speedOf(b);
}

export function updateBlock(block: Block, dt: number, cfg: LabConfig) {
  const rampDx = Math.cos(cfg.rampAngle);
  const rampDy = Math.sin(cfg.rampAngle);

  if (block.onRamp) {
    const alongRampAcc =
      cfg.gravity * Math.sin(cfg.rampAngle) -
      cfg.friction * cfg.gravity * Math.cos(cfg.rampAngle);

    block.acceleration = alongRampAcc;

    const v = Math.max(
      0,
      Math.sqrt(block.vx * block.vx + block.vy * block.vy) + alongRampAcc * dt
    );

    block.vx = v * rampDx;
    block.vy = v * rampDy;
    block.x += block.vx * dt;
    block.y += block.vy * dt;
    block.distance += v * dt;

    if (block.x >= cfg.rampX + cfg.rampLength) {
      block.onRamp = false;
      block.y = cfg.groundY - block.size / 2;
      block.vy = 0;
      block.acceleration = 0;
    }
    return;
  }

  block.acceleration = -cfg.friction * cfg.gravity;
  const nextVx = Math.max(0, block.vx - cfg.friction * cfg.gravity * dt);

  block.vx = nextVx;
  block.x += block.vx * dt;
  block.y = cfg.groundY - block.size / 2;
  block.distance += block.vx * dt;
}
