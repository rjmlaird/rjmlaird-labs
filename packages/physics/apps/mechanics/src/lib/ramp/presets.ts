import type { Scenario, SimulationConfig } from './types';

export type Preset = {
  id: Scenario;
  label: string;
  description: string;
  notes?: string;
  config: SimulationConfig;
};

export const presets: Preset[] = [
  {
    id: 'frictionless',
    label: 'Frictionless',
    description: 'A clean ramp with no friction, ideal for showing pure acceleration down the slope.',
    notes: 'This preset isolates gravity along the incline and keeps losses minimal.',
    config: {
      ramp: { length: 8, angle: 18, friction: 0, gravity: 9.81 },
      blocks: [{ id: 'block-1', mass: 2, x: 0.5, v: 0, size: 0.6, color: '#00c2a8' }],
      collisionMode: 'none',
      restitution: 0.9,
      drag: 0,
    },
  },
  {
    id: 'friction',
    label: 'Moderate friction',
    description: 'Adds a little resistance so motion slows and energy loss becomes visible.',
    notes: 'Use this to compare acceleration against frictional losses.',
    config: {
      ramp: { length: 8, angle: 18, friction: 0.18, gravity: 9.81 },
      blocks: [{ id: 'block-1', mass: 2, x: 0.5, v: 0, size: 0.6, color: '#f5a623' }],
      collisionMode: 'none',
      restitution: 0.85,
      drag: 0.01,
    },
  },
  {
    id: 'high-friction',
    label: 'High friction',
    description: 'Shows how strong friction can nearly stop motion on the ramp.',
    notes: 'When friction is high enough, the block may settle rather than accelerate continuously.',
    config: {
      ramp: { length: 8, angle: 18, friction: 0.42, gravity: 9.81 },
      blocks: [{ id: 'block-1', mass: 2.2, x: 0.5, v: 0, size: 0.6, color: '#ff8a4c' }],
      collisionMode: 'none',
      restitution: 0.8,
      drag: 0.02,
    },
  },
  {
    id: 'incline',
    label: 'Steeper incline',
    description: 'A steeper angle increases the downslope force and speeds up the block.',
    notes: 'Angle is the main variable here; compare the acceleration with other presets.',
    config: {
      ramp: { length: 8, angle: 30, friction: 0.12, gravity: 9.81 },
      blocks: [{ id: 'block-1', mass: 1.8, x: 0.5, v: 0, size: 0.6, color: '#52d68a' }],
      collisionMode: 'none',
      restitution: 0.85,
      drag: 0.01,
    },
  },
  {
    id: 'collision',
    label: 'Two-block collision',
    description: 'Two blocks moving on the ramp demonstrate collision behavior and momentum transfer.',
    notes: 'This preset is useful for showing how mass and restitution affect the result.',
    config: {
      ramp: { length: 8, angle: 18, friction: 0.08, gravity: 9.81 },
      blocks: [
        { id: 'block-1', mass: 2, x: 0.5, v: 1.5, size: 0.6, color: '#00c2a8' },
        { id: 'block-2', mass: 1.4, x: 3.2, v: 0, size: 0.5, color: '#f5a623' },
      ],
      collisionMode: 'bounce',
      restitution: 0.88,
      drag: 0.01,
    },
  },
];

export function getPreset(id: Scenario): Preset {
  return presets.find((preset) => preset.id === id) ?? presets[0];
}
