export type Status = "active" | "in-progress" | "planned" | "archived";
export type GroupId = "physics" | "climate" | "focus";

export interface Lab {
  /** Must match the folder name under apps/ (checked by labs.test.ts). */
  id: string;
  title: string;
  description: string;
  group: GroupId;
  tech: string[];
  status: Status;
  /** ISO date, YYYY-MM-DD */
  updated: string;
  /** Deployed URL, always `https://${id}.labs.rjmlaird.co.uk`. Omit until the lab is deployed. */
  path?: string;
  /** Folder in the repo, shown as the "Source" link. Always `apps/${id}`. */
  source?: string;
}

export const REPO = "https://github.com/rjmlaird/rjmlaird-labs";

export const GROUPS: { id: GroupId; name: string; blurb: string }[] = [
  { id: "physics", name: "Physics & Space", blurb: "Interactive demonstrations of mechanics, electricity, matter, waves and orbital dynamics." },
  { id: "climate", name: "Climate & Earth", blurb: "Evidence-based explorations of the climate system, fluid dynamics, and environmental indicators." },
  { id: "focus", name: "Focus & Everyday", blurb: "Small experiments for choosing breaks, visualization, and understanding attention." },
];

export const STATUS: Record<Status, { label: string; order: number }> = {
  active: { label: "Active", order: 1 },
  "in-progress": { label: "In progress", order: 2 },
  planned: { label: "Planned", order: 3 },
  archived: { label: "Archived", order: 4 },
};

// Placeholder stack for labs whose stack I have not confirmed: check each `tech` array.
const WEB = ["React", "Vite", "TypeScript"];

export const LABS: Lab[] = [
  // Physics & Space
  {
    id: "mechanics",
    title: "Mechanics Lab",
    description: "Interactive demonstrations of forces, motion and energy, built to be explored rather than read.",
    group: "physics",
    tech: WEB,
    status: "active",
    updated: "2026-10-09",
    path: "https://mechanics.labs.rjmlaird.co.uk",
    source: "apps/mechanics",
  },
  {
    id: "electricity",
    title: "Electricity Lab",
    description: "A companion to the Mechanics Lab for exploring circuits, current, voltage and resistance.",
    group: "physics",
    tech: WEB,
    status: "in-progress",
    updated: "2026-10-09",
    path: "https://electricity.labs.rjmlaird.co.uk",
    source: "apps/electricity",
  },
  {
    id: "elements",
    title: "Elements Lab",
    description: "An interactive periodic table with a card for each element, for browsing properties and patterns.",
    group: "physics",
    tech: WEB,
    status: "in-progress",
    updated: "2026-10-09",
    path: "https://elements.labs.rjmlaird.co.uk",
    source: "apps/elements",
  },
  {
    id: "astronomy",
    title: "Astronomy Lab",
    description: "Visualisations and calculators for celestial coordinates, stellar properties, and sky mechanics.",
    group: "physics",
    tech: WEB,
    status: "in-progress",
    updated: "2026-10-15",
    source: "apps/astronomy",
  },
  {
    id: "n-body",
    title: "N-Body Gravitational Simulator",
    description: "Interactive gravitational simulation of multiple bodies interacting under Newtonian mechanics.",
    group: "physics",
    tech: WEB,
    status: "in-progress",
    updated: "2026-10-18",
    source: "apps/n-body",
  },
  {
    id: "satellites",
    title: "Satellite Orbit Viewer",
    description: "Visualising satellite trajectories, ground tracks, and orbital parameters in real time.",
    group: "physics",
    tech: WEB,
    status: "in-progress",
    updated: "2026-10-20",
    source: "apps/satellites",
  },
  {
    id: "maths",
    title: "Maths Explorer",
    description: "Interactive mathematical functions, geometry, and transformation visualisers.",
    group: "physics",
    tech: WEB,
    status: "planned",
    updated: "2026-10-09",
    source: "apps/maths",
  },
  {
    id: "equations",
    title: "Equation Solver & Grapher",
    description: "Plot and explore physical and mathematical equations with live parameter adjustments.",
    group: "physics",
    tech: WEB,
    status: "planned",
    updated: "2026-10-09",
    source: "apps/equations",
  },
  {
    id: "doppler",
    title: "Doppler & Redshift Visualiser",
    description: "Wavefronts and spectral lines showing Doppler shift, with a toggle between Doppler and cosmological redshift.",
    group: "physics",
    tech: ["HTML", "JavaScript"],
    status: "planned",
    updated: "2026-10-09",
    source: "apps/doppler",
  },

  // Climate & Earth
  {
    id: "climate-visualiser",
    title: "Climate Visualiser",
    description: "An evidence-based look at the climate system, from atmosphere and ocean to sea level, including policy successes such as the Montreal Protocol.",
    group: "climate",
    tech: WEB,
    status: "planned",
    updated: "2026-08-16",
    source: "apps/climate-visualiser",
  },
  {
    id: "climate-time-machine",
    title: "Climate Time Machine",
    description: "Historical and projected climate metrics visualization over decades and centuries.",
    group: "climate",
    tech: WEB,
    status: "planned",
    updated: "2026-08-20",
    source: "apps/climate-time-machine",
  },
  {
    id: "cfd",
    title: "Fluid Dynamics (CFD) Simulator",
    description: "Simplified computational fluid dynamics browser simulation for airflow and fluid flow around obstacles.",
    group: "climate",
    tech: ["TypeScript", "HTML5 Canvas"],
    status: "planned",
    updated: "2026-09-10",
    source: "apps/cfd",
  },
  {
    id: "biodiversity",
    title: "Biodiversity & Ecosystems",
    description: "Modelling population dynamics and habitat resilience under environmental stress.",
    group: "climate",
    tech: WEB,
    status: "planned",
    updated: "2026-09-12",
    source: "apps/biodiversity",
  },
  {
    id: "drought",
    title: "Drought & Precipitation Index",
    description: "Tracking meteorological and hydrological drought indicators across regional datasets.",
    group: "climate",
    tech: WEB,
    status: "planned",
    updated: "2026-09-15",
    source: "apps/drought",
  },
  {
    id: "wildfires",
    title: "Wildfire Spread Model",
    description: "Cellular automaton model simulating wildfire propagation based on wind, terrain, and moisture.",
    group: "climate",
    tech: WEB,
    status: "planned",
    updated: "2026-09-18",
    source: "apps/wildfires",
    },
  {
    id: "sewage",
    title: "Water Quality & Discharge Monitor",
    description: "Visualising river catchment data, rainfall events, and storm overflow impact models.",
    group: "climate",
    tech: WEB,
    status: "planned",
    updated: "2026-09-20",
    source: "apps/sewage",
  },

  // Focus & Everyday
  {
    id: "interruption-log",
    title: "Interruption Log",
    description: "Quick capture for interruptions, with charts of when they happen so you can see patterns over the week.",
    group: "focus",
    tech: WEB,
    status: "planned",
    updated: "2026-09-03",
    source: "apps/interruption-log",
  },
  {
    id: "contrast",
    title: "Colour Contrast & Accessibility Lab",
    description: "Interactive visual contrast testing and palette evaluation for accessible web interfaces.",
    group: "focus",
    tech: WEB,
    status: "in-progress",
    updated: "2026-10-12",
    source: "apps/contrast",
  },
  {
    id: "rubiks",
    title: "Rubik's Cube State Analyser",
    description: "Interactive 3D cube manipulation and algorithm visualization.",
    group: "focus",
    tech: ["Three.js", "TypeScript"],
    status: "in-progress",
    updated: "2026-10-14",
    source: "apps/rubiks",
  },
  {
    id: "blueprint",
    title: "Blueprint Layout Grid",
    description: "Architectural and typographic grid layout prototyping utility.",
    group: "focus",
    tech: WEB,
    status: "planned",
    updated: "2026-10-01",
    source: "apps/blueprint",
  },
  {
    id: "marketing",
    title: "Campaign Attribution Flow",
    description: "Visualising multi-channel marketing touchpoints and conversion paths.",
    group: "focus",
    tech: WEB,
    status: "planned",
    updated: "2026-10-02",
    source: "apps/marketing",
  },
];