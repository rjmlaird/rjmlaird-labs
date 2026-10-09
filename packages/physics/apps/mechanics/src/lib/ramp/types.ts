export type MotionMode = 'idle' | 'running' | 'paused';
export type Scenario = 'frictionless' | 'friction' | 'high-friction' | 'incline' | 'collision';

export type ReadoutItem = {
  label: string;
  value: string;
};

export type Block = {
  id: string;
  mass: number;
  x: number;
  v: number;
  size: number;
  color?: string;
  locked?: boolean;
};

export type Ramp = {
  length: number;
  angle: number;
  friction: number;
  gravity: number;
};

export type SimulationConfig = {
  ramp: Ramp;
  blocks: Block[];
  restitution?: number;
  drag?: number;
  collisionMode?: 'none' | 'bounce' | 'merge';
};

export type SimulationMetrics = {
  acceleration: number;
  normalForce: number;
  frictionForce: number;
  dragForce: number;
  momentum: number;
  kineticEnergy: number;
  potentialEnergy: number;
  energyLost: number;
};

export type SimulationFrame = {
  time: number;
  config: SimulationConfig;
  metrics: SimulationMetrics;
  blocks: Block[];
  mode: MotionMode;
};
