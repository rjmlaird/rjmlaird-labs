import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSeries } from '../scripts/lib/metoffice.mjs';
import { buildObservations, summariseModels, adjustModels, periodMeans } from '../scripts/lib/build.mjs';

const SAMPLE = `Midlands Tmean
Source: Met Office
Year   JAN   FEB   MAR   APR   MAY   JUN   JUL   AUG   SEP   OCT   NOV   DEC   WIN   SPR   SUM   AUT   ANN
1884   3.0   4.0   5.0   7.0   10.0  13.0  15.0  14.5  12.0  9.0   5.0   3.5   3.2   7.3   14.2  8.7   8.6
1885   2.0   ---   5.0   7.0   10.0  13.0  15.0  14.5  12.0  9.0   5.0   3.5   3.2   7.3   14.2  8.7   -99.9
`;

test('parses data rows and missing values', () => {
  const s = parseSeries(SAMPLE);
  assert.equal(s.size, 2);
  assert.equal(s.get(1884).ann, 8.6);
  assert.equal(s.get(1884).sum, 14.2);
  assert.equal(s.get(1885).months[1], null);
  assert.equal(s.get(1885).ann, null);
});

test('observations compute April–September rainfall', () => {
  const rain = parseSeries('Year JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC WIN SPR SUM AUT ANN\n2000 1 1 1 10 10 10 10 10 10 1 1 1 3 21 30 3 90\n');
  const rows = buildObservations({ rain });
  assert.equal(rows[0].growRain, 60);
  assert.equal(rows[0].rain, 90);
  assert.equal(rows[0].winRain, 3);
  assert.equal(rows[0].sumRain, 30);
});

function fakeDaily(models, from, to, tempFn) {
  const time = []; const d = { time };
  for (let y = from; y <= to; y++) for (let m = 1; m <= 12; m++) for (let day = 1; day <= 30; day++) {
    time.push(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  for (const m of models) {
    d[`temperature_2m_mean_${m}`] = time.map((t) => tempFn(Number(t.slice(0, 4))));
    d[`temperature_2m_max_${m}`] = time.map((t) => tempFn(Number(t.slice(0, 4))) + 4);
    // frost on every January day before 2021, none after
    d[`temperature_2m_min_${m}`] = time.map((t) => (t.slice(5, 7) === '01' && Number(t.slice(0, 4)) <= 2020 ? -1 : 3));
    d[`precipitation_sum_${m}`] = time.map(() => 2);
  }
  return d;
}

test('model output is annualised and delta-adjusted to observed baseline', () => {
  const daily = fakeDaily(['A', 'B'], 1991, 2030, (y) => 10 + (y > 2020 ? 1 : 0));
  const models = summariseModels(daily);
  assert.deepEqual(Object.keys(models), ['A', 'B']);
  const obsBase = { temp: 9.5, summerTemp: 9.5, rain: 700, growRain: 350, tmax: 13, tmin: 5, winRain: 200, sumRain: 180, frost: 20 };
  const { cols, rows } = adjustModels(models, obsBase, 2025);
  assert.ok(rows.every((r) => r[1] > 2025));
  const get = (f) => rows.find((r) => r[0] === 'A' && r[1] === 2030)[2 + cols.indexOf(f)];
  assert.ok(Math.abs(get('temp') - 10.5) < 0.01, 'observed baseline 9.5 + 1 degree model warming');
  assert.ok(Math.abs(get('tmax') - 14) < 0.01);
  assert.ok(Math.abs(get('rain') - 700) < 0.5, 'constant model rainfall keeps the observed baseline');
  assert.ok(Math.abs(get('winRain') - 200) < 0.5);
  assert.equal(get('frost'), 0, 'frost days cannot go below zero');
});

test('winter rainfall is Dec of the previous year plus Jan–Feb', () => {
  const models = summariseModels(fakeDaily(['A'], 1991, 2030, () => 10));
  const y1991 = models.A.find((r) => r.year === 1991);
  const y1992 = models.A.find((r) => r.year === 1992);
  assert.equal(y1991.winRain, null, '1991 lacks December 1990');
  assert.ok(Math.abs(y1992.winRain - 2 * 90.25) < 0.01);
});

test('periodMeans refuses sparse periods', () => {
  const rows = [{ year: 1991, temp: 9, summerTemp: 14, rain: 700, growRain: 300 }];
  assert.equal(periodMeans(rows, 1991, 2020).temp, null);
});
