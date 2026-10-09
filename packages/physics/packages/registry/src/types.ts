export type LabTheme = "navy" | "forest" | "paper" | "slate";

/** How the lab is built. Lets the hub and tooling treat legacy labs honestly. */
export type LabKind =
  | "astro-react" // Astro shell + React islands (target for new labs)
  | "vite-react" //  Vite + React SPA
  | "static-html"; // single self-contained HTML file (legacy, migrate over time)

export type LabStatus = "live" | "wip" | "archived";
export type LabTopic = "mechanics" | "electricity" | "magnetism" | "fluids" | "space" | "relativity";
export type LabLevel = "explore" | "gcse" | "a-level";

/** One page inside a multi-experiment lab (e.g. Mechanics → Ramp). */
export interface ExperimentManifest {
  id: string;
  label: string;
  /** Path inside the lab app, e.g. "/ramp". */
  href: string;
  eyebrow?: string;
  summary: string;
}

export interface LabManifest {
  /** Stable id. Also the default subdomain: <slug>.labs.rjmlaird.co.uk */
  slug: string;
  title: string;
  summary: string;
  topic: LabTopic;
  level: LabLevel;
  theme: LabTheme;
  kind: LabKind;
  status: LabStatus;
  tags?: string[];
  /** Override only when the lab doesn't live at <slug>.labs.rjmlaird.co.uk */
  url?: string;
  experiments?: ExperimentManifest[];
}
