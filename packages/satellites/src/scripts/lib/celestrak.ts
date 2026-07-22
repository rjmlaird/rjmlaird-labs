// Shared helpers for talking to Celestrak and parsing its data formats.
// Used by both satellite-ground-track.ts and launch-stats.ts so the two
// features stay consistent (same CORS fallback, same SATCAT column
// resolution) instead of drifting apart as separate copies.

export const SATCAT_URL = 'https://celestrak.org/pub/satcat.csv';

export function gpUrl(group: string) {
  return `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
}

/**
 * Fetch text from a URL, falling back to a public CORS relay if the direct
 * request is blocked by the browser. Celestrak does not always send
 * permissive CORS headers, so this keeps the app usable without a backend.
 */
export async function fetchText(url: string): Promise<string> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } catch (e) {
    const relay = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    const r2 = await fetch(relay, { cache: 'no-store' });
    if (!r2.ok) throw e;
    return await r2.text();
  }
}

export type TLEEntry = { name: string; noradId: number; l1: string; l2: string };

export function parseTLE(text: string): TLEEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const out: TLEEntry[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i].trim();
    const l1 = lines[i + 1];
    const l2 = lines[i + 2];
    if (!l1.startsWith('1 ') || !l2.startsWith('2 ')) continue;
    const noradId = parseInt(l1.substring(2, 7).trim(), 10);
    out.push({ name, noradId, l1, l2 });
  }
  return out;
}

export function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

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

/**
 * Parse SATCAT CSV text. Column names are resolved by pattern rather than
 * hard-coded position, since Celestrak has changed column order before.
 */
export function parseSatcat(text: string): SatCatParse {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return { rows: [], keys: {} as SatcatKeys };
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = vals[idx] !== undefined ? vals[idx].trim() : ''));
    rows.push(obj);
  }

  const findKey = (re: RegExp) => headers.find((h) => re.test(h)) || null;

  return {
    rows,
    keys: {
      norad: findKey(/NORAD.*CAT.*ID/i),
      status: findKey(/OPS.*STATUS/i),
      type: findKey(/OBJECT_TYPE/i),
      owner: findKey(/OWNER/i),
      launch: findKey(/LAUNCH_DATE/i),
      site: findKey(/LAUNCH_SITE/i),
      decay: findKey(/DECAY_DATE/i),
      period: findKey(/^PERIOD$/i),
      incl: findKey(/INCLINATION/i),
      apogee: findKey(/APOGEE/i),
      perigee: findKey(/PERIGEE/i),
      rcs: findKey(/RCS/i),
      objid: findKey(/OBJECT_ID/i),
      orbit: findKey(/ORBIT_TYPE/i),
      name: findKey(/^OBJECT_NAME$/i),
    },
  };
}

export function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function get(cat: Record<string, string>, catKeys: SatcatKeys, key: keyof SatcatKeys): string {
  const k = catKeys[key];
  return k ? cat[k] || '—' : '—';
}
