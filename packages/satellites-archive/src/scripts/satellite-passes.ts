import * as satellite from 'satellite.js';
import { fetchText, gpUrl, parseTLE, parseSatcat, escapeHtml, SATCAT_URL } from './lib/celestrak';

const AU_KM = 149597870.7;
const MAX_SATS_SCANNED = 400; // performance guard for large catalogs

type SatEntry = {
  name: string;
  noradId: number;
  satrec: any;
  rcs: number | null;
};

type LookResult = { elDeg: number; azDeg: number; rangeKm: number; eci: { x: number; y: number; z: number } };

type Pass = {
  sat: SatEntry;
  aosTime: Date;
  aosAz: number;
  maxElTime: Date;
  maxEl: number;
  maxElAz: number;
  losTime: Date;
  losAz: number;
  durationSec: number;
  sunlit: boolean;
  sunElevDeg: number;
  magnitude: number | null;
  conditionLabel: 'dark sky' | 'twilight' | 'daylight' | 'in shadow';
  visible: boolean;
};

// ---------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------
let overlay: HTMLDivElement;
let statusBadge: HTMLSpanElement;
let statusBadgeText: HTMLSpanElement;
let statPasses: HTMLSpanElement;
let statVisible: HTMLSpanElement;
let statNext: HTMLSpanElement;
let statScanned: HTMLSpanElement;
let passListEl: HTMLDivElement;
let progressEl: HTMLDivElement;

let latInput: HTMLInputElement;
let lonInput: HTMLInputElement;
let altInput: HTMLInputElement;
let groupSelect: HTMLSelectElement;
let windowSelect: HTMLSelectElement;
let minElevSelect: HTMLSelectElement;
let visibleOnlyCheckbox: HTMLInputElement;

function setBadge(mode: string, text: string) {
  statusBadge.className = 'badge ' + mode;
  statusBadgeText.textContent = text;
}

// ---------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function compassPoint(azDeg: number): string {
  const idx = Math.round(((azDeg % 360) + 360) % 360 / 22.5) % 16;
  return COMPASS[idx];
}

function lookAt(satrec: any, obsGeodeticRad: any, date: Date): LookResult | null {
  const pv = satellite.propagate(satrec, date);
  if (!pv || !pv.position) return null;
  const gmst = satellite.gstime(date);
  const ecf = satellite.eciToEcf(pv.position as any, gmst);
  const look = satellite.ecfToLookAngles(obsGeodeticRad, ecf);
  return {
    elDeg: satellite.radiansToDegrees(look.elevation),
    azDeg: ((satellite.radiansToDegrees(look.azimuth) % 360) + 360) % 360,
    rangeKm: look.rangeSat,
    eci: pv.position as any,
  };
}

function sunGeometryAt(date: Date) {
  const jd = satellite.jday(date);
  const { rsun } = satellite.sunPos(jd); // AU, ECI
  const sunEciKm = { x: rsun.x * AU_KM, y: rsun.y * AU_KM, z: rsun.z * AU_KM };
  const gmst = satellite.gstime(date);
  return { rsunAU: rsun, sunEciKm, gmst };
}

function observerSunElevationDeg(obsGeodeticRad: any, sunEciKm: { x: number; y: number; z: number }, gmst: number): number {
  const sunEcf = satellite.eciToEcf(sunEciKm, gmst);
  const look = satellite.ecfToLookAngles(obsGeodeticRad, sunEcf);
  return satellite.radiansToDegrees(look.elevation);
}

/** Rough visual magnitude estimate. Not a precise photometric prediction —
 * real predictors use empirically observed per-satellite brightness, which
 * isn't available from Celestrak. This approximates size from SATCAT's RCS
 * (radar cross-section, a rough proxy at best) plus range and solar phase
 * angle using a standard diffuse-reflector phase function. */
function estimateMagnitude(rangeKm: number, phaseRad: number, rcsM2: number | null): number {
  const effectiveArea = rcsM2 && rcsM2 > 0 && isFinite(rcsM2) ? rcsM2 : 1;
  const baseline = -11.7 - 2.5 * Math.log10(effectiveArea);
  const phaseFactor = (Math.sin(phaseRad) + (Math.PI - phaseRad) * Math.cos(phaseRad)) / Math.PI;
  const safePhase = Math.max(phaseFactor, 1e-3);
  return baseline + 5 * Math.log10(rangeKm) - 2.5 * Math.log10(safePhase);
}

function evaluateVisibility(sat: SatEntry, obsGeodeticRad: any, date: Date, elDeg: number, rangeKm: number, eci: { x: number; y: number; z: number }) {
  const { rsunAU, sunEciKm, gmst } = sunGeometryAt(date);
  const shadow = satellite.shadowFraction(rsunAU, eci as any);
  const sunlit = shadow < 0.98;
  const sunElevDeg = observerSunElevationDeg(obsGeodeticRad, sunEciKm, gmst);

  let magnitude: number | null = null;
  if (sunlit) {
    const obsEcf = satellite.geodeticToEcf(obsGeodeticRad);
    const obsEci = satellite.ecfToEci(obsEcf, gmst);
    const toObs = { x: obsEci.x - eci.x, y: obsEci.y - eci.y, z: obsEci.z - eci.z };
    const toSun = { x: sunEciKm.x - eci.x, y: sunEciKm.y - eci.y, z: sunEciKm.z - eci.z };
    const dot = toObs.x * toSun.x + toObs.y * toSun.y + toObs.z * toSun.z;
    const magObs = Math.hypot(toObs.x, toObs.y, toObs.z);
    const magSun = Math.hypot(toSun.x, toSun.y, toSun.z);
    const cosPhase = Math.min(1, Math.max(-1, dot / (magObs * magSun)));
    const phaseRad = Math.acos(cosPhase);
    magnitude = estimateMagnitude(rangeKm, phaseRad, sat.rcs);
  }

  let conditionLabel: Pass['conditionLabel'];
  if (!sunlit) conditionLabel = 'in shadow';
  else if (sunElevDeg >= 0) conditionLabel = 'daylight';
  else if (sunElevDeg >= -6) conditionLabel = 'twilight';
  else conditionLabel = 'dark sky';

  const visible = sunlit && sunElevDeg < -6 && elDeg >= 0;

  return { sunlit, sunElevDeg, magnitude, conditionLabel, visible };
}

// ---------------------------------------------------------------
// Pass finding (coarse scan + bisection refinement at crossings)
// ---------------------------------------------------------------
function bisectCrossing(
  satrec: any,
  obsGeodeticRad: any,
  loTime: Date,
  hiTime: Date,
  minElevDeg: number,
  rising: boolean,
  iterations = 10
): { time: Date; azDeg: number } {
  let lo = loTime.getTime();
  let hi = hiTime.getTime();
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const r = lookAt(satrec, obsGeodeticRad, new Date(mid));
    const el = r ? r.elDeg : -90;
    const above = el >= minElevDeg;
    if (rising) {
      if (above) hi = mid;
      else lo = mid;
    } else {
      if (above) lo = mid;
      else hi = mid;
    }
  }
  const finalMs = rising ? hi : lo;
  const r = lookAt(satrec, obsGeodeticRad, new Date(finalMs));
  return { time: new Date(finalMs), azDeg: r ? r.azDeg : 0 };
}

function findPasses(sat: SatEntry, obsGeodeticRad: any, startDate: Date, endDate: Date, coarseStepSec: number, minElevDeg: number): Pass[] {
  const passes: Pass[] = [];
  let prevTime = startDate;
  let prevLook = lookAt(sat.satrec, obsGeodeticRad, startDate);
  let prevEl = prevLook ? prevLook.elDeg : -90;

  let current: { aosTime: Date; aosAz: number; maxEl: number; maxElTime: Date; maxElAz: number } | null = null;

  const endMs = endDate.getTime();
  for (let t = startDate.getTime() + coarseStepSec * 1000; t <= endMs; t += coarseStepSec * 1000) {
    const date = new Date(t);
    const look = lookAt(sat.satrec, obsGeodeticRad, date);
    const curEl = look ? look.elDeg : -90;
    const curAz = look ? look.azDeg : 0;

    if (prevEl < minElevDeg && curEl >= minElevDeg) {
      const cross = bisectCrossing(sat.satrec, obsGeodeticRad, prevTime, date, minElevDeg, true);
      current = { aosTime: cross.time, aosAz: cross.azDeg, maxEl: curEl, maxElTime: date, maxElAz: curAz };
    } else if (current && curEl > current.maxEl) {
      current.maxEl = curEl;
      current.maxElTime = date;
      current.maxElAz = curAz;
    }

    if (current && prevEl >= minElevDeg && curEl < minElevDeg) {
      const cross = bisectCrossing(sat.satrec, obsGeodeticRad, prevTime, date, minElevDeg, false);
      const durationSec = (cross.time.getTime() - current.aosTime.getTime()) / 1000;
      if (durationSec > 0) {
        const maxLook = lookAt(sat.satrec, obsGeodeticRad, current.maxElTime);
        const rangeAtMax = maxLook ? maxLook.rangeKm : 0;
        const eciAtMax = maxLook ? maxLook.eci : { x: 0, y: 0, z: 0 };
        const vis = evaluateVisibility(sat, obsGeodeticRad, current.maxElTime, current.maxEl, rangeAtMax, eciAtMax);
        passes.push({
          sat,
          aosTime: current.aosTime,
          aosAz: current.aosAz,
          maxElTime: current.maxElTime,
          maxEl: current.maxEl,
          maxElAz: current.maxElAz,
          losTime: cross.time,
          losAz: cross.azDeg,
          durationSec,
          ...vis,
        });
      }
      current = null;
    }

    prevTime = date;
    prevEl = curEl;
  }

  return passes;
}

// ---------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------
function fmtTime(d: Date) {
  return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}
function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
function conditionBadgeClass(label: Pass['conditionLabel']) {
  switch (label) {
    case 'dark sky':
      return 'live';
    case 'twilight':
      return 'wait';
    case 'daylight':
      return 'dim';
    case 'in shadow':
      return 'info';
  }
}

function renderPasses(passes: Pass[]) {
  if (passes.length === 0) {
    passListEl.innerHTML = `<div class="empty-state">No passes found for the selected window, catalog and minimum elevation. Try lowering the minimum elevation or widening the time window.</div>`;
    return;
  }

  passListEl.innerHTML = passes
    .map((p) => {
      const condClass = conditionBadgeClass(p.conditionLabel);
      const magText = p.magnitude !== null ? `mag ${p.magnitude.toFixed(1)}` : 'n/a';
      return `<div class="pass-card">
        <div class="pass-card-top">
          <span class="pass-card-name">${escapeHtml(p.sat.name)}</span>
          <span class="badge ${condClass}"><span class="bdot"></span><span>${p.conditionLabel}${p.visible ? ' · visible' : ''}</span></span>
        </div>
        <div class="pass-grid">
          <div class="pass-point">
            <div class="pp-label">AOS (rise)</div>
            <div class="pp-time">${fmtTime(p.aosTime)}</div>
            <div class="pp-detail">${p.aosAz.toFixed(0)}° ${compassPoint(p.aosAz)}</div>
          </div>
          <div class="pass-point">
            <div class="pp-label">Max elevation</div>
            <div class="pp-time">${fmtTime(p.maxElTime)}</div>
            <div class="pp-detail">${p.maxEl.toFixed(0)}° up · ${p.maxElAz.toFixed(0)}° ${compassPoint(p.maxElAz)}</div>
          </div>
          <div class="pass-point">
            <div class="pp-label">LOS (set)</div>
            <div class="pp-time">${fmtTime(p.losTime)}</div>
            <div class="pp-detail">${p.losAz.toFixed(0)}° ${compassPoint(p.losAz)}</div>
          </div>
        </div>
        <div class="pass-footer">
          <span class="pf-item"><span class="pf-label">Duration</span><span class="pf-val">${fmtDuration(p.durationSec)}</span></span>
          <span class="pf-item"><span class="pf-label">Est. brightness</span><span class="pf-val">${magText}</span></span>
          <span class="pf-item"><span class="pf-label">Sun elevation</span><span class="pf-val">${p.sunElevDeg.toFixed(0)}°</span></span>
          <span class="pf-item"><span class="pf-label">NORAD</span><span class="pf-val">#${p.sat.noradId}</span></span>
        </div>
      </div>`;
    })
    .join('');
}

function updateStatBar(passes: Pass[], scanned: number) {
  statPasses.textContent = passes.length.toLocaleString();
  const visibleCount = passes.filter((p) => p.visible).length;
  statVisible.textContent = visibleCount.toLocaleString();
  statScanned.textContent = scanned.toLocaleString();
  const now = Date.now();
  const upcoming = passes.filter((p) => p.aosTime.getTime() >= now).sort((a, b) => a.aosTime.getTime() - b.aosTime.getTime());
  statNext.textContent = upcoming.length ? fmtTime(upcoming[0].aosTime) : '–';
}

// ---------------------------------------------------------------
// Main run
// ---------------------------------------------------------------
async function run() {
  const lat = parseFloat(latInput.value);
  const lon = parseFloat(lonInput.value);
  const altM = parseFloat(altInput.value) || 0;

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    alert('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
    return;
  }

  const windowHours = parseInt(windowSelect.value, 10);
  const minElevDeg = parseInt(minElevSelect.value, 10);
  const group = groupSelect.value;
  const visibleOnly = visibleOnlyCheckbox.checked;

  overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="ring"></div><div class="msg" id="overlayMsg">Fetching "${group}" element set from Celestrak…</div>`;
  setBadge('wait', 'connecting');
  passListEl.innerHTML = '';

  try {
    const [tleText, satcatText] = await Promise.all([fetchText(gpUrl(group)), fetchText(SATCAT_URL)]);

    const tleEntries = parseTLE(tleText);
    if (tleEntries.length === 0) throw new Error('No TLE records parsed from Celestrak.');

    const { rows: catRows, keys: catKeys } = parseSatcat(satcatText);
    const rcsByNorad = new Map<number, number>();
    if (catKeys.norad && catKeys.rcs) {
      for (const row of catRows) {
        const id = parseInt(row[catKeys.norad], 10);
        const rcs = parseFloat(row[catKeys.rcs]);
        if (!isNaN(id) && !isNaN(rcs) && rcs > 0) rcsByNorad.set(id, rcs);
      }
    }

    const truncated = tleEntries.length > MAX_SATS_SCANNED;
    const entries = truncated ? tleEntries.slice(0, MAX_SATS_SCANNED) : tleEntries;

    const sats: SatEntry[] = [];
    for (const e of entries) {
      try {
        const satrec = satellite.twoline2satrec(e.l1, e.l2);
        if (!satrec) continue;
        sats.push({ name: e.name, noradId: e.noradId, satrec, rcs: rcsByNorad.get(e.noradId) ?? null });
      } catch {
        // skip unparsable element sets
      }
    }
    if (sats.length === 0) throw new Error('No satellites could be propagated from this catalog.');

    const obsGeodeticRad = {
      latitude: satellite.degreesToRadians(lat),
      longitude: satellite.degreesToRadians(lon),
      height: altM / 1000,
    };

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + windowHours * 3600 * 1000);
    const coarseStepSec = 30;

    overlay.innerHTML = `<div class="ring"></div><div class="msg" id="overlayMsg">Scanning ${sats.length.toLocaleString()} satellites over ${windowHours}h…</div><div class="pass-progress" id="scanProgress">0 / ${sats.length}</div>`;
    const progress = document.getElementById('scanProgress') as HTMLDivElement;

    let allPasses: Pass[] = [];
    for (let i = 0; i < sats.length; i++) {
      const passes = findPasses(sats[i], obsGeodeticRad, startDate, endDate, coarseStepSec, minElevDeg);
      allPasses = allPasses.concat(passes);
      if (i % 15 === 0) {
        if (progress) progress.textContent = `${i} / ${sats.length}`;
        await new Promise((r) => setTimeout(r, 0)); // yield to keep the UI responsive
      }
    }

    allPasses.sort((a, b) => a.aosTime.getTime() - b.aosTime.getTime());
    const shown = visibleOnly ? allPasses.filter((p) => p.visible) : allPasses;

    updateStatBar(shown, sats.length);
    renderPasses(shown);

    setBadge('live', truncated ? `showing first ${sats.length}` : 'in orbit');
    overlay.style.display = 'none';
  } catch (err: any) {
    setBadge('off', 'decayed');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="err">
        <div style="color:var(--text); font-size:13px; font-weight:700; margin-bottom:6px;">Could not predict passes</div>
        ${escapeHtml(err.message || String(err))}
        <br><br>
        This is usually a browser CORS/network restriction reaching <b>celestrak.org</b>, not a problem with your request.
      </div>
      <button id="retryBtn">Retry</button>
    `;
    (document.getElementById('retryBtn') as HTMLButtonElement).onclick = () => run();
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not available in this browser.');
    return;
  }
  const btn = document.getElementById('locateBtn') as HTMLButtonElement;
  const original = btn.textContent;
  btn.textContent = 'Locating…';
  btn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      latInput.value = pos.coords.latitude.toFixed(4);
      lonInput.value = pos.coords.longitude.toFixed(4);
      if (pos.coords.altitude) altInput.value = Math.round(pos.coords.altitude).toString();
      btn.textContent = original;
      btn.disabled = false;
      run();
    },
    (err) => {
      alert('Could not get your location: ' + err.message);
      btn.textContent = original;
      btn.disabled = false;
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

function mount() {
  overlay = document.getElementById('overlay') as HTMLDivElement;
  statusBadge = document.getElementById('statusBadge') as HTMLSpanElement;
  statusBadgeText = document.getElementById('statusBadgeText') as HTMLSpanElement;
  statPasses = document.getElementById('statPasses') as HTMLSpanElement;
  statVisible = document.getElementById('statVisible') as HTMLSpanElement;
  statNext = document.getElementById('statNext') as HTMLSpanElement;
  statScanned = document.getElementById('statScanned') as HTMLSpanElement;
  passListEl = document.getElementById('passList') as HTMLDivElement;

  latInput = document.getElementById('latInput') as HTMLInputElement;
  lonInput = document.getElementById('lonInput') as HTMLInputElement;
  altInput = document.getElementById('altInput') as HTMLInputElement;
  groupSelect = document.getElementById('groupSelect') as HTMLSelectElement;
  windowSelect = document.getElementById('windowSelect') as HTMLSelectElement;
  minElevSelect = document.getElementById('minElevSelect') as HTMLSelectElement;
  visibleOnlyCheckbox = document.getElementById('visibleOnlyCheckbox') as HTMLInputElement;

  (document.getElementById('locateBtn') as HTMLButtonElement).addEventListener('click', useMyLocation);
  (document.getElementById('predictBtn') as HTMLButtonElement).addEventListener('click', run);

  overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="msg">Enter a location (or use "My location") and press Predict Passes.</div>`;
  setBadge('wait', 'pre-launch');
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', mount);
}
