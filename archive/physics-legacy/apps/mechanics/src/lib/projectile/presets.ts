import type { ProjectileConfig, ProjectileScenario } from './types';

export type ProjectilePreset = {
  id: ProjectileScenario;
  label: string;
  description: string;
  notes?: string;
  config: ProjectileConfig;
};

export const projectilePresets: ProjectilePreset[] = [
  {
    id: 'no-drag-45',
    label: '45 degrees, no drag',
    description: 'The textbook case: on level ground with no air resistance, 45 degrees gives the maximum range.',
    notes: 'Try changing just the angle and watch the range fall off symmetrically either side of 45 degrees (e.g. 30 degrees and 60 degrees land at the same distance).',
    config: {
      gravity: 9.81,
      mass: 1,
      launchSpeed: 20,
      launchAngleDeg: 45,
      launchHeight: 0,
      dragEnabled: false,
      dragCoefficient: 0.02,
    },
  },
  {
    id: 'angle-compare',
    label: 'Low, flat trajectory',
    description: 'A fast, low-angle launch — shorter time of flight, lower apex, but not the longest range.',
    config: {
      gravity: 9.81,
      mass: 1,
      launchSpeed: 22,
      launchAngleDeg: 20,
      launchHeight: 0,
      dragEnabled: false,
      dragCoefficient: 0.02,
    },
  },
  {
    id: 'height-advantage',
    label: 'Launched from height',
    description: 'Launching from a cliff or platform adds extra time of flight (and range) compared to ground level.',
    notes: 'Height adds an extra term under the square root in the time-of-flight equation, so range keeps increasing with launch height even at the same speed and angle.',
    config: {
      gravity: 9.81,
      mass: 1,
      launchSpeed: 18,
      launchAngleDeg: 30,
      launchHeight: 15,
      dragEnabled: false,
      dragCoefficient: 0.02,
    },
  },
  {
    id: 'drag-golf-ball',
    label: 'With air resistance',
    description: 'The same launch as the 45-degree case, but with quadratic drag switched on — range shrinks and the trajectory stops being symmetric.',
    notes: 'With drag, the optimal launch angle for maximum range actually drops below 45 degrees, and the descending half of the flight is steeper than the ascending half.',
    config: {
      gravity: 9.81,
      mass: 0.15,
      launchSpeed: 20,
      launchAngleDeg: 45,
      launchHeight: 0,
      dragEnabled: true,
      dragCoefficient: 0.03,
    },
  },
];

export function getProjectilePreset(id: ProjectileScenario): ProjectilePreset {
  return projectilePresets.find((p) => p.id === id) ?? projectilePresets[0];
}
