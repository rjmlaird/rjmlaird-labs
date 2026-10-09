export type ProjectileConfig = {
  gravity: number; // m/s^2
  mass: number; // kg -- only matters once drag is enabled
  launchSpeed: number; // m/s
  launchAngleDeg: number; // degrees above horizontal
  launchHeight: number; // m above the ground
  dragEnabled: boolean;
  dragCoefficient: number; // k in F_drag = k * v^2 (N, before dividing by mass)
};

export type ProjectileState = {
  x: number; // m, horizontal distance travelled
  y: number; // m, height above the ground
  vx: number; // m/s
  vy: number; // m/s
  t: number; // s, elapsed time
  energyDissipated: number; // J, cumulative work done against drag
  landed: boolean;
};

export type ProjectileScenario = 'no-drag-45' | 'angle-compare' | 'height-advantage' | 'drag-golf-ball';
