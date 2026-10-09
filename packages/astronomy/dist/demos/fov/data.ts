import type { InstrumentConfig } from './calc';

/**
 * Representative example instruments. Real products vary: always check the
 * maker's specification for the instrument you actually own.
 */
export type InstrumentPreset = InstrumentConfig & {
  id: string;
  name: string;
  category: string;
  description: string;
  notes?: string;
};

export const PRESETS: InstrumentPreset[] = [
  { id: 'naked-eye', type: 'naked-eye', name: 'Naked eye', category: 'Eye', description: 'Unaided, dark-adapted eye.', trueFieldDeg: 100, notes: 'Rough working figure for the visible sky; varies by person.' },

  { id: 'bino-7x50', type: 'binoculars', name: '7×50 binoculars', category: 'Binoculars', description: 'Classic night-sky format with a large exit pupil.', binocularMagnification: 7, binocularObjectiveMm: 50, trueFieldDeg: 7.1 },
  { id: 'bino-8x42', type: 'binoculars', name: '8×42 binoculars', category: 'Binoculars', description: 'Popular general-purpose pair.', binocularMagnification: 8, binocularObjectiveMm: 42, trueFieldDeg: 7.0 },
  { id: 'bino-10x50', type: 'binoculars', name: '10×50 binoculars', category: 'Binoculars', description: 'Common astronomy binoculars; hand-holdable with practice.', binocularMagnification: 10, binocularObjectiveMm: 50, trueFieldDeg: 6.5 },
  { id: 'bino-15x70', type: 'binoculars', name: '15×70 binoculars', category: 'Binoculars', description: 'Large binoculars that usually need a tripod.', binocularMagnification: 15, binocularObjectiveMm: 70, trueFieldDeg: 4.4 },

  { id: 'finder-70', type: 'finder', name: '70 mm finder scope', category: 'Finder scopes', description: 'Large, wide-field finder with a long-eye-relief eyepiece.', apertureMm: 70, focalLengthMm: 280, eyepieceFocalLengthMm: 20, eyepieceAfovDeg: 50 },

  { id: 'ref-80-wide', type: 'refractor', name: '80 mm refractor — low power', category: 'Refractors', description: '80 mm f/5 short-tube refractor with a 25 mm eyepiece.', apertureMm: 80, focalLengthMm: 400, eyepieceFocalLengthMm: 25, eyepieceAfovDeg: 52, fieldStopMm: 22 },
  { id: 'ref-80-med', type: 'refractor', name: '80 mm refractor — medium power', category: 'Refractors', description: '80 mm f/7.5 refractor with a 10 mm eyepiece.', apertureMm: 80, focalLengthMm: 600, eyepieceFocalLengthMm: 10, eyepieceAfovDeg: 52 },
  { id: 'ref-100', type: 'refractor', name: '100 mm refractor', category: 'Refractors', description: '100 mm f/9 refractor with a 20 mm wide-field eyepiece.', apertureMm: 100, focalLengthMm: 900, eyepieceFocalLengthMm: 20, eyepieceAfovDeg: 68 },

  { id: 'refl-130', type: 'reflector', name: '130 mm tabletop reflector', category: 'Reflectors', description: '130 mm f/5 tabletop Newtonian with a 25 mm eyepiece.', apertureMm: 130, focalLengthMm: 650, eyepieceFocalLengthMm: 25, eyepieceAfovDeg: 52 },
  { id: 'refl-150', type: 'reflector', name: '150 mm Newtonian', category: 'Reflectors', description: '150 mm f/5 Newtonian with a 20 mm eyepiece.', apertureMm: 150, focalLengthMm: 750, eyepieceFocalLengthMm: 20, eyepieceAfovDeg: 68 },
  { id: 'dob-200', type: 'reflector', name: '200 mm Dobsonian', category: 'Reflectors', description: '200 mm f/6 Dobsonian with a 2-inch 30 mm eyepiece.', apertureMm: 200, focalLengthMm: 1200, eyepieceFocalLengthMm: 30, eyepieceAfovDeg: 68, fieldStopMm: 35 },
  { id: 'dob-250', type: 'reflector', name: '250 mm Dobsonian', category: 'Reflectors', description: '250 mm f/4.8 Dobsonian with a 17 mm ultra-wide eyepiece.', apertureMm: 250, focalLengthMm: 1200, eyepieceFocalLengthMm: 17, eyepieceAfovDeg: 82, fieldStopMm: 24 },
  { id: 'dob-400', type: 'reflector', name: '400 mm Dobsonian', category: 'Reflectors', description: '400 mm f/4.5 Dobsonian with a 21 mm ultra-wide eyepiece.', apertureMm: 400, focalLengthMm: 1800, eyepieceFocalLengthMm: 21, eyepieceAfovDeg: 82, fieldStopMm: 30 },

  { id: 'planetary-sct', type: 'catadioptric', name: 'Planetary setup (high power)', category: 'Specialist', description: '203 mm f/10 Schmidt–Cassegrain, 2× Barlow, 12 mm eyepiece.', apertureMm: 203, focalLengthMm: 2032, focalFactor: 2, eyepieceFocalLengthMm: 12, eyepieceAfovDeg: 58 },
  { id: 'astro-wide', type: 'camera', name: 'Wide-field astrophotography', category: 'Specialist', description: '80 mm f/6 refractor with a 0.8× reducer and an APS-C sensor.', apertureMm: 80, focalLengthMm: 480, focalFactor: 0.8, fieldStopMm: 28.4, notes: 'Sensor diagonal shown; the frame itself is rectangular.' },
];

export type SkyObject = {
  id: string;
  name: string;
  kind: string;
  /** Approximate major and minor axes, arcminutes. Real sizes vary. */
  majorArcmin: number;
  minorArcmin: number;
  colour: string;
  note?: string;
};

export const OBJECTS: SkyObject[] = [
  { id: 'moon', name: 'Full Moon', kind: 'Moon', majorArcmin: 31, minorArcmin: 31, colour: '#d8d4c8', note: 'Varies about 29.4′–33.5′ across the orbit.' },
  { id: 'jupiter', name: 'Jupiter', kind: 'Planet', majorArcmin: 0.75, minorArcmin: 0.7, colour: '#d9b38c', note: 'Roughly 30–50″ depending on distance.' },
  { id: 'saturn', name: 'Saturn (with rings)', kind: 'Planet', majorArcmin: 0.7, minorArcmin: 0.3, colour: '#e2cf9b', note: 'Ring span is about 40–45″ at its best.' },
  { id: 'mars', name: 'Mars (opposition)', kind: 'Planet', majorArcmin: 0.23, minorArcmin: 0.23, colour: '#c9744f', note: 'Varies strongly; far smaller away from opposition.' },
  { id: 'm31', name: 'Andromeda Galaxy (M31)', kind: 'Galaxy', majorArcmin: 190, minorArcmin: 60, colour: '#a9b7d9' },
  { id: 'm45', name: 'Pleiades (M45)', kind: 'Open cluster', majorArcmin: 110, minorArcmin: 110, colour: '#9fc3ff' },
  { id: 'm44', name: 'Beehive Cluster (M44)', kind: 'Open cluster', majorArcmin: 95, minorArcmin: 95, colour: '#d4dcf0' },
  { id: 'dc', name: 'Double Cluster', kind: 'Open clusters', majorArcmin: 60, minorArcmin: 30, colour: '#c8d6f5', note: 'Overall span of the pair, approximate.' },
  { id: 'm42', name: 'Orion Nebula (M42)', kind: 'Nebula', majorArcmin: 65, minorArcmin: 60, colour: '#d99ac8' },
  { id: 'omegacen', name: 'Omega Centauri', kind: 'Globular cluster', majorArcmin: 36, minorArcmin: 36, colour: '#f1e6c4' },
  { id: 'm13', name: 'Hercules Cluster (M13)', kind: 'Globular cluster', majorArcmin: 20, minorArcmin: 20, colour: '#f1e6c4' },
  { id: 'm51', name: 'Whirlpool Galaxy (M51)', kind: 'Galaxy', majorArcmin: 11, minorArcmin: 7, colour: '#b8c6e8' },
  { id: 'm27', name: 'Dumbbell Nebula (M27)', kind: 'Planetary nebula', majorArcmin: 8, minorArcmin: 5.7, colour: '#8fd9c4' },
  { id: 'm57', name: 'Ring Nebula (M57)', kind: 'Planetary nebula', majorArcmin: 1.4, minorArcmin: 1.0, colour: '#8fd9c4' },
];
