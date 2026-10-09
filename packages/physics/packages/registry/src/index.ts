import { labs } from "./labs";
import type { ExperimentManifest, LabManifest } from "./types";

export * from "./types";
export { labs };

export const LABS_DOMAIN = "labs.rjmlaird.co.uk";

export function getLab(slug: string): LabManifest {
  const lab = labs.find((l) => l.slug === slug);
  if (!lab) throw new Error(`Unknown lab "${slug}". Add it to packages/registry/src/labs.ts`);
  return lab;
}

export function labUrl(lab: LabManifest): string {
  return lab.url ?? `https://${lab.slug}.${LABS_DOMAIN}/`;
}

export function experimentsOf(slug: string): ExperimentManifest[] {
  return getLab(slug).experiments ?? [];
}

export function visibleLabs(): LabManifest[] {
  return labs.filter((l) => l.status !== "archived");
}
