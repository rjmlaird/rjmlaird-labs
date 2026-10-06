// Shared helpers for talking to the CelesTrak proxy API (/api/*) and parsing
// its data formats.
//
// Used by:
//   - satellite-ground-track.ts
//   - satellite-passes.ts
//   - launch-stats.ts
//
// Data flow:
//   browser -> IndexedDB cache -> /api/*
//   -> Vercel edge cache -> CelesTrak
//
// The API should trim SATCAT data to the rows and columns the app needs.
// This keeps browser payloads small and avoids requesting CelesTrak per visitor.

import { cachedFetchText } from "./cache";

export type TLEEntry = {
  name: string;
  noradId: number;
  l1: string;
  l2: string;
};

export type SatcatKeys = {
  norad: string | null;
  status: string | null;
  type: string | null;
  owner: string | null;
  launch: string | null;
  site: string | null;
  decay: string | null;
  period: string | null;
  incl: string | null;
  apogee: string | null;
  perigee: string | null;
  rcs: string | null;
  objid: string | null;
  orbit: string | null;
  name: string | null;
};

export type SatCatParse = {
  rows: Record<string, string>[];
  keys: SatcatKeys;
};

export type SatcatRecord = {
  objectName: string;
  objectId: string;
  noradCatId: number | null;
  objectType: string;
  operationalStatusCode: string;
  owner: string;
  launchDate: string;
  launchSite: string;
  decayDate: string;
  periodMinutes: number | null;
  inclinationDegrees: number | null;
  apogeeKm: number | null;
  perigeeKm: number | null;
  radarCrossSectionM2: number | null;
  dataStatusCode: string;
  orbitCenter: string;
  orbitType: string;
};

export const SATCAT_PAYLOADS_URL =
  "/api/satcat?scope=payloads";

export function gpUrl(group: string): string {
  return `/api/gp?group=${encodeURIComponent(group)}`;
}

export function satcatUrl(group: string): string {
  return `/api/satcat?group=${encodeURIComponent(group)}`;
}

export function fetchText(
  url: string
): Promise<string> {
  return cachedFetchText(url);
}

export async function fetchTextChecked(
  url: string
): Promise<string> {
  const text = await fetchText(url);

  if (!text.trim()) {
    throw new Error(
      `The data service returned an empty response for ${url}.`
    );
  }

  return text;
}

export function parseTLE(
  text: string
): TLEEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const entries: TLEEntry[] = [];

  for (
    let index = 0;
    index + 2 < lines.length;
    index += 3
  ) {
    const name = lines[index].trim();
    const l1 = lines[index + 1].trimEnd();
    const l2 = lines[index + 2].trimEnd();

    if (
      !l1.startsWith("1 ") ||
      !l2.startsWith("2 ")
    ) {
      continue;
    }

    const id1 = parseInt(
      l1.substring(2, 7).trim(),
      10
    );

    const id2 = parseInt(
      l2.substring(2, 7).trim(),
      10
    );

    if (
      !Number.isInteger(id1) ||
      id1 <= 0 ||
      id1 !== id2
    ) {
      continue;
    }

    entries.push({
      name,
      noradId: id1,
      l1,
      l2
    });
  }

  return entries;
}

export function splitCSVLine(
  line: string
): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character = line[index];

    if (character === '"') {
      if (
        quoted &&
        line[index + 1] === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      character === "," &&
      !quoted
    ) {
      result.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  result.push(current);

  return result;
}

function findKey(
  headers: string[],
  pattern: RegExp
): string | null {
  return (
    headers.find((header) =>
      pattern.test(header)
    ) ?? null
  );
}

function resolveSatcatKeys(
  headers: string[]
): SatcatKeys {
  return {
    norad: findKey(
      headers,
      /NORAD.*CAT.*ID/i
    ),
    status: findKey(
      headers,
      /OPS.*STATUS/i
    ),
    type: findKey(
      headers,
      /^OBJECT_TYPE$/i
    ),
    owner: findKey(
      headers,
      /^OWNER$/i
    ),
    launch: findKey(
      headers,
      /^LAUNCH_DATE$/i
    ),
    site: findKey(
      headers,
      /^LAUNCH_SITE$/i
    ),
    decay: findKey(
      headers,
      /^DECAY_DATE$/i
    ),
    period: findKey(
      headers,
      /^PERIOD$/i
    ),
    incl: findKey(
      headers,
      /^INCLINATION$/i
    ),
    apogee: findKey(
      headers,
      /^APOGEE$/i
    ),
    perigee: findKey(
      headers,
      /^PERIGEE$/i
    ),
    rcs: findKey(
      headers,
      /^RCS$/i
    ),
    objid: findKey(
      headers,
      /^OBJECT_ID$/i
    ),
    orbit: findKey(
      headers,
      /^ORBIT_TYPE$/i
    ),
    name: findKey(
      headers,
      /^OBJECT_NAME$/i
    )
  };
}

/**
 * Parse SATCAT CSV.
 *
 * Column names are resolved from the header rather than hard-coded positions.
 * This remains robust if CelesTrak changes the order of columns.
 */
export function parseSatcat(
  text: string
): SatCatParse {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      rows: [],
      keys: {
        norad: null,
        status: null,
        type: null,
        owner: null,
        launch: null,
        site: null,
        decay: null,
        period: null,
        incl: null,
        apogee: null,
        perigee: null,
        rcs: null,
        objid: null,
        orbit: null,
        name: null
      }
    };
  }

  const headers = splitCSVLine(lines[0])
    .map((header) => header.trim());

  const rows: Record<string, string>[] = [];

  for (
    let index = 1;
    index < lines.length;
    index += 1
  ) {
    const values = splitCSVLine(lines[index]);
    const row: Record<string, string> = {};

    headers.forEach((header, columnIndex) => {
      row[header] =
        values[columnIndex]?.trim() ?? "";
    });

    rows.push(row);
  }

  return {
    rows,
    keys: resolveSatcatKeys(headers)
  };
}

function parseNumber(
  value: string | undefined
): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function rowValue(
  row: Record<string, string>,
  key: string | null
): string {
  if (!key) {
    return "";
  }

  return row[key] ?? "";
}

export function satcatRecordFromRow(
  row: Record<string, string>,
  keys: SatcatKeys
): SatcatRecord {
  return {
    objectName: rowValue(row, keys.name),
    objectId: rowValue(row, keys.objid),
    noradCatId: parseNumber(
      rowValue(row, keys.norad)
    ),
    objectType: rowValue(row, keys.type),
    operationalStatusCode: rowValue(
      row,
      keys.status
    ),
    owner: rowValue(row, keys.owner),
    launchDate: rowValue(row, keys.launch),
    launchSite: rowValue(row, keys.site),
    decayDate: rowValue(row, keys.decay),
    periodMinutes: parseNumber(
      rowValue(row, keys.period)
    ),
    inclinationDegrees: parseNumber(
      rowValue(row, keys.incl)
    ),
    apogeeKm: parseNumber(
      rowValue(row, keys.apogee)
    ),
    perigeeKm: parseNumber(
      row,
      keys.perigee
    ),
    radarCrossSectionM2: parseNumber(
      rowValue(row, keys.rcs)
    ),
    dataStatusCode: "",
    orbitCenter: "EARTH",
    orbitType: rowValue(row, keys.orbit)
  };
}

export function satcatRecords(
  parsed: SatCatParse
): SatcatRecord[] {
  return parsed.rows.map((row) =>
    satcatRecordFromRow(row, parsed.keys)
  );
}

export async function loadSatcatGroup(
  group: string
): Promise<SatCatParse> {
  const text = await fetchTextChecked(
    satcatUrl(group)
  );

  return parseSatcat(text);
}

export async function loadSatcatPayloads(): Promise<
  SatCatParse
> {
  const text = await fetchTextChecked(
    SATCAT_PAYLOADS_URL
  );

  return parseSatcat(text);
}

export async function findSatcatRecord(
  noradId: number,
  group = "active"
): Promise<SatcatRecord | undefined> {
  const parsed = await loadSatcatGroup(group);
  const records = satcatRecords(parsed);

  return records.find(
    (record) =>
      record.noradCatId === noradId
  );
}

export function get(
  row: Record<string, string>,
  keys: SatcatKeys,
  key: keyof SatcatKeys
): string {
  const resolvedKey = keys[key];

  return resolvedKey
    ? row[resolvedKey] || "—"
    : "—";
}

export function escapeHtml(
  value: string
): string {
  if (
    typeof document === "undefined"
  ) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const element =
    document.createElement("div");

  element.textContent = value;

  return element.innerHTML;
}
