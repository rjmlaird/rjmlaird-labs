export type Pendulum = {
  id: string;
  mass: number; // kg
  length: number; // m, string/rod length (shared by all pendulums on a real cradle)
  theta: number; // rad, angle from vertical (positive = displaced toward the "swing-out" side)
  omega: number; // rad/s, angular velocity
  restX: number; // m, this ball's slot position along the row when hanging at theta = 0
  color?: string;
};

export type CradleConfig = {
  gravity: number; // m/s^2
  restitution: number; // 0 = perfectly inelastic, 1 = perfectly elastic (ball-to-ball)
  ballRadius: number; // m, for contact detection between neighbouring balls
};

export type CradleMetrics = {
  momentum: number; // kg*m/s, sum of m_i * (L_i * omega_i) — exact tangential momentum
  kineticEnergy: number; // J
  potentialEnergy: number; // J, relative to each pendulum's lowest point
  totalEnergy: number; // J
};

export type CradleFrame = {
  time: number;
  pendulums: Pendulum[];
  config: CradleConfig;
};

export type CradleScenario = 'one-in' | 'two-in' | 'unequal-mass' | 'inelastic';
