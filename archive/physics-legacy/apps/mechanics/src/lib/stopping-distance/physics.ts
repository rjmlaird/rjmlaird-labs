import type { StoppingConfig, StoppingState } from './types';

/** Deceleration available from tyre friction: a = mu * g. */
export function brakingDeceleration(cfg: Pick<StoppingConfig, 'friction' | 'gravity'>): number {
  return cfg.friction * cfg.gravity;
}

/** Thinking/reaction distance: the car travels at constant speed until the driver reacts. */
export function reactionDistance(cfg: Pick<StoppingConfig, 'speed' | 'reactionTime'>): number {
  return cfg.speed * cfg.reactionTime;
}

/** Braking distance from v^2 = u^2 + 2as with v = 0: s = u^2 / (2a). */
export function brakingDistance(cfg: StoppingConfig): number {
  const a = brakingDeceleration(cfg);
  return a > 0 ? (cfg.speed * cfg.speed) / (2 * a) : Infinity;
}

/** Braking time from v = u - at with v = 0: t = u / a. */
export function brakingTime(cfg: StoppingConfig): number {
  const a = brakingDeceleration(cfg);
  return a > 0 ? cfg.speed / a : Infinity;
}

export function totalStoppingDistance(cfg: StoppingConfig): number {
  return reactionDistance(cfg) + brakingDistance(cfg);
}

export function createInitialState(): StoppingState {
  return { t: 0, distance: 0, speed: 0, phase: 'reacting' };
}

export function stepStopping(state: StoppingState, dt: number, cfg: StoppingConfig): StoppingState {
  if (state.phase === 'stopped') return state;

  const t = state.t + dt;
  if (t <= cfg.reactionTime) {
    return { t, distance: cfg.speed * t, speed: cfg.speed, phase: 'reacting' };
  }

  const a = brakingDeceleration(cfg);
  const brakingElapsed = t - cfg.reactionTime;
  const speedNow = Math.max(0, cfg.speed - a * brakingElapsed);
  const brakingDoneTime = brakingTime(cfg);

  if (brakingElapsed >= brakingDoneTime) {
    return { t: cfg.reactionTime + brakingDoneTime, distance: totalStoppingDistance(cfg), speed: 0, phase: 'stopped' };
  }

  const brakingDistanceSoFar = cfg.speed * brakingElapsed - 0.5 * a * brakingElapsed * brakingElapsed;
  return {
    t,
    distance: reactionDistance(cfg) + brakingDistanceSoFar,
    speed: speedNow,
    phase: 'braking',
  };
}

/** A row for the classic "stopping distance vs speed" comparison table/chart. */
export function stoppingDistanceCurve(cfg: Pick<StoppingConfig, 'reactionTime' | 'friction' | 'gravity'>, speeds: number[]) {
  return speeds.map((speed) => {
    const full: StoppingConfig = { ...cfg, speed };
    return {
      speed,
      reaction: reactionDistance(full),
      braking: brakingDistance(full),
      total: totalStoppingDistance(full),
    };
  });
}
