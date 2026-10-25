// GET /api/satcat?group=stations  ->  SATCAT rows for just the objects in that group
// GET /api/satcat?scope=payloads  ->  tiny PAY-only table used by Launch Stats
//
// The full SATCAT CSV is ~10 MB. Browsers used to download and parse all of
// it on every visit. Here it is fetched once per warm function instance,
// trimmed to the columns the app uses, and only the relevant rows are sent
// back — typically well under 1 MB — in the same CSV shape the client
// parser already understands.
import {
  CACHE_CONTROL,
  csvCell,
  errorResponse,
  fetchUpstream,
  gpUpstream,
  parseTleNoradIds,
  readGroup,
  SATCAT_UPSTREAM,
  splitCSVLine,
  UpstreamError,
} from './_lib/celestrak.js';

// Columns the client actually reads (matched by pattern, like the client
// does, because Celestrak has reordered columns before).
const KEEP = [
  /^OBJECT_ID$/i,
  /NORAD.*CAT.*ID/i,
  /^OBJECT_TYPE$/i,
  /OPS.*STATUS/i,
  /^OWNER$/i,
  /LAUNCH_DATE/i,
  /LAUNCH_SITE/i,
  /^PERIOD$/i,
  /INCLINATION/i,
  /APOGEE/i,
  /PERIGEE/i,
  /^RCS$/i,
  /^ORBIT_TYPE$/i,
];
const PAYLOAD_COLS = [/^OBJECT_TYPE$/i, /^OWNER$/i, /LAUNCH_DATE/i];

const MEM_TTL_MS = 2 * 60 * 60 * 1000;
let mem = null; // survives across invocations while the instance is warm
let memPending = null;

function pick(headers, patterns) {
  const idx = [];
  for (const re of patterns) {
    const i = headers.findIndex((h) => re.test(h));
    if (i !== -1 && !idx.includes(i)) idx.push(i);
  }
  return idx;
}

/** Parse raw SATCAT CSV into the slim lookup structures. Exported for tests. */
export function buildIndex(csv) {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) throw new UpstreamError('SATCAT was empty');
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());

  const keepIdx = pick(headers, KEEP);
  const payIdx = pick(headers, PAYLOAD_COLS);
  const noradIdx = headers.findIndex((h) => /NORAD.*CAT.*ID/i.test(h));
  const typeIdx = headers.findIndex((h) => /^OBJECT_TYPE$/i.test(h));
  if (noradIdx === -1 || typeIdx === -1) throw new UpstreamError('SATCAT columns not recognised');

  const slimHeader = keepIdx.map((i) => csvCell(headers[i])).join(',');
  const payHeader = payIdx.map((i) => csvCell(headers[i])).join(',');
  const rowByNorad = new Map();
  const payRows = [];

  for (let n = 1; n < lines.length; n++) {
    const cells = splitCSVLine(lines[n]);
    const norad = parseInt(cells[noradIdx], 10);
    if (isNaN(norad)) continue;
    rowByNorad.set(norad, keepIdx.map((i) => csvCell((cells[i] ?? '').trim())).join(','));
    if ((cells[typeIdx] || '').trim().toUpperCase() === 'PAY') {
      payRows.push(payIdx.map((i) => csvCell((cells[i] ?? '').trim())).join(','));
    }
  }

  return {
    at: Date.now(),
    slimHeader,
    rowByNorad,
    payloadsCsv: payHeader + '\n' + payRows.join('\n'),
  };
}

async function loadIndex() {
  if (mem && Date.now() - mem.at < MEM_TTL_MS) return mem;
  if (!memPending) {
    memPending = fetchUpstream(SATCAT_UPSTREAM, 28000)
      .then((csv) => (mem = buildIndex(csv)))
      .finally(() => (memPending = null));
  }
  return memPending;
}

/** Exported for tests: slice the index down to a list of NORAD ids. */
export function sliceCsv(index, noradIds) {
  const seen = new Set();
  const rows = [];
  for (const id of noradIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const row = index.rowByNorad.get(id);
    if (row) rows.push(row);
  }
  return index.slimHeader + '\n' + rows.join('\n');
}

const csvResponse = (body) =>
  new Response(body, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'cache-control': CACHE_CONTROL },
  });

export async function GET(request) {
  const url = new URL(request.url);

  try {
    if (url.searchParams.get('scope') === 'payloads') {
      const index = await loadIndex();
      return csvResponse(index.payloadsCsv);
    }

    const group = readGroup(request);
    if (group instanceof Response) return group;

    const [index, tle] = await Promise.all([loadIndex(), fetchUpstream(gpUpstream(group))]);
    const ids = parseTleNoradIds(tle);
    if (!ids.length) return errorResponse(404, `Celestrak returned no element sets for "${group}"`);
    return csvResponse(sliceCsv(index, ids));
  } catch (e) {
    if (e instanceof UpstreamError) return errorResponse(502, e.message);
    throw e;
  }
}
