import type { ProjectileConfig, ProjectileState } from './types';

function rad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Range: horizontal distance travelled by the time the projectile lands (y = 0). */
export function idealRange(cfg: ProjectileConfig): number {
  const theta = rad(cfg.launchAngleDeg);
  const ux = cfg.launchSpeed * Math.cos(theta);
  const t = idealTimeOfFlight(cfg);
  return ux * t;
}

/** Time until the projectile returns to y = 0, from s = ut + 1/2 a t^2 with s = -launchHeight. */
export function idealTimeOfFlight(cfg: ProjectileConfig): number {
  const theta = rad(cfg.launchAngleDeg);
  const uy = cfg.launchSpeed * Math.sin(theta);
  const disc = uy * uy + 2 * cfg.gravity * cfg.launchHeight;
  return (uy + Math.sqrt(Math.max(disc, 0))) / cfg.gravity;
}

/** Height above the ground at the apex: h = launchHeight + uy^2 / (2g). */
export function idealMaxHeight(cfg: ProjectileConfig): number {
  const theta = rad(cfg.launchAngleDeg);
  const uy = cfg.launchSpeed * Math.sin(theta);
  return cfg.launchHeight + (uy * uy) / (2 * cfg.gravity);
}

export function createInitialState(cfg: ProjectileConfig): ProjectileState {
  const theta = rad(cfg.launchAngleDeg);
  return {
    x: 0,
    y: cfg.launchHeight,
    vx: cfg.launchSpeed * Math.cos(theta),
    vy: cfg.launchSpeed * Math.sin(theta),
    t: 0,
    energyDissipated: 0,
    landed: false,
  };
}

/** Advance one step. With drag off this integrates the exact SUVAT motion; with drag on it's numeric (no closed form exists). */
export function stepProjectile(state: ProjectileState, dt: number, cfg: ProjectileConfig): ProjectileState {
  if (state.landed) return state;

  const speed = Math.hypot(state.vx, state.vy);
  const dragForce = cfg.dragEnabled ? cfg.dragCoefficient * speed * speed : 0;
  const ax = cfg.dragEnabled && speed > 1e-6 ? -(dragForce / cfg.mass) * (state.vx / speed) : 0;
  const ay = -cfg.gravity + (cfg.dragEnabled && speed > 1e-6 ? -(dragForce / cfg.mass) * (state.vy / speed) : 0);

  const nvx = state.vx + ax * dt;
  const nvy = state.vy + ay * dt;
  const nx = state.x + ((state.vx + nvx) / 2) * dt;
  let ny = state.y + ((state.vy + nvy) / 2) * dt;

  const dissipated = state.energyDissipated + dragForce * speed * dt;
  const landed = ny <= 0;

  return {
    x: nx,
    y: landed ? 0 : ny,
    vx: nvx,
    vy: landed ? 0 : nvy,
    t: state.t + dt,
    energyDissipated: dissipated,
    landed,
  };
}
