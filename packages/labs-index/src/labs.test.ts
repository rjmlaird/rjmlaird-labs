import { readdirSync } from "node:fs";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LABS, GROUPS, STATUS } from "./labs";

// Folders under labs/ that are not labs themselves.
const NOT_LABS = new Set(["index"]);

// Walk up from this file to the nearest directory called "labs".
function findLabsDir(start: string): string {
  let dir = start;
  while (basename(dir) !== "labs") {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`No labs/ directory found above ${start}`);
    dir = parent;
  }
  return dir;
}

const LABS_DIR = findLabsDir(dirname(fileURLToPath(import.meta.url)));

const folders = readdirSync(LABS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !NOT_LABS.has(d.name))
  .map((d) => d.name);

describe("labs registry", () => {
  it("has unique ids", () => {
    const ids = LABS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has an entry for every labs/ folder, and a folder for every entry", () => {
    expect(LABS.map((a) => a.id).sort()).toEqual([...folders].sort());
  });

  it("uses known groups and statuses", () => {
    const groups = new Set(GROUPS.map((g) => g.id));
    for (const a of LABS) {
      expect(groups.has(a.group), `${a.id}: group`).toBe(true);
      expect(a.status in STATUS, `${a.id}: status`).toBe(true);
    }
  });

  it("follows the path and source conventions", () => {
    for (const a of LABS) {
      if (a.source) expect(a.source, `${a.id}: source`).toBe(`labs/${a.id}`);
      if (a.path) expect(a.path, `${a.id}: path`).toBe(`https://${a.id}.labs.rjmlaird.co.uk`);
    }
  });

  it("only gives a path to labs that are live", () => {
    for (const a of LABS) {
      const live = a.status === "active" || a.status === "in-progress";
      expect(Boolean(a.path), `${a.id}: path vs status`).toBe(live);
    }
  });

  it("uses valid ISO dates", () => {
    for (const a of LABS) {
      expect(a.updated, `${a.id}: updated`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(a.updated)), `${a.id}: updated`).toBe(false);
    }
  });
});