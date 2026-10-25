export const categories = [
  { id: 'orbits', title: 'Orbits & Mechanics', blurb: 'Gravity, trajectories and the clockwork of the solar system.', icon: '◯' },
  { id: 'sky-and-time', title: 'Sky & Time', blurb: 'What you see overhead, when, and why.', icon: '☀' },
  { id: 'optics', title: 'Optics & Telescopes', blurb: 'How instruments gather light and resolve detail.', icon: '◎' },
  { id: 'stars', title: 'Stars & Stellar Evolution', blurb: 'Life cycles, classification and explosive endings.', icon: '✦' },
  { id: 'cosmology', title: 'Galaxies & Cosmology', blurb: 'Distances, expansion and the large-scale universe.', icon: '❂' },
  { id: 'phenomena', title: 'Astrophysical Phenomena', blurb: 'Extreme physics: black holes, lensing and more.', icon: '◉' },
  { id: 'exoplanets', title: 'Exoplanets', blurb: 'Finding and characterising worlds around other stars.', icon: '☍' },
] as const;

export const categoryIds = categories.map((c) => c.id) as [
  (typeof categories)[number]['id'],
  ...(typeof categories)[number]['id'][],
];
export type CategoryId = (typeof categories)[number]['id'];
export const categoryById = (id: string) => categories.find((c) => c.id === id)!;
