/** All configuration and educational copy for the earthquake lab (UK English). */
export interface Variable { sym: string; def: string; unit: string }
export interface Equation { name: string; expr: string; vars: Variable[] }
export interface Module {
  id: 'waves' | 'locate' | 'magnitude' | 'tsunami';
  title: string;
  intro: string;
  method: string[];
  equations: Equation[];
  assumptions: string[];
  limitations: string[];
  tryThis: string;
}

export const config = {
  g: 9.81,
  speedPresets: [
    { id: 'crust', label: 'Upper continental crust (illustrative)', vp: 6.0, vs: 3.5, vr: 3.2 },
    { id: 'mantle', label: 'Uppermost mantle (illustrative)', vp: 8.1, vs: 4.5, vr: 4.1 },
  ],
  map: { size: 200, stations: [{ name: 'A', x: 30, y: 40 }, { name: 'B', x: 160, y: 60 }, { name: 'C', x: 90, y: 170 }] },
  tsunami: {
    shelfDepth: 100,
    shoreDepth: 10,
    segments: [
      { km: 1200, depth: 4500 },
      { km: 600, depth: 3000 },
      { km: 150, depth: 1000 },
      { km: 50, depth: 200 },
      { km: 10, depth: 50 },
    ],
  },
};

export const modules: Module[] = [
  {
    id: 'waves',
    title: 'Seismic waves',
    intro:
      'An earthquake releases energy that travels through and along the Earth as different kinds of wave. They travel at different speeds, so a seismometer records them one after another.',
    method: [
      'Choose a source-to-station distance. Each arrival time is distance divided by that wave’s speed.',
      'The animated schematic shows how the ground moves for each wave type; the seismogram shows what a station might record.',
    ],
    equations: [
      { name: 'Arrival time', expr: 't = d / v', vars: [
        { sym: 't', def: 'travel time', unit: 's' },
        { sym: 'd', def: 'distance from source to station', unit: 'km' },
        { sym: 'v', def: 'wave speed (vP, vS or vR)', unit: 'km/s' } ] },
      { name: 'P–S delay', expr: 'Δt = d (1/v<sub>S</sub> − 1/v<sub>P</sub>)', vars: [
        { sym: 'Δt', def: 'S arrival time minus P arrival time', unit: 's' } ] },
    ],
    assumptions: [
      'Constant wave speeds along a straight path. The real Earth’s speeds change with depth and rock type, so real paths curve.',
      'The trace is synthetic: amplitudes, frequencies and decay are chosen to look plausible, not measured.',
      'Surface-wave speed is a single representative value; real surface waves disperse, with different periods travelling at different speeds.',
    ],
    limitations: [
      'S-waves cannot travel through liquid. They do not pass through Earth’s liquid outer core, which is key evidence that it is liquid. Our flat, uniform model cannot show this.',
      'Source depth, radiation pattern and local geology are ignored.',
    ],
    tryThis: 'Increase the station distance. What happens to the P–S delay?',
  },
  {
    id: 'locate',
    title: 'Locate the earthquake',
    intro:
      'One station gives a distance, not a direction. With three or more stations, the distance circles meet near the epicentre.',
    method: [
      'Each station measures the P–S delay. The distance formula converts the delay into a radius, and a circle of that radius is drawn around the station.',
      'Add picking uncertainty to see why the circles may not meet at a single point. The shaded region shows locations consistent with every circle, and the estimate is the least-squares best fit.',
    ],
    equations: [
      { name: 'Distance from P–S delay', expr: 'd = Δt / (1/v<sub>S</sub> − 1/v<sub>P</sub>)', vars: [
        { sym: 'd', def: 'distance to the earthquake', unit: 'km' },
        { sym: 'Δt', def: 'P–S arrival-time difference', unit: 's' },
        { sym: 'v<sub>P</sub>, v<sub>S</sub>', def: 'P- and S-wave speeds', unit: 'km/s' } ] },
    ],
    assumptions: [
      'A flat map with uniform speeds, so circles are true circles. On a real, curved Earth with varying structure they are not.',
      'Source depth is ignored: distances are epicentral.',
      'Timing errors are random and small. The origin time is not needed because only the P–S difference is used.',
    ],
    limitations: [
      'Real seismology uses many stations, Earth-model travel-time tables, depth estimation and formal uncertainty analysis.',
      'This is a teaching activity, not a location tool.',
    ],
    tryThis: 'Move one station. Why does its distance circle change?',
  },
  {
    id: 'magnitude',
    title: 'Magnitude and energy',
    intro:
      'Magnitude is logarithmic. Each whole-number step corresponds to ten times the recorded wave amplitude, and roughly 32 times the energy released.',
    method: [
      'Set two magnitudes. The tool shows the amplitude ratio, the magnitude difference and traces drawn to the same scale.',
      'Switch on the energy comparison to see how much more steeply energy grows than amplitude.',
    ],
    equations: [
      { name: 'Magnitude (simplified)', expr: 'M = log<sub>10</sub>(A / A<sub>0</sub>)', vars: [
        { sym: 'M', def: 'magnitude', unit: 'dimensionless' },
        { sym: 'A', def: 'measured wave amplitude', unit: 'e.g. µm' },
        { sym: 'A<sub>0</sub>', def: 'reference amplitude', unit: 'same as A' } ] },
      { name: 'Comparing two events', expr: 'M<sub>2</sub> − M<sub>1</sub> = log<sub>10</sub>(A<sub>2</sub> / A<sub>1</sub>)', vars: [] },
      { name: 'Energy (approximate)', expr: 'log<sub>10</sub>(E) ≈ 1.5 M + 4.8', vars: [
        { sym: 'E', def: 'radiated seismic energy', unit: 'J' } ] },
    ],
    assumptions: [
      'The amplitude relation is the simplified form of Richter’s original idea, ignoring distance corrections.',
      'The energy relation is an empirical approximation; real events scatter around it.',
    ],
    limitations: [
      'The original Richter scale was developed for a particular region and instrument type. Modern estimates, such as moment magnitude, are more broadly applicable, though “Richter scale” is still used informally.',
      'Magnitude is not a simple linear measure of “size”.',
    ],
    tryThis: 'Compare a magnitude 5 and magnitude 7 earthquake. How much larger is the amplitude?',
  },
  {
    id: 'tsunami',
    title: 'Tsunami propagation',
    intro:
      'Large undersea earthquakes can displace the seafloor and generate a tsunami, though not every earthquake does. Tsunami wavelengths are so long that they behave as shallow-water waves even in the deep ocean.',
    method: [
      'Adjust the depth to see the wave speed. Adjust the period or wavelength; the other follows from v = λ / T.',
      'Build a route from depth segments to estimate travel time to a coast. The cross-section shows what happens as the wave reaches shallow water.',
    ],
    equations: [
      { name: 'Shallow-water speed', expr: 'v = √(g d)', vars: [
        { sym: 'v', def: 'wave speed', unit: 'm/s' },
        { sym: 'g', def: 'gravitational acceleration, 9.81', unit: 'm/s²' },
        { sym: 'd', def: 'water depth', unit: 'm' } ] },
      { name: 'Wave relationship', expr: 'v = λ / T', vars: [
        { sym: 'λ', def: 'wavelength', unit: 'm' }, { sym: 'T', def: 'period', unit: 's' } ] },
      { name: 'Travel time', expr: 't = x / √(g d)', vars: [
        { sym: 'x', def: 'segment length', unit: 'm' }, { sym: 't', def: 'time for that segment', unit: 's' } ] },
      { name: 'Height growth (illustrative, Green’s law)', expr: 'H ∝ d<sup>−1/4</sup>', vars: [
        { sym: 'H', def: 'wave height', unit: 'm' } ] },
    ],
    assumptions: [
      'Wavelength is much greater than depth, and wave height is small compared with depth.',
      'Period stays constant as the wave moves, so the wavelength shortens as it slows.',
      'Green’s law ignores friction, reflection, coastline shape and breaking.',
    ],
    limitations: [
      'This is a simplified educational model, not a real-time earthquake or tsunami warning system. Do not use it for safety decisions; follow official warnings.',
      'Real forecasting uses bathymetry, coastline shape, source geometry, nonlinear hydrodynamics and observation networks.',
    ],
    tryThis: 'Change ocean depth from 4,000 m to 100 m. What happens to tsunami speed? Why might a tsunami be barely noticeable in deep water but dangerous at the coast?',
  },
];

export const concepts = [
  ['Amplitude', 'The size of ground motion recorded on a seismogram.'],
  ['Magnitude', 'A logarithmic measure related to amplitude and source properties.'],
  ['Energy release', 'Increases much more steeply than amplitude: about 32 times per magnitude unit.'],
  ['Intensity', 'Observed effects at one place. It varies with distance, geology and building quality.'],
] as const;

export const scientists = [
  'Seismic networks record ground motion at many stations in real time.',
  'Travel-time tables and 3D Earth models turn arrival times into locations and depths.',
  'Moment magnitude is estimated from the source’s physical properties, not just peak amplitude.',
  'Geodesy (GNSS and satellite radar) measures how the ground actually moved.',
  'Every estimate is published with uncertainty, and updated as data arrive.',
];

export const sources = [
  { t: 'USGS Earthquake Hazards Program — magnitude, intensity and earthquake science', u: 'https://www.usgs.gov/programs/earthquake-hazards' },
  { t: 'NOAA Tsunami Program — how tsunamis work and official warnings', u: 'https://www.tsunami.noaa.gov/' },
  { t: 'EarthScope Consortium (formerly IRIS) — seismology education resources', u: 'https://www.earthscope.org/' },
  { t: 'Lowrie, W. & Fichtner, A., Fundamentals of Geophysics (Cambridge University Press) — textbook treatment of waves, Earth structure and magnitudes', u: '' },
  { t: 'Lay, T. & Wallace, T., Modern Global Seismology (Academic Press) — locating earthquakes and magnitude scales', u: '' },
];
