// Turns raw observations + raw model output into the compact JSON the app reads.

export const FIELDS = ['temp', 'summerTemp', 'rain', 'growRain', 'tmax', 'tmin', 'winRain', 'sumRain', 'frost'];
const RATIO = new Set(['rain', 'growRain', 'winRain', 'sumRain']); // adjusted by ratio; the rest by difference

const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
};

/** Merge the Met Office series into one row per year. Missing series simply leave nulls. */
export function buildObservations({ tmean = new Map(), rain = new Map(), tmax = new Map(), tmin = new Map(), frost = new Map() }) {
  const years = [...new Set([...tmean.keys(), ...rain.keys(), ...tmax.keys(), ...tmin.keys(), ...frost.keys()])].sort((a, b) => a - b);
  return years.map((year) => {
    const t = tmean.get(year);
    const r = rain.get(year);
    // April–September rainfall (monthly indexes 3..8) = "growing season"
    const grow = r && r.months.slice(3, 9).every((v) => v != null) ? r.months.slice(3, 9).reduce((s, v) => s + v, 0) : null;
    return {
      year,
      temp: round(t?.ann),
      summerTemp: round(t?.sum),
      rain: round(r?.ann, 1),
      growRain: round(grow, 1),
      tmax: round(tmax.get(year)?.ann),
      tmin: round(tmin.get(year)?.ann),
      winRain: round(r?.win, 1), // Dec of the previous year to Feb
      sumRain: round(r?.sum, 1),
      frost: round(frost.get(year)?.ann, 1),
    };
  });
}

/** Mean of each field over [from, to]; null if fewer than 80% of years have data. */
export function periodMeans(rows, from, to) {
  const sel = rows.filter((r) => r.year >= from && r.year <= to);
  const out = {};
  for (const f of FIELDS) {
    const vals = sel.map((r) => r[f]).filter((v) => v != null);
    out[f] = vals.length >= 0.8 * (to - from + 1) ? mean(vals) : null;
  }
  return out;
}

/** Reference period used for anomalies and for standardising dryness. */
export function referenceStats(rows, from = 1961, to = 1990) {
  const m = periodMeans(rows, from, to);
  const grow = rows.filter((r) => r.year >= from && r.year <= to && r.growRain != null).map((r) => r.growRain);
  const rounded = Object.fromEntries(Object.entries(m).map(([k, v]) => [k, round(v, 2)]));
  return { period: [from, to], ...rounded, growRainSd: round(sd(grow), 2) };
}

/** Daily Open-Meteo Climate API response -> { modelId: [yearly rows] } */
export function summariseModels(daily) {
  const models = {};
  for (const key of Object.keys(daily)) {
    const m = key.match(/^temperature_2m_mean(?:_(.+))?$/);
    if (!m) continue;
    const sfx = m[1] ? `_${m[1]}` : '';
    const series = {
      t: daily[key],
      tx: daily[`temperature_2m_max${sfx}`],
      tn: daily[`temperature_2m_min${sfx}`],
      p: daily[`precipitation_sum${sfx}`],
    };
    if (!series.p) continue;
    models[m[1] ?? 'model'] = annualise(daily.time, series);
  }
  return models;
}

function annualise(time, s) {
  const by = new Map();
  const win = new Map(); // winter belongs to the year of its January/February
  const bucket = (map, y, init) => { if (!map.has(y)) map.set(y, init()); return map.get(y); };

  time.forEach((d, i) => {
    const t = s.t[i];
    const p = s.p[i];
    if (t == null || p == null) return;
    const y = Number(d.slice(0, 4));
    const mo = Number(d.slice(5, 7));
    const o = bucket(by, y, () => ({ n: 0, t: 0, p: 0, sn: 0, st: 0, sp: 0, gn: 0, gp: 0, xn: 0, x: 0, mn: 0, nn: 0, fz: 0 }));
    o.n++; o.t += t; o.p += p;
    if (mo >= 6 && mo <= 8) { o.sn++; o.st += t; o.sp += p; }
    if (mo >= 4 && mo <= 9) { o.gn++; o.gp += p; }
    const tx = s.tx?.[i];
    const tn = s.tn?.[i];
    if (tx != null) { o.xn++; o.x += tx; }
    if (tn != null) { o.nn++; o.mn += tn; if (tn < 0) o.fz++; }
    if (mo === 12 || mo <= 2) {
      const w = bucket(win, mo === 12 ? y + 1 : y, () => ({ n: 0, p: 0 }));
      w.n++; w.p += p;
    }
  });

  const rows = [];
  for (const [year, o] of by) {
    if (o.n < 350 || o.sn < 88 || o.gn < 180) continue; // incomplete year
    const w = win.get(year);
    rows.push({
      year,
      temp: o.t / o.n,
      summerTemp: o.st / o.sn,
      rain: (o.p / o.n) * 365.25, // normalises 360/365/366-day model calendars
      growRain: (o.gp / o.gn) * 183,
      tmax: o.xn >= 350 ? o.x / o.xn : null,
      tmin: o.nn >= 350 ? o.mn / o.nn : null,
      winRain: w && w.n >= 85 ? (w.p / w.n) * 90.25 : null,
      sumRain: (o.sp / o.sn) * 92,
      frost: o.nn >= 350 ? (o.fz / o.nn) * 365.25 : null,
    });
  }
  return rows.sort((a, b) => a.year - b.year);
}

/**
 * Delta-change bias adjustment, per model and per variable:
 *   temperatures and frost days: observed 1991–2020 mean + (model value - model 1991–2020 mean)
 *   rainfall:                    observed 1991–2020 mean x (model value / model 1991–2020 mean)
 * Variables with no observed baseline are left out. Only years after the last observed year are returned.
 */
export function adjustModels(models, obsBase, lastObsYear) {
  const cols = FIELDS.filter((f) => obsBase[f] != null);
  const rows = [];
  for (const [id, series] of Object.entries(models)) {
    const base = series.filter((r) => r.year >= 1991 && r.year <= 2020);
    if (base.length < 25) continue;
    const mb = {};
    for (const f of cols) {
      const vals = base.map((r) => r[f]).filter((v) => v != null);
      mb[f] = vals.length >= 25 ? mean(vals) : null;
    }
    const usable = cols.filter((f) => mb[f] != null);
    for (const r of series) {
      if (r.year <= lastObsYear) continue;
      rows.push([id, r.year, ...cols.map((f) => {
        if (!usable.includes(f) || r[f] == null) return null;
        if (RATIO.has(f)) return round(obsBase[f] * (r[f] / mb[f]), 1);
        const v = obsBase[f] + (r[f] - mb[f]);
        return round(f === 'frost' ? Math.max(0, v) : v, f === 'frost' ? 1 : 2);
      })]);
    }
  }
  return { cols, rows };
}
