import * as satellite from 'satellite.js';
import * as THREE from 'three';

const STATUS_INFO = {
  '+': { label: 'Operational', desc: 'Operational', key: 'op', color: 'var(--op)' },
  '-': { label: 'Nonoperational', desc: 'Nonoperational', key: 'nonop', color: 'var(--nonop)' },
  P: {
    label: 'Partially Operational',
    desc: 'Partially fulfilling primary mission or secondary mission(s)',
    key: 'partial',
    color: 'var(--partial)'
  },
  B: {
    label: 'Backup/Standby',
    desc: 'Previously operational satellite put into reserve status',
    key: 'backup',
    color: 'var(--backup)'
  },
  S: { label: 'Spare', desc: 'New satellite awaiting full activation', key: 'spare', color: 'var(--spare)' },
  X: { label: 'Extended Mission', desc: 'Extended Mission', key: 'extended', color: 'var(--extended)' },
  D: { label: 'Decayed', desc: 'Decayed', key: 'decayed', color: 'var(--decayed)' },
  '?': { label: 'Unknown', desc: 'Unknown', key: 'unknown', color: 'var(--unknown)' }
} as const;

const STATUS_ORDER = ['+', 'P', 'X', 'B', 'S', '-', 'D', '?'] as const;

function resolveColor(varStr: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(varStr.replace('var(', '').replace(')', '')).trim();
}

const STATUS_HEX: Record<string, string> = {};
STATUS_ORDER.forEach((c) => (STATUS_HEX[c] = resolveColor(STATUS_INFO[c].color)));

const activeFilters = new Set<string>(STATUS_ORDER);

type SatRecord = {
  name: string;
  noradId: number;
  satrec: any;
  statusCode: string;
  cat: Record<string, string> | null;
  catKeys: Record<string, string | null>;
  lat: number | null;
  lon: number | null;
  alt: number | null;
  vel: number | null;
  valid: boolean;
};

type SatCatParse = {
  rows: Record<string, string>[];
  keys: Record<string, string | null>;
};

let satellites: SatRecord[] = [];
let satIndex = new Map<number, SatRecord>();
let filtered: SatRecord[] = [];
let selected: SatRecord | null = null;
let nightGrid: any = null;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let dpr = window.devicePixelRatio || 1;
let W = 0;
let H = 0;
let lastUpdateTime: Date | null = null;

const overlay = document.getElementById('overlay') as HTMLDivElement;
const overlayMsg = document.getElementById('overlayMsg') as HTMLDivElement;
const statusBadge = document.getElementById('statusBadge') as HTMLSpanElement;
const statusBadgeText = document.getElementById('statusBadgeText') as HTMLSpanElement;
const statCount = document.getElementById('statCount') as HTMLSpanElement;
const statShown = document.getElementById('statShown') as HTMLSpanElement;
const statUpdated = document.getElementById('statUpdated') as HTMLSpanElement;

const cardEl = document.getElementById('satCard') as HTMLDivElement;
const cardName = document.getElementById('cardName') as HTMLDivElement;
const cardStatus = document.getElementById('cardStatus') as HTMLDivElement;
const cardBody = document.getElementById('cardBody') as HTMLDivElement;
const mapWrap = document.querySelector('.map-wrap') as HTMLDivElement;
const tooltip = document.getElementById('tooltip') as HTMLDivElement;

const globeHint = document.getElementById('globeHint') as HTMLDivElement;

let currentView: '2d' | '3d' = '2d';

function setBadge(mode: string, text: string) {
  statusBadge.className = 'badge ' + mode;
  statusBadgeText.textContent = text;
}

async function fetchText(url: string) {
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

function gpUrl(group: string) {
  return `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
}

const SATCAT_URL = 'https://celestrak.org/pub/satcat.csv';

function parseTLE(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const out: { name: string; noradId: number; l1: string; l2: string }[] = [];
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

function splitCSVLine(line: string) {
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
    } else cur += c;
  }
  result.push(cur);
  return result;
}

function parseSatcat(text: string): SatCatParse {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return { rows: [], keys: {} };
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = vals[idx] !== undefined ? vals[idx].trim() : ''));
    rows.push(obj);
  }
  function findKey(re: RegExp) {
    return headers.find((h) => re.test(h)) || null;
  }
  const keys = {
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
    orbit: findKey(/ORBIT_TYPE/i)
  };
  return { rows, keys };
}

function escapeHtml(s: string) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function loadData(group: string) {
  overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="ring"></div><div class="msg" id="overlayMsg">Fetching GP element set "${group}" from Celestrak…</div>`;
  setBadge('wait', 'connecting');

  try {
    const [tleText, satcatText] = await Promise.all([fetchText(gpUrl(group)), fetchText(SATCAT_URL)]);
    document.getElementById('overlayMsg')!.textContent = 'Parsing element sets and catalog records…';

    const tleEntries = parseTLE(tleText);
    if (tleEntries.length === 0) throw new Error('No TLE records parsed — Celestrak may have returned an empty or unexpected response.');

    const { rows: catRows, keys: catKeys } = parseSatcat(satcatText);
    const catByNorad = new Map<number, Record<string, string>>();
    if (catKeys.norad) {
      for (const row of catRows) {
        const id = parseInt(row[catKeys.norad], 10);
        if (!isNaN(id)) catByNorad.set(id, row);
      }
    }

    satellites = [];
    satIndex = new Map();
    for (const e of tleEntries) {
      let satrec: any;
      try {
        satrec = satellite.twoline2satrec(e.l1, e.l2);
      } catch {
        continue;
      }
      if (!satrec) continue;
      const cat = catByNorad.get(e.noradId) || null;
      let statusCode = '?';
      if (cat && catKeys.status) {
        const raw = (cat[catKeys.status] || '').trim();
        if (STATUS_INFO[raw as keyof typeof STATUS_INFO]) statusCode = raw;
      }
      const sat: SatRecord = {
        name: e.name,
        noradId: e.noradId,
        satrec,
        statusCode,
        cat,
        catKeys,
        lat: null,
        lon: null,
        alt: null,
        vel: null,
        valid: false
      };
      satellites.push(sat);
      satIndex.set(e.noradId, sat);
    }

    if (satellites.length === 0) throw new Error('Element sets were fetched but none could be propagated (no valid SGP4 records).');

    computePositions();
    buildLegend();
    applyFilters();
    renderResultsList();
    renderScene();

    setBadge('live', 'in orbit');
    statCount.textContent = satellites.length.toLocaleString();
    overlay.style.display = 'none';
  } catch (err: any) {
    showError(err, group);
  }
}

function showError(err: any, group: string) {
  setBadge('off', 'decayed');
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="err">
      <div style="color:var(--text); font-size:13px; font-weight:700; margin-bottom:6px;">Could not load live data</div>
      ${escapeHtml(err.message || String(err))}
      <br><br>
      This is usually a browser CORS/network restriction reaching <b>celestrak.org</b> from this page, not a problem with your request.
      Retry, try a different catalog, or paste data manually below (copy the raw text from the links in the footer).
    </div>
    <div class="fallback">
      <label>Paste TLE text (from the GP/elements link)</label>
      <textarea id="pasteTLE" placeholder="ISS (ZARYA)&#10;1 25544U ...&#10;2 25544 ..."></textarea>
      <label>Paste SATCAT CSV text (optional, for status colours)</label>
      <textarea id="pasteCSV" placeholder="OBJECT_NAME,OBJECT_ID,NORAD_CAT_ID,OPS_STATUS_CODE,..."></textarea>
      <div style="display:flex; gap:8px;">
        <button class="primary" id="pasteLoadBtn">Load pasted data</button>
        <button id="retryBtn">Retry fetch</button>
      </div>
    </div>
  `;
  (document.getElementById('retryBtn') as HTMLButtonElement).onclick = () => loadData(group);
  (document.getElementById('pasteLoadBtn') as HTMLButtonElement).onclick = () => {
    loadFromPasted(
      (document.getElementById('pasteTLE') as HTMLTextAreaElement).value,
      (document.getElementById('pasteCSV') as HTMLTextAreaElement).value
    );
  };
}

function loadFromPasted(tleText: string, csvText: string) {
  try {
    const tleEntries = parseTLE(tleText);
    if (tleEntries.length === 0) throw new Error('No valid TLE records found in pasted text.');
    let catByNorad = new Map<number, Record<string, string>>();
    let catKeys: Record<string, string | null> = {};
    if (csvText && csvText.trim().length) {
      const parsed = parseSatcat(csvText);
      catKeys = parsed.keys;
      if (catKeys.norad) {
        parsed.rows.forEach((row) => {
          const id = parseInt(row[catKeys.norad!], 10);
          if (!isNaN(id)) catByNorad.set(id, row);
        });
      }
    }
    satellites = [];
    satIndex = new Map();
    for (const e of tleEntries) {
      let satrec: any;
      try {
        satrec = satellite.twoline2satrec(e.l1, e.l2);
      } catch {
        continue;
      }
      if (!satrec) continue;
      const cat = catByNorad.get(e.noradId) || null;
      let statusCode = '?';
      if (cat && catKeys.status) {
        const raw = (cat[catKeys.status] || '').trim();
        if (STATUS_INFO[raw as keyof typeof STATUS_INFO]) statusCode = raw;
      }
      const sat: SatRecord = {
        name: e.name,
        noradId: e.noradId,
        satrec,
        statusCode,
        cat,
        catKeys,
        lat: null,
        lon: null,
        alt: null,
        vel: null,
        valid: false
      };
      satellites.push(sat);
      satIndex.set(e.noradId, sat);
    }
    if (satellites.length === 0) throw new Error('No satellites could be propagated from pasted data.');
    computePositions();
    buildLegend();
    applyFilters();
    renderResultsList();
    renderScene();
    setBadge('live', 'in orbit (manual)');
    statCount.textContent = satellites.length.toLocaleString();
    overlay.style.display = 'none';
  } catch (err: any) {
    alert('Could not parse pasted data: ' + err.message);
  }
}

function gstimeCompat(date: Date) {
  if (typeof satellite.gstime === 'function') {
    try {
      const g = satellite.gstime(date);
      if (typeof g === 'number' && !isNaN(g)) return g;
    } catch {}
  }
  if (typeof satellite.gstimeFromDate === 'function') {
    return satellite.gstimeFromDate(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }
  if (typeof satellite.gstimeFromJday === 'function') {
    const jd = date.getTime() / 86400000 + 2440587.5;
    return satellite.gstimeFromJday(jd);
  }
  throw new Error('No compatible gstime function in this satellite.js build');
}

function propagateCompat(satrec: any, date: Date) {
  try {
    const r = satellite.propagate(satrec, date);
    if (r && r.position !== undefined) return r;
  } catch {}
  return satellite.propagate(
    satrec,
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

function computePositions() {
  const now = new Date();
  const gmst = gstimeCompat(now);
  for (const sat of satellites) {
    try {
      const pv = propagateCompat(sat.satrec, now);
      if (!pv || !pv.position) {
        sat.valid = false;
        continue;
      }
      const gd = satellite.eciToGeodetic(pv.position, gmst);
      sat.lat = satellite.degreesLat(gd.latitude);
      sat.lon = satellite.degreesLong(gd.longitude);
      sat.alt = gd.height;
      const v = pv.velocity;
      sat.vel = v ? Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) : null;
      sat.valid = true;
    } catch {
      sat.valid = false;
    }
  }
  lastUpdateTime = now;
  statUpdated.textContent = now.toISOString().substr(11, 8) + 'Z';
}

function sunSubpoint(date: Date) {
  const rad = Math.PI / 180;
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = (((357.528 + 0.9856003 * n) % 360) * rad);
  const lambda = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  const epsilon = (23.439 - 0.0000004 * n) * rad;
  const lambdaRad = lambda * rad;
  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambdaRad), Math.cos(lambdaRad)) / rad;
  const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambdaRad)) / rad;
  const gmstDeg = (280.46061837 + 360.98564736629 * n) % 360;
  let lon = alpha - gmstDeg;
  lon = ((lon + 180) % 360 + 360) % 360 - 180;
  return { lat: delta, lon };
}

function computeNightMask(date: Date) {
  const sub = sunSubpoint(date);
  const rad = Math.PI / 180;
  const latRad0 = sub.lat * rad;
  const step = 4;
  const cells: Array<[number, number]> = [];
  for (let lat = -88; lat <= 88; lat += step) {
    for (let lon = -180; lon < 180; lon += step) {
      const dLon = (lon - sub.lon) * rad;
      const sinh =
        Math.sin(lat * rad) * Math.sin(latRad0) +
        Math.cos(lat * rad) * Math.cos(latRad0) * Math.cos(dLon);
      if (sinh < -0.02) cells.push([lon, lat]);
    }
  }
  return { sub, cells, step };
}

function applyFilters() {
  const q = (document.getElementById('searchInput') as HTMLInputElement).value.trim().toUpperCase();
  filtered = satellites.filter((s) => {
    if (!activeFilters.has(s.statusCode)) return false;
    if (q.length) {
      const idMatch = String(s.noradId).includes(q);
      const nameMatch = s.name.toUpperCase().includes(q);
      if (!idMatch && !nameMatch) return false;
    }
    return true;
  });
  statShown.textContent = filtered.length.toLocaleString();
  document.getElementById('resultCount')!.textContent = q.length ? `${filtered.length.toLocaleString()} match "${q}"` : '';
}

function renderResultsList() {
  const el = document.getElementById('resultsList') as HTMLDivElement;
  const q = (document.getElementById('searchInput') as HTMLInputElement).value.trim();
  if (!q.length) {
    el.innerHTML = '';
    return;
  }
  const subset = filtered.slice(0, 200);
  el.innerHTML =
    subset
      .map((s) => {
        const color = STATUS_HEX[s.statusCode];
        return `<div class="sat-row" data-id="${s.noradId}">
        <span class="swatch" style="background:${color}; display:inline-block; margin-right:6px;"></span>
        <span class="nm">${escapeHtml(s.name)}</span><br>
        <span class="id">#${s.noradId} · ${STATUS_INFO[s.statusCode as keyof typeof STATUS_INFO].label}</span>
      </div>`;
      })
      .join('') + (filtered.length > 200 ? `<div class="result-count">…and ${(filtered.length - 200).toLocaleString()} more. Narrow your search.</div>` : '');
  el.querySelectorAll('.sat-row').forEach((row) => {
    row.onclick = () => {
      const s = satIndex.get(parseInt((row as HTMLDivElement).dataset.id!, 10));
      if (s) openCardFor(s, null);
    };
  });
}

function buildLegend() {
  const counts: Record<string, number> = {};
  STATUS_ORDER.forEach((c) => (counts[c] = 0));
  satellites.forEach((s) => counts[s.statusCode]++);
  const el = document.getElementById('legendList') as HTMLDivElement;
  el.innerHTML = STATUS_ORDER.map((code) => {
    const info = STATUS_INFO[code];
    const color = STATUS_HEX[code];
    return `
      <label class="legend-row">
        <input type="checkbox" data-code="${code}" checked>
        <span class="swatch" style="background:${color}; box-shadow:0 0 6px ${color};"></span>
        <span class="legend-code">${code}</span>
        <span class="legend-label">${info.label}</span>
        <span class="legend-count">${counts[code].toLocaleString()}</span>
      </label>
      <span class="legend-desc">${info.desc}</span>`;
  }).join('');
  el.querySelectorAll('input[type=checkbox]').forEach((cb) => {
    cb.onchange = () => {
      const code = (cb as HTMLInputElement).dataset.code!;
      if ((cb as HTMLInputElement).checked) activeFilters.add(code);
      else activeFilters.delete(code);
      applyFilters();
      renderResultsList();
      renderScene();
    };
  });
}

document.getElementById('selectAllBtn')!.onclick = () => {
  STATUS_ORDER.forEach((c) => activeFilters.add(c));
  document.querySelectorAll('#legendList input[type=checkbox]').forEach((cb) => ((cb as HTMLInputElement).checked = true));
  applyFilters();
  renderResultsList();
  renderScene();
};

document.getElementById('selectNoneBtn')!.onclick = () => {
  activeFilters.clear();
  document.querySelectorAll('#legendList input[type=checkbox]').forEach((cb) => ((cb as HTMLInputElement).checked = false));
  applyFilters();
  renderResultsList();
  renderScene();
};

function wireCollapse(headId: string, bodyId: string) {
  const head = document.getElementById(headId)!;
  const body = document.getElementById(bodyId)!;
  head.addEventListener('click', () => {
    head.classList.toggle('collapsed');
    body.classList.toggle('hidden');
  });
}

wireCollapse('searchHead', 'searchBody');
wireCollapse('legendHead', 'legendBody');

function get(cat: Record<string, string>, catKeys: Record<string, string | null>, key: string) {
  return catKeys[key] ? cat[catKeys[key]!] || '—' : '—';
}

function positionCard(clickXY: { x: number; y: number } | null) {
  const cw = mapWrap.clientWidth;
  const ch = mapWrap.clientHeight;
  let x: number, y: number;
  if (clickXY) {
    x = clickXY.x + 16;
    y = clickXY.y;
  } else {
    const p = projectSelectedToScreen();
    if (p) {
      x = p[0] + 16;
      y = p[1] - 10;
    } else {
      x = 24;
      y = 24;
    }
  }
  const cardW = 280;
  const cardH = cardEl.offsetHeight || 300;
  if (x + cardW > cw - 12) x = x - cardW - 32;
  if (x < 12) x = 12;
  if (y + cardH > ch - 12) y = ch - cardH - 12;
  if (y < 12) y = 12;
  cardEl.style.left = x + 'px';
  cardEl.style.top = y + 'px';
}

function renderCardContent() {
  if (!selected) return;
  const s = selected;
  const info = STATUS_INFO[s.statusCode as keyof typeof STATUS_INFO];
  const color = STATUS_HEX[s.statusCode];
  const cat = s.cat || {};
  const k = s.catKeys || {};

  cardName.textContent = s.name;
  cardStatus.style.borderColor = color;
  cardStatus.style.color = color;
  cardStatus.innerHTML = `<span class="swatch" style="background:${color};"></span> ${s.statusCode} · ${info.label}`;

  cardBody.innerHTML = `
      <div class="kv">
        <div class="k">NORAD ID</div><div class="v">${s.noradId}</div>
        <div class="k">Int'l Designator</div><div class="v">${get(cat, k, 'objid')}</div>
        <div class="k">Object Type</div><div class="v">${get(cat, k, 'type')}</div>
        <div class="k">Owner/Operator</div><div class="v">${get(cat, k, 'owner')}</div>
        <div class="k">Launch Date</div><div class="v">${get(cat, k, 'launch')}</div>
        <div class="k">Launch Site</div><div class="v">${get(cat, k, 'site')}</div>
        <div class="k">Orbit Type</div><div class="v">${get(cat, k, 'orbit')}</div>
        <div class="k">RCS</div><div class="v">${get(cat, k, 'rcs')}</div>
        <div class="k">Period (min)</div><div class="v">${get(cat, k, 'period')}</div>
        <div class="k">Inclination °</div><div class="v">${get(cat, k, 'incl')}</div>
        <div class="k">Apogee (km)</div><div class="v">${get(cat, k, 'apogee')}</div>
        <div class="k">Perigee (km)</div><div class="v">${get(cat, k, 'perigee')}</div>
      </div>
      <hr>
      <div class="kv">
        <div class="k kv-full">Live orbital state (SGP4, now)</div>
        <div class="k">Latitude</div><div class="v">${s.valid ? s.lat!.toFixed(2) + '°' : '—'}</div>
        <div class="k">Longitude</div><div class="v">${s.valid ? s.lon!.toFixed(2) + '°' : '—'}</div>
        <div class="k">Altitude</div><div class="v">${s.valid ? s.alt!.toFixed(0) + ' km' : '—'}</div>
        <div class="k">Speed</div><div class="v">${s.valid && s.vel ? s.vel.toFixed(2) + ' km/s' : '—'}</div>
      </div>
    `;
}

function openCardFor(sat: SatRecord, clickXY: { x: number; y: number } | null) {
  selected = sat;
  renderCardContent();
  positionCard(clickXY);
  cardEl.style.display = 'block';
  renderScene();
}

(document.getElementById('cardClose') as HTMLButtonElement).onclick = () => {
  cardEl.style.display = 'none';
  selected = null;
  renderScene();
};

function renderScene() {
  if (currentView === '3d') updateGlobeScene();
  else renderScene2D();
}

function projectSelectedToScreen() {
  if (!selected) return null;
  if (currentView === '3d') return projectGlobeToScreen(selected);
  if (!selected.valid) return null;
  return project(selected.lon!, selected.lat!);
}

function resizeCanvas() {
  W = mapWrap.clientWidth;
  H = mapWrap.clientHeight;
  dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function project(lon: number, lat: number) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

let renderedPoints: Array<{ x: number; y: number; sat: SatRecord }> = [];

function renderScene2D() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#070B14';
  ctx.fillRect(0, 0, W, H);

  if (nightGrid) {
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    const cw = (nightGrid.step / 360) * W + 1;
    const ch = (nightGrid.step / 180) * H + 1;
    for (const [lon, lat] of nightGrid.cells) {
      const [x, y] = project(lon, lat);
      ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch);
    }
    const [sx, sy] = project(nightGrid.sub.lon, nightGrid.sub.lat);
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,214,110,0.9)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,214,110,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.strokeStyle = '#141E2E';
  ctx.lineWidth = 1;
  ctx.font = '9px ui-monospace, monospace';
  ctx.fillStyle = '#4A5568';
  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = project(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    if (lat !== 90) ctx.fillText(lat + '°', 4, y - 3);
  }
  ctx.strokeStyle = 'rgba(89,217,208,0.15)';
  [0, 23.4, -23.4, 66.6, -66.6].forEach((lat) => {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  });

  renderedPoints = [];
  for (const s of filtered) {
    if (!s.valid) continue;
    const [x, y] = project(s.lon!, s.lat!);
    const color = STATUS_HEX[s.statusCode];
    ctx.beginPath();
    ctx.arc(x, y, selected === s ? 3.2 : 1.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    renderedPoints.push({ x, y, sat: s });
  }

  if (selected && selected.valid) {
    const [x, y] = project(selected.lon!, selected.lat!);
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = STATUS_HEX[selected.statusCode];
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

const EARTH_R = 6.371;

let globeCanvas: HTMLCanvasElement;
let gScene: THREE.Scene;
let gCamera: THREE.PerspectiveCamera;
let gRenderer: THREE.WebGLRenderer;
let gEarthMesh: THREE.Mesh;
let gSunLight: THREE.DirectionalLight;
let gAmbient: THREE.AmbientLight;
let gSubsolarMesh: THREE.Mesh;
let gSelectionMesh: THREE.Mesh;
let gPointsObj: THREE.Points;
let gPointsSats: SatRecord[] = [];
let gRaycaster: THREE.Raycaster;
let gReady = false;
let gW = 0;
let gH = 0;
const gCam = { theta: 0.7, phi: 1.15, radius: 22, min: 7.5, max: 140 };
let gDragging = false;
let gDragStart: { x: number; y: number } | null = null;
let gDragMoved = 0;

function latLonAltToVec3(lat: number, lon: number, radiusUnits: number) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    radiusUnits * Math.cos(latRad) * Math.cos(lonRad),
    radiusUnits * Math.sin(latRad),
    -radiusUnits * Math.cos(latRad) * Math.sin(lonRad)
  );
}

function initGlobe() {
  if (gReady) return true;
  if (typeof THREE === 'undefined') return false;
  try {
    globeCanvas = document.getElementById('globe') as HTMLCanvasElement;
    gScene = new THREE.Scene();
    gCamera = new THREE.PerspectiveCamera(45, 1, 0.5, 1000);
    gRenderer = new THREE.WebGLRenderer({ canvas: globeCanvas, antialias: true, alpha: false });
    gRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const earthGeo = new THREE.SphereGeometry(EARTH_R, 56, 56);
    const earthMat = new THREE.MeshPhongMaterial({ color: 0x0b1a2e, shininess: 14, specular: 0x22485c });
    gEarthMesh = new THREE.Mesh(earthGeo, earthMat);
    gScene.add(gEarthMesh);

    const atmoGeo = new THREE.SphereGeometry(EARTH_R * 1.045, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x59d9d0, transparent: true, opacity: 0.07, side: THREE.BackSide });
    gScene.add(new THREE.Mesh(atmoGeo, atmoMat));

    const gridMat = new THREE.LineBasicMaterial({ color: 0x223247, transparent: true, opacity: 0.55 });
    const emphMat = new THREE.LineBasicMaterial({ color: 0x59d9d0, transparent: true, opacity: 0.18 });
    const gridR = EARTH_R * 1.002;
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 4) pts.push(latLonAltToVec3(lat, lon, gridR));
      gScene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 4) pts.push(latLonAltToVec3(lat, lon, gridR));
      gScene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    [[0, 'eq'], [23.4, ''], [-23.4, ''], [66.6, ''], [-66.6, '']].forEach(([lat]) => {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 4) pts.push(latLonAltToVec3(lat as number, lon, gridR * 1.001));
      gScene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), emphMat));
    });

    gAmbient = new THREE.AmbientLight(0x0c1522, 1.2);
    gScene.add(gAmbient);
    gSunLight = new THREE.DirectionalLight(0xfff2d0, 1.2);
    gScene.add(gSunLight);

    const subMat = new THREE.MeshBasicMaterial({ color: 0xffd66e });
    gSubsolarMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), subMat);
    gScene.add(gSubsolarMesh);

    const pMat = new THREE.PointsMaterial({ size: 0.32, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.95 });
    const pGeo = new THREE.BufferGeometry();
    gPointsObj = new THREE.Points(pGeo, pMat);
    gScene.add(gPointsObj);

    const selMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthTest: false });
    gSelectionMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), selMat);
    gSelectionMesh.visible = false;
    gScene.add(gSelectionMesh);

    gRaycaster = new THREE.Raycaster();
    gRaycaster.params.Points.threshold = 0.35;

    wireGlobeControls();
    gReady = true;
    return true;
  } catch (err) {
    console.error('3D globe init failed:', err);
    return false;
  }
}

function resizeGlobe() {
  if (!gReady) return;
  gW = mapWrap.clientWidth;
  gH = mapWrap.clientHeight;
  if (gW < 2 || gH < 2) return;
  gRenderer.setSize(gW, gH, false);
  gCamera.aspect = gW / gH;
  gCamera.updateProjectionMatrix();
}

function updateGlobeCameraPosition() {
  const c = gCam;
  gCamera.position.set(c.radius * Math.sin(c.phi) * Math.sin(c.theta), c.radius * Math.cos(c.phi), c.radius * Math.sin(c.phi) * Math.cos(c.theta));
  gCamera.lookAt(0, 0, 0);
}

function buildGlobePoints() {
  if (!gReady) return;
  const n = filtered.length;
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  gPointsSats = new Array(n);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const s = filtered[i];
    if (!s.valid) continue;
    const r = EARTH_R + s.alt! / 1000;
    const v = latLonAltToVec3(s.lat!, s.lon!, r);
    positions[idx * 3] = v.x;
    positions[idx * 3 + 1] = v.y;
    positions[idx * 3 + 2] = v.z;
    const c = new THREE.Color(STATUS_HEX[s.statusCode]);
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    gPointsSats[idx] = s;
    idx++;
  }
  gPointsSats.length = idx;
  gPointsObj.geometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, idx * 3), 3));
  gPointsObj.geometry.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, idx * 3), 3));
  gPointsObj.geometry.computeBoundingSphere();
}

function updateGlobeSun() {
  const sub = sunSubpoint(new Date());
  const dir = latLonAltToVec3(sub.lat, sub.lon, 1);
  gSunLight.position.copy(dir).multiplyScalar(150);
  gSubsolarMesh.position.copy(dir).multiplyScalar(EARTH_R + 0.6);
}

function updateGlobeSelection() {
  if (selected && selected.valid) {
    const r = EARTH_R + selected.alt! / 1000;
    gSelectionMesh.position.copy(latLonAltToVec3(selected.lat!, selected.lon!, r));
    gSelectionMesh.visible = true;
  } else {
    gSelectionMesh.visible = false;
  }
}

function updateGlobeScene() {
  if (!gReady) {
    if (!initGlobe()) return;
    resizeGlobe();
  }
  if (gW === 0) resizeGlobe();
  buildGlobePoints();
  updateGlobeSun();
  updateGlobeSelection();
  updateGlobeCameraPosition();
  gRenderer.render(gScene, gCamera);
}

function renderGlobeOnly() {
  if (!gReady) return;
  updateGlobeCameraPosition();
  gRenderer.render(gScene, gCamera);
}

function projectGlobeToScreen(sat: SatRecord) {
  if (!gReady || !sat.valid) return null;
  const r = EARTH_R + sat.alt! / 1000;
  const v = latLonAltToVec3(sat.lat!, sat.lon!, r);
  v.project(gCamera);
  if (v.z > 1) return null;
  return [(v.x * 0.5 + 0.5) * gW, (-v.y * 0.5 + 0.5) * gH];
}

function globeRaycastAt(mx: number, my: number) {
  if (!gReady || !gPointsSats.length) return null;
  const ndc = new THREE.Vector2((mx / gW) * 2 - 1, -(my / gH) * 2 + 1);
  gRaycaster.setFromCamera(ndc, gCamera);
  const hits = gRaycaster.intersectObject(gPointsObj);
  if (!hits.length) return null;
  const sat = gPointsSats[hits[0].index];
  return sat ? { sat } : null;
}

function wireGlobeControls() {
  const el = globeCanvas;

  el.addEventListener('mousedown', (e) => {
    gDragging = true;
    gDragMoved = 0;
    gDragStart = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', (e) => {
    if (!gDragging) return;
    gDragging = false;
    if (currentView === '3d' && gDragMoved < 5) {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = globeRaycastAt(mx, my);
      if (hit) openCardFor(hit.sat, { x: mx, y: my });
    }
  });

  el.addEventListener('mousemove', (e) => {
    if (gDragging && gDragStart) {
      const dx = e.clientX - gDragStart.x;
      const dy = e.clientY - gDragStart.y;
      gDragMoved += Math.abs(dx) + Math.abs(dy);
      gCam.theta -= dx * 0.006;
      gCam.phi = Math.max(0.15, Math.min(Math.PI - 0.15, gCam.phi - dy * 0.006));
      gDragStart = { x: e.clientX, y: e.clientY };
      renderGlobeOnly();
      return;
    }
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = globeRaycastAt(mx, my);
    if (hit) {
      tooltip.style.display = 'block';
      tooltip.style.left = mx + 16 + 'px';
      tooltip.style.top = my + 10 + 'px';
      tooltip.innerHTML = `<span class="tt-name">${escapeHtml(hit.sat.name)}</span><br>#${hit.sat.noradId} · ${STATUS_INFO[hit.sat.statusCode as keyof typeof STATUS_INFO].label}<br>${hit.sat.lat!.toFixed(1)}°, ${hit.sat.lon!.toFixed(1)}° · ${hit.sat.alt!.toFixed(0)} km`;
      el.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      el.style.cursor = 'grab';
    }
  });

  el.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  el.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      gCam.radius = Math.max(gCam.min, Math.min(gCam.max, gCam.radius * (1 + e.deltaY * 0.001)));
      renderGlobeOnly();
    },
    { passive: false }
  );
}

function setView(view: '2d' | '3d') {
  if (view === currentView) return;
  if (view === '3d') {
    canvas.style.display = 'none';
    globeCanvas = document.getElementById('globe') as HTMLCanvasElement;
    globeCanvas.style.display = 'block';
    globeHint.style.display = 'block';
    currentView = '3d';
    if (!initGlobe()) {
      globeCanvas.style.display = 'none';
      globeHint.style.display = 'none';
      canvas.style.display = 'block';
      currentView = '2d';
      alert('3D globe could not start (WebGL may be unavailable in this browser). Staying on the 2D map.');
      return;
    }
    resizeGlobe();
  } else {
    globeCanvas = document.getElementById('globe') as HTMLCanvasElement;
    globeCanvas.style.display = 'none';
    globeHint.style.display = 'none';
    canvas.style.display = 'block';
    currentView = '2d';
  }
  document.querySelectorAll('.vt-btn').forEach((b) => b.classList.toggle('active', (b as HTMLButtonElement).dataset.view === view));
  if (selected) positionCard(null);
  renderScene();
}

function nearest(mx: number, my: number, maxDist: number) {
  let best: { x: number; y: number; sat: SatRecord } | null = null;
  let bestD = maxDist * maxDist;
  for (const p of renderedPoints) {
    const dx = p.x - mx;
    const dy = p.y - my;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function initCanvasEvents() {
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = nearest(mx, my, 7);
    if (hit) {
      tooltip.style.display = 'block';
      tooltip.style.left = mx + 16 + 'px';
      tooltip.style.top = my + 10 + 'px';
      tooltip.innerHTML = `<span class="tt-name">${escapeHtml(hit.sat.name)}</span><br>#${hit.sat.noradId} · ${STATUS_INFO[hit.sat.statusCode as keyof typeof STATUS_INFO].label}<br>${hit.sat.lat!.toFixed(1)}°, ${hit.sat.lon!.toFixed(1)}° · ${hit.sat.alt!.toFixed(0)} km`;
      canvas.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      canvas.style.cursor = 'crosshair';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = nearest(mx, my, 9);
    if (hit) openCardFor(hit.sat, { x: mx, y: my });
  });
}

function tickClock() {
  document.getElementById('clock')!.textContent = new Date().toISOString().substr(11, 8) + 'Z';
}

function updateLoop() {
  if (satellites.length) {
    computePositions();
    if (selected) {
      renderCardContent();
      positionCard(null);
    }
    renderScene();
  }
}

function updateNight() {
  if (satellites.length) {
    nightGrid = computeNightMask(new Date());
    renderScene();
  }
}

function resizeCanvas() {
  W = mapWrap.clientWidth;
  H = mapWrap.clientHeight;
  dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderScene() {
  if (currentView === '3d') updateGlobeScene();
  else renderScene2D();
}

canvas = document.getElementById('map') as HTMLCanvasElement;
ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
resizeCanvas();
initCanvasEvents();

window.addEventListener('resize', () => {
  resizeCanvas();
  resizeGlobe();
  renderScene();
  if (selected) positionCard(null);
});

document.querySelectorAll('.vt-btn').forEach((btn) => {
  btn.addEventListener('click', () => setView((btn as HTMLButtonElement).dataset.view as '2d' | '3d'));
});

(document.getElementById('searchInput') as HTMLInputElement).addEventListener('input', () => {
  applyFilters();
  renderResultsList();
  renderScene();
});

document.getElementById('reloadBtn')!.addEventListener('click', () => {
  loadData((document.getElementById('groupSelect') as HTMLSelectElement).value);
});

document.getElementById('groupSelect')!.addEventListener('change', (e) => {
  cardEl.style.display = 'none';
  selected = null;
  loadData((e.target as HTMLSelectElement).value);
});

tickClock();
setInterval(tickClock, 1000);
setInterval(updateLoop, 2000);
setInterval(updateNight, 60000);

loadData('active').then(() => {
  nightGrid = computeNightMask(new Date());
  renderScene();
});
