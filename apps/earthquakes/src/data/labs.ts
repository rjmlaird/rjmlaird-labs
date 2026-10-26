/** Lab registry. Add one entry per lab; /labs and the home page render from this. */
export interface Lab {
  slug: string;
  title: string;
  summary: string;
  status: 'live' | 'planned';
  audience: string;
  topics: string[];
  updated: string; // ISO date
}
export const labs: Lab[] = [
  {
    slug: 'earthquakes',
    title: 'Earthquake physics explorer',
    summary:
      'Four linked experiments on seismic waves, locating an earthquake, magnitude and energy, and tsunami propagation.',
    status: 'live',
    audience: 'Curious readers, students, teachers',
    topics: ['Waves', 'Geophysics', 'Logarithms', 'Modelling'],
    updated: '2026-10-25',
  },
];
