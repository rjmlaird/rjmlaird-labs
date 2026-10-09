import { obsValue, projStats, rankOf, quantile } from './climate.js';

const ord = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const sign = (v, d = 1) => {
  const t = Math.abs(v).toFixed(d);
  return Number(t) === 0 ? t : `${v >= 0 ? '+' : '−'}${t}`;
};
const pct = (v) => `${Math.round(v * 100)}%`;

function dryPhrase(z) {
  if (z >= 1.5) return 'a very dry growing season (April–September)';
  if (z >= 0.75) return 'a drier-than-usual growing season (April–September)';
  if (z <= -1.5) return 'a very wet growing season (April–September)';
  if (z <= -0.75) return 'a wetter-than-usual growing season (April–September)';
  return 'a growing season (April–September) close to the 1961–1990 norm';
}

/** Plain-English sentences for the selected year. Everything here is computed from the data. */
export function describe(P, year) {
  const place = P.location.name;
  const lines = [];

  if (year <= P.lastObs) {
    const o = P.obs.get(year);
    if (o?.temp != null) {
      const a = o.temp - P.ref.temp;
      const r = rankOf(P, 'temp', year);
      const rankText = r.rank === 1 ? 'the warmest year in the record' : r.rank === r.of ? 'the coldest year in the record' : `the ${ord(r.rank)} warmest of ${r.of} years on record`;
      lines.push(`${year} averaged ${o.temp.toFixed(1)} °C in the ${place}, ${sign(a)} °C against the 1961–1990 average. That is ${rankText}.`);
    }
    if (o?.summerTemp != null) {
      const a = o.summerTemp - P.ref.summerTemp;
      lines.push(`Summer averaged ${o.summerTemp.toFixed(1)} °C (${sign(a)} °C).`);
    }
    if (o?.rain != null) {
      const d = o.rain / P.ref.rain - 1;
      const r = rankOf(P, 'rain', year);
      lines.push(`Rainfall totalled ${Math.round(o.rain)} mm, ${Math.abs(Math.round(d * 100))}% ${d >= 0 ? 'above' : 'below'} average (${ord(r.rank)} wettest of ${r.of} years).`);
    }
    if (o?.winRain != null && o?.sumRain != null && P.ref.winRain && P.ref.sumRain) {
      const w = o.winRain / P.ref.winRain - 1;
      const su = o.sumRain / P.ref.sumRain - 1;
      lines.push(`Winter rain was ${Math.abs(Math.round(w * 100))}% ${w >= 0 ? 'above' : 'below'} average and summer rain ${Math.abs(Math.round(su * 100))}% ${su >= 0 ? 'above' : 'below'}.`);
    }
    if (o?.dry != null) lines.push(`That year had ${dryPhrase(o.dry)}.`);
    if (o?.tmax != null && o?.tmin != null && P.ref.tmax != null && P.ref.tmin != null) {
      lines.push(`Days averaged ${sign(o.tmax - P.ref.tmax)} °C and nights ${sign(o.tmin - P.ref.tmin)} °C against 1961–1990.`);
    }
    if (o?.frost != null && P.ref.frost != null) {
      lines.push(`There were ${Math.round(o.frost)} days of air frost, against an average of ${Math.round(P.ref.frost)}.`);
    }
    return { kind: 'measured', lines };
  }

  const ps = projStats(P, year, 'temp');
  if (!ps) return { kind: 'projected', lines: ['No model data for this year.'] };
  const a = ps.mean - P.ref.temp;
  lines.push(`Around ${year}, the models average ${ps.mean.toFixed(1)} °C a year in the ${place}, ${sign(a)} °C against 1961–1990. Individual model-years range from ${ps.min.toFixed(1)} to ${ps.max.toFixed(1)} °C.`);

  const lo = Math.max(P.lastObs + 1, year - 5);
  const hi = Math.min(P.lastYear, year + 5);
  const windowVals = (field) => {
    const out = [];
    for (let y = lo; y <= hi; y++) out.push(...(P.proj.get(y) ?? []).map((r) => r[field]).filter((v) => v != null));
    return out;
  };

  // Frequency of a hot summer, benchmarked on 2022 when it is in the record.
  const bench = obsValue(P, 2022, 'summerTemp');
  if (bench != null) {
    const sv = windowVals('summerTemp');
    let base = 0, n = 0;
    for (let y = 1991; y <= 2020; y++) { const v = obsValue(P, y, 'summerTemp'); if (v != null) { n++; if (v >= bench) base++; } }
    if (sv.length) {
      const share = sv.filter((v) => v >= bench).length / sv.length;
      lines.push(`Summers as warm as 2022 (${bench.toFixed(1)} °C) show up in about ${pct(share)} of model-summers between ${lo} and ${hi}, compared with ${base} of the ${n} summers from 1991 to 2020.`);
    }
  }

  const obsRecent = [];
  for (let y = 1991; y <= 2020; y++) { const v = obsValue(P, y, 'temp'); if (v != null) obsRecent.push(v); }
  if (obsRecent.length >= 25) {
    const thr = quantile(obsRecent, 0.9);
    const tv = windowVals('temp');
    if (tv.length) lines.push(`A year as warm as the hottest 1-in-10 of 1991–2020 (${thr.toFixed(1)} °C or more) happens in about ${pct(tv.filter((v) => v >= thr).length / tv.length)} of model-years in that window.`);
  }

  const rv = windowVals('rain');
  if (rv.length) {
    const avg = rv.reduce((s, v) => s + v, 0) / rv.length;
    const d = avg / P.ref.rain - 1;
    lines.push(`Annual rainfall averages ${Math.round(avg)} mm, ${Math.abs(Math.round(d * 100))}% ${d >= 0 ? 'above' : 'below'} the 1961–1990 average. Models disagree more about rainfall than about temperature, so treat this as a loose signal.`);
  }
  const mean = (a) => a.reduce((x, v) => x + v, 0) / a.length;
  const wv = windowVals('winRain');
  const sv2 = windowVals('sumRain');
  if (wv.length && sv2.length && P.ref.winRain && P.ref.sumRain) {
    const w = mean(wv) / P.ref.winRain - 1;
    const su = mean(sv2) / P.ref.sumRain - 1;
    lines.push(`Winters average ${Math.abs(Math.round(w * 100))}% ${w >= 0 ? 'wetter' : 'drier'} and summers ${Math.abs(Math.round(su * 100))}% ${su >= 0 ? 'wetter' : 'drier'} than 1961–1990.`);
  }
  const fv = windowVals('frost');
  if (fv.length && P.ref.frost != null) {
    lines.push(`Air frost drops to about ${Math.round(mean(fv))} days a year, from ${Math.round(P.ref.frost)} in 1961–1990.`);
  }
  const xv = windowVals('tmax');
  const nv = windowVals('tmin');
  if (xv.length && nv.length && P.ref.tmax != null && P.ref.tmin != null) {
    lines.push(`Days run ${sign(mean(xv) - P.ref.tmax)} °C and nights ${sign(mean(nv) - P.ref.tmin)} °C against 1961–1990.`);
  }
  return { kind: 'projected', lines };
}
