import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GROUPS,
  REPO,
  STATUS,
  LABS,
} from "../apps/labs-index/src/labs.ts";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

const ORIGIN = "https://labs.rjmlaird.co.uk";
const SOURCE_REF = "main";

const args = process.argv.slice(2);

const checkOnly = args.includes("--check");

const outputIndex = args.indexOf("--output");

if (
  outputIndex !== -1 &&
  (!args[outputIndex + 1] || args[outputIndex + 1].startsWith("--"))
) {
  throw new Error("--output requires a destination filename.");
}

const outputFile = resolve(
  ROOT,
  outputIndex === -1
    ? "../rjmlaird-api/src/data/labs-builds.json"
    : args[outputIndex + 1],
);

/**
 * Validate the registry before exporting.
 */

const groupIds = new Set(GROUPS.map((group) => group.id));
const seenIds = new Set<string>();

if (groupIds.size !== GROUPS.length) {
  throw new Error("Duplicate group IDs in GROUPS.");
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function resolveLabUrl(labId: string, path?: string): string {
  if (!path) {
    return `https://${labId}.labs.rjmlaird.co.uk/`;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path.endsWith("/") ? path : `${path}/`;
  }

  return `https://${labId}.labs.rjmlaird.co.uk${path.startsWith("/") ? path : `/${path}`}`;
}

for (const lab of LABS) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lab.id)) {
    throw new Error(`Invalid lab ID: "${lab.id}".`);
  }

  if (seenIds.has(lab.id)) {
    throw new Error(`Duplicate lab ID: "${lab.id}".`);
  }

  seenIds.add(lab.id);

  if (!lab.title.trim() || !lab.description.trim()) {
    throw new Error(`${lab.id}: title and description are required.`);
  }

  if (!groupIds.has(lab.group)) {
    throw new Error(`${lab.id}: unknown group "${lab.group}".`);
  }

  if (!Object.hasOwn(STATUS, lab.status)) {
    throw new Error(`${lab.id}: unknown status "${lab.status}".`);
  }

  if (!isCalendarDate(lab.updated)) {
    throw new Error(
      `${lab.id}: updated must be a valid YYYY-MM-DD date.`,
    );
  }

  if (
    lab.path !== undefined &&
    lab.path !== `/${lab.id}` &&
    lab.path !== `https://${lab.id}.labs.rjmlaird.co.uk` &&
    lab.path !== `https://${lab.id}.labs.rjmlaird.co.uk/`
  ) {
    throw new Error(
      `${lab.id}: path must equal "/${lab.id}" or "https://${lab.id}.labs.rjmlaird.co.uk".`,
    );
  }

  if (lab.source !== undefined && lab.source !== `apps/${lab.id}`) {
    throw new Error(
      `${lab.id}: source must equal "apps/${lab.id}".`,
    );
  }

  if (lab.status === "active" && !lab.path) {
    throw new Error(
      `${lab.id}: an active lab must have a deployment path.`,
    );
  }

  if (
    lab.tech.length === 0 ||
    lab.tech.some((technology) => !technology.trim())
  ) {
    throw new Error(`${lab.id}: tech must contain non-empty names.`);
  }
}

/**
 * Export in the shape consumed by the combined Builds API.
 *
 * Preserve registry order and dates.
 * Do not add a generation timestamp that changes on every run.
 */

const catalogue = {
  schemaVersion: 1,
  origin: ORIGIN,
  repository: REPO,
  sourceRef: SOURCE_REF,

  groups: GROUPS,
  statuses: STATUS,

  builds: LABS.map((lab) => {
    const labUrl = resolveLabUrl(lab.id, lab.path);

    return {
      id: `labs/${lab.id}`,
      sourceId: lab.id,
      type: "lab",

      title: lab.title,
      description: lab.description,
      group: lab.group,
      tech: lab.tech,
      status: lab.status,
      updated: lab.updated,

      repository: REPO,

      ...(lab.path
        ? {
            path: labUrl,
            url: labUrl,
          }
        : {}),

      ...(lab.source
        ? {
            sourcePath: lab.source,
            source: `${REPO}/tree/${SOURCE_REF}/${lab.source}`,
          }
        : {}),
    };
  }),
};

const output = `${JSON.stringify(catalogue, null, 2)}\n`;

async function main() {
  if (checkOnly) {
    const existing = await readFile(outputFile, "utf8").catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          throw new Error(
            `Missing export: ${outputFile}. Run the export command first.`,
          );
        }

        throw error;
      },
    );

    if (existing !== output) {
      throw new Error(
        "The JSON export is stale. Regenerate it from labs.ts.",
      );
    }

    console.log(`Export is current: ${outputFile}`);
    return;
  }

  await mkdir(dirname(outputFile), { recursive: true });

  const temporaryFile = `${outputFile}.tmp`;

  await writeFile(temporaryFile, output, "utf8");
  await rename(temporaryFile, outputFile);

  console.log(
    `Exported ${catalogue.builds.length} labs to ${outputFile}`,
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : String(error),
  );

  process.exitCode = 1;
});