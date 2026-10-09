// Turns the JSON written by scripts/fetch-data.mjs into lookups the UI can use.

export const METRICS = {
  temp: { key: 'temp', label: 'Annual mean temperature', unit: '°C', digits: 1 },
  summer: { key: 'summerTemp', label: 'Summer mean temperature (Jun–Aug)', unit: '°C', digits: 1 },
  rain: { key: 'rain', label: 'Annual rainfall', unit: 'mm', digits: 0 },
  dry: { key: 'dry', label: 'Growing-season dryness (Apr–Sep)', unit: 'σ', digits: 1 },
  tmax: { key: 'tmax', label: 'Daytime high (annual mean of daily maximum)', unit: '°C', digits: 1 },
  tmin: { key: 'tmin', label: 'Night-time low (annual mean of daily minimum)', unit: '°C', digits: 1 },
  winRain: { key: 'winRain', label: 'Winter rainfall (Dec–Feb)', unit: 'mm', digits: 0 },
  sumRain: { key: 'sumRain', label: 'Summer rainfall (Jun–Aug)', unit: 'mm', digits: 0 },
  frost: { key: 'frost', label: 'Days of air frost per year', unit: 'days', digits: 0 },
};

export function prepare(data) {
  const { ref, observations, projections } = data;
  const dryOf = (g) => (g == null ? null : -(g - ref.growRain) / ref.growRainSd);

  const obs = new Map();
  for (const r of observations) obs.set(r.year, { ...r, dry: dryOf(r.growRain) });

  const proj = new Map();
  const cols = projections.cols;
  for (const row of projections.rows) {
    const [model, year] = row;
    const rec = { model };
    cols.forEach((c, i) => { rec[c] = row[2 + i]; });
    rec.dry = dryOf(rec.growRain);
    if (!proj.has(year)) proj.set(year, []);
    proj.get(year).push(rec);
  }

  const obsYears = observations.filter((r) => r.temp != null).map((r) => r.year);
  const firstYear = Math.min(...obsYears);
  const lastObs = data.lastObsYear;
  const lastYear = Math.max(lastObs, ...proj.keys());
  return { ref, obs, proj, firstYear, lastObs, lastYear, models: projections.models, location: data.location, generated: data.generated };
}

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

/** First year with a measured value for this field (frost days start in 1961, for example). */
export function firstYearWith(P, field) {
  for (let y = P.firstYear; y <= P.lastObs; y++) if (obsValue(P, y, field) != null) return y;
  return null;
}

export function hasField(P, field) {
  return firstYearWith(P, field) != null;
}

export function obsValue(P, year, field) {
  return P.obs.get(year)?.[field] ?? null;
}

export function projStats(P, year, field) {
  const rows = P.proj.get(year);
  if (!rows) return null;
  const vals = rows.map((r) => r[field]).filter((v) => v != null);
  if (!vals.length) return null;
  return { mean: mean(vals), min: Math.min(...vals), max: Math.max(...vals), n: vals.length, vals };
}

/** The value the slider shows for a year: measured if we have it, otherwise the model mean. */
export function valueFor(P, year, field) {
  if (year <= P.lastObs) return obsValue(P, year, field);
  return projStats(P, year, field)?.mean ?? null;
}

export function chartRows(P, field) {
  const rows = [];
  for (let y = P.firstYear; y <= P.lastYear; y++) {
    const o = y <= P.lastObs ? obsValue(P, y, field) : null;
    const ps = y > P.lastObs ? projStats(P, y, field) : null;
    let roll = null;
    if (y <= P.lastObs && y - P.firstYear >= 9) {
      const w = [];
      for (let k = y - 9; k <= y; k++) { const v = obsValue(P, k, field); if (v != null) w.push(v); }
      if (w.length >= 8) roll = mean(w);
    }
    rows.push({
      year: y,
      obs: o,
      roll,
      proj: ps ? ps.mean : y === P.lastObs ? o : null,
      band: ps ? [ps.min, ps.max] : null,
    });
  }
  return rows;
}

/** Warming-stripes colour for a temperature anomaly against the 1961–1990 reference. */
const STOPS = [
  [-1.6, [38, 82, 140]],
  [-0.8, [121, 159, 196]],
  [-0.2, [214, 226, 236]],
  [0.2, [244, 224, 214]],
  [0.8, [230, 154, 130]],
  [1.4, [190, 62, 58]],
  [2.2, [114, 14, 36]],
];
export function stripeColor(anom) {
  if (anom == null) return '#d9dfdc';
  if (anom <= STOPS[0][0]) return `rgb(${STOPS[0][1].join(',')})`;
  for (let i = 1; i < STOPS.length; i++) {
    const [a1, c1] = STOPS[i];
    if (anom <= a1) {
      const [a0, c0] = STOPS[i - 1];
      const f = (anom - a0) / (a1 - a0);
      return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * f)).join(',')})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1][1].join(',')})`;
}

export function stripeAnomaly(P, year) {
  const v = valueFor(P, year, 'temp');
  return v == null ? null : v - P.ref.temp;
}

export function rankOf(P, field, year, descending = true) {
  const vals = [...P.obs.values()].map((r) => r[field]).filter((v) => v != null);
  const v = obsValue(P, year, field);
  if (v == null) return null;
  const better = vals.filter((x) => (descending ? x > v : x < v)).length;
  return { rank: better + 1, of: vals.length };
}

export function quantile(vals, q) {
  const s = [...vals].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
}
