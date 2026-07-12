import type { CradleConfig, CradleFrame, CradleMetrics, Pendulum } from './types';

/**
 * A Newton's cradle ball is, between collisions, just a simple pendulum:
 * theta'' = -(g/L) sin(theta). We integrate the *full* nonlinear pendulum
 * equation (not the small-angle approximation) since a cradle is often
 * pulled back far enough that sin(theta) ~ theta stops being accurate.
 *
 * Collisions between neighbouring balls are resolved using their exact
 * tangential speed L*omega (which is purely horizontal at the bottom of the
 * swing, where contact happens) via the same 1D restitution formula used
 * for the ramp -- the physics is identical, only the geometry differs.
 */

export function tangentialSpeed(p: Pendulum): number {
  return p.length * p.omega;
}

export function xPositionOf(p: Pendulum): number {
  return p.restX + p.length * Math.sin(p.theta);
}

export function heightOf(p: Pendulum): number {
  return p.length * (1 - Math.cos(p.theta));
}

export function stepPendulum(p: Pendulum, dt: number, gravity: number): Pendulum {
  const alpha = -(gravity / p.length) * Math.sin(p.theta);
  const omega = p.omega + alpha * dt;
  const theta = p.theta + omega * dt;
  return { ...p, theta, omega };
}

function clampToUnit(v: number) {
  return Math.max(-1, Math.min(1, v));
}

/** Resolve contact between neighbouring balls (fixed left-to-right order along the rack). */
export function resolveCradleCollisions(pendulums: Pendulum[], config: CradleConfig): Pendulum[] {
  const balls = [...pendulums];
  for (let i = 0; i < balls.length - 1; i++) {
    const A = balls[i];
    const B = balls[i + 1];
    const gap = xPositionOf(B) - xPositionOf(A) - 2 * config.ballRadius;
    const vA = tangentialSpeed(A);
    const vB = tangentialSpeed(B);

    if (gap <= 0 && vA > vB) {
      const { mass: m1 } = A;
      const { mass: m2 } = B;
      const e = config.restitution;
      const v1p = ((m1 - e * m2) * vA + (1 + e) * m2 * vB) / (m1 + m2);
      const v2p = ((m2 - e * m1) * vB + (1 + e) * m1 * vA) / (m1 + m2);

      const overlap = -gap;
      const nextA = { ...A, omega: v1p / A.length };
      const nextB = { ...B, omega: v2p / B.length };
      nextA.theta = Math.asin(clampToUnit((xPositionOf(A) - overlap / 2 - A.restX) / A.length));
      nextB.theta = Math.asin(clampToUnit((xPositionOf(B) + overlap / 2 - B.restX) / B.length));

      balls[i] = nextA;
      balls[i + 1] = nextB;
    }
  }
  return balls;
}

export function stepCradle(frame: CradleFrame, dt = 1 / 60): CradleFrame {
  const stepped = frame.pendulums.map((p) => stepPendulum(p, dt, frame.config.gravity));
  const resolved = resolveCradleCollisions(stepped, frame.config);
  return { ...frame, time: frame.time + dt, pendulums: resolved };
}

export function computeCradleMetrics(pendulums: Pendulum[], gravity: number): CradleMetrics {
  let momentum = 0;
  let kineticEnergy = 0;
  let potentialEnergy = 0;
  for (const p of pendulums) {
    const v = tangentialSpeed(p);
    momentum += p.mass * v;
    kineticEnergy += 0.5 * p.mass * v * v;
    potentialEnergy += p.mass * gravity * heightOf(p);
  }
  return { momentum, kineticEnergy, potentialEnergy, totalEnergy: kineticEnergy + potentialEnergy };
}
