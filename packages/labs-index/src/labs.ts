export type Status = "active" | "in-progress" | "planned" | "archived";
export type GroupId = "physics" | "climate" | "focus";

export interface Lab {
  /** Must match the folder name under labs/ (checked by labs.test.ts). */
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
  /** Folder in the repo, shown as the "Source" link. Always `labs/${id}`. */
  source?: string;
}

export const REPO = "https://github.com/rjmlaird/rjmlaird-labs";

export const GROUPS: { id: GroupId; name: string; blurb: string }[] = [
  { id: "physics", name: "Physics & Space", blurb: "Interactive demonstrations of mechanics, electricity, matter and waves." },
  { id: "climate", name: "Climate & Earth", blurb: "Evidence-based explorations of the climate system." },
  { id: "focus", name: "Focus & Everyday", blurb: "Small experiments for choosing breaks and understanding your own attention." },
];

export const STATUS: Record<Status, { label: string; order: number }> = {
  active: { label: "Active", order: 1 },
  "in-progress": { label: "In progress", order: 2 },
  planned: { label: "Planned", order: 3 },
  archived: { label: "Archived", order: 4 },
};

// Placeholder stack for labs whose stack I have not confirmed: check each `tech` array.
const WEB = ["React", "Vite", "TypeScript"];

// Add a lab here and it appears on the index. Keep `id` equal to the labs/ folder name.
// Flip a lab to "active" and add `path` only once it is deployed.
// Starter entries: check every id, status and updated date against the real repo.
export const LABS: Lab[] = [
  // Physics & Space
  {
    id: "mechanics",
    title: "Mechanics Lab",
    description:
      "Interactive demonstrations of forces, motion and energy, built to be explored rather than read.",
    group: "physics",
    tech: WEB,
    status: "active",
    updated: "2026-10-09",
    path: "https://mechanics.labs.rjmlaird.co.uk",
    source: "labs/mechanics",
  },
  {
    id: "electricity",
    title: "Electricity Lab",
    description:
      "A companion to the Mechanics Lab for exploring circuits, current, voltage and resistance.",
    group: "physics",
    tech: WEB,
    status: "planned",
    updated: "2026-10-09",
  },
  {
    id: "elements",
    title: "Elements Lab",
    description:
      "An interactive periodic table with a card for each element, for browsing properties and patterns.",
    group: "physics",
    tech: WEB,
    status: "planned",
    updated: "2026-10-09",
  },
  {
    id: "doppler",
    title: "Doppler & Redshift Visualiser",
    description:
      "Wavefronts and spectral lines showing Doppler shift, with a toggle between Doppler and cosmological redshift.",
    group: "physics",
    tech: ["HTML", "JavaScript"],
    status: "planned",
    updated: "2026-10-09",
  },

  // Climate & Earth
  {
    id: "climate-visualiser",
    title: "Climate Visualiser",
    description:
      "An evidence-based look at the climate system, from atmosphere and ocean to sea level, including policy successes such as the Montreal Protocol.",
    group: "climate",
    tech: WEB,
    status: "planned",
    updated: "2026-08-16",
  },

  // Focus & Everyday
  {
    id: "dopamine-menu",
    title: "Dopamine Menu",
    description:
      "A personal menu of short, enjoyable or restorative activities, filtered by time, place and the kind of break you want.",
    group: "focus",
    tech: WEB,
    status: "planned",
    updated: "2026-09-03",
  },
  {
    id: "interruption-log",
    title: "Interruption Log",
    description:
      "Quick capture for interruptions, with charts of when they happen so you can see patterns over the week.",
    group: "focus",
    tech: WEB,
    status: "planned",
    updated: "2026-09-03",
  },
];
