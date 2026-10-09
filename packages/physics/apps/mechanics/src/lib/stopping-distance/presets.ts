import type { StoppingConfig, StoppingScenario } from './types';

export type StoppingPreset = {
  id: StoppingScenario;
  label: string;
  description: string;
  notes?: string;
  config: StoppingConfig;
};

// Approximate kinetic friction coefficients, tyre-on-road.
export const ROAD_FRICTION: Record<string, number> = {
  Dry: 0.7,
  Wet: 0.4,
  Snow: 0.2,
  Ice: 0.1,
};

export const stoppingPresets: StoppingPreset[] = [
  {
    id: 'alert-dry',
    label: 'Alert driver, dry road',
    description: 'A typical reaction time (0.7 s) on dry asphalt.',
    config: { gravity: 9.81, speed: 13.4, reactionTime: 0.7, friction: ROAD_FRICTION.Dry },
  },
  {
    id: 'distracted-dry',
    label: 'Distracted driver, dry road',
    description: 'Same road, but reaction time stretched out — e.g. checking a phone.',
    notes: 'Reaction time only affects the thinking distance, which grows linearly with speed — but it still often dominates the total at ordinary road speeds.',
    config: { gravity: 9.81, speed: 13.4, reactionTime: 2.0, friction: ROAD_FRICTION.Dry },
  },
  {
    id: 'alert-wet',
    label: 'Alert driver, wet road',
    description: 'Normal reaction time, but lower tyre friction on a wet road nearly doubles the braking distance.',
    config: { gravity: 9.81, speed: 13.4, reactionTime: 0.7, friction: ROAD_FRICTION.Wet },
  },
  {
    id: 'alert-ice',
    label: 'Alert driver, icy road',
    description: 'Same reaction time, but on ice the braking distance grows dramatically — friction alone can\u2019t supply much deceleration.',
    notes: 'Braking distance scales as 1/friction, so a small drop in grip has an outsized effect on how far the car travels once braking starts.',
    config: { gravity: 9.81, speed: 13.4, reactionTime: 0.7, friction: ROAD_FRICTION.Ice },
  },
];

export function getStoppingPreset(id: StoppingScenario): StoppingPreset {
  return stoppingPresets.find((p) => p.id === id) ?? stoppingPresets[0];
}
