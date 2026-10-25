import { useEffect, useMemo, useState } from 'react';
import StripeSlider from './components/StripeSlider.jsx';
import ClimateChart from './components/ClimateChart.jsx';
import AnnotationPanel from './components/AnnotationPanel.jsx';
import Method from './components/Method.jsx';
import { prepare, hasField, METRICS } from './lib/climate.js';

function Seg({ label, value, options, onChange }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, text]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{text}</button>
      ))}
    </div>
  );
}

const base = import.meta.env.BASE_URL;

export default function App() {
  const [locations, setLocations] = useState(null);
  const [locId, setLocId] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(2022);
  const [tempMode, setTempMode] = useState('temp');
  const [rainMode, setRainMode] = useState('rain');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch(`${base}data/locations.json`)
      .then((r) => { if (!r.ok) throw new Error('missing'); return r.json(); })
      .then((l) => { setLocations(l); setLocId(l[0].id); })
      .catch(() => setError('nodata'));
  }, []);

  useEffect(() => {
    if (!locId) return;
    setData(null);
    fetch(`${base}data/${locId}.json`)
      .then((r) => { if (!r.ok) throw new Error('missing'); return r.json(); })
      .then((d) => { if (d.schema !== 2) throw new Error('old'); setData(d); })
      .catch(() => setError('nodata'));
  }, [locId]);

  const P = useMemo(() => (data ? prepare(data) : null), [data]);

  useEffect(() => {
    if (P) setYear((y) => Math.min(Math.max(y, P.firstYear), P.lastYear));
  }, [P]);

  useEffect(() => {
    if (!playing || !P) return undefined;
    const id = setInterval(() => {
      setYear((y) => {
        if (y >= P.lastYear) { setPlaying(false); return y; }
        return y + 1;
      });
    }, 110);
    return () => clearInterval(id);
  }, [playing, P]);

  if (error) {
    return (
      <main className="shell">
        <h1>Local Climate Time Machine</h1>
        <p className="lead">The data files are missing or out of date.</p>
        <p>Run <code>npm run fetch-data</code> to download the Met Office observations and model projections, then reload.</p>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="top">
        <div>
          <h1>Local Climate Time Machine</h1>
          <p className="sub">
            Drag through {P ? P.lastObs - P.firstYear + 1 : 140} years of measured weather and the climate models’ view of the next {P ? P.lastYear - P.lastObs : 25}.
          </p>
        </div>
        <label className="picker">
          <span>Region</span>
          <select value={locId ?? ''} onChange={(e) => { setPlaying(false); setLocId(e.target.value); }}>
            {(locations ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
      </header>

      {!P ? (
        <p className="loading">Loading data…</p>
      ) : (
        <>
          <section className="hero" aria-label="Time slider">
            <div className="hero-year">
              <button type="button" className="play" onClick={() => { if (year >= P.lastYear) setYear(P.firstYear); setPlaying((p) => !p); }}>
                {playing ? 'Pause' : 'Play'}
              </button>
              <output className="big-year">{year}</output>
            </div>
            <StripeSlider P={P} year={year} onChange={(y) => { setPlaying(false); setYear(y); }} />
          </section>

          <section className="grid">
            <div className="charts">
              <ClimateChart P={P} metric={METRICS[tempMode]} year={year} onYear={setYear}>
                <Seg label="Temperature measure" value={tempMode} onChange={setTempMode}
                  options={[['temp', 'Mean'], ['summer', 'Summer'], ...(hasField(P, 'tmax') ? [['tmax', 'Days']] : []), ...(hasField(P, 'tmin') ? [['tmin', 'Nights']] : [])]} />
              </ClimateChart>
              <ClimateChart P={P} metric={METRICS[rainMode]} year={year} onYear={setYear}>
                <Seg label="Rainfall measure" value={rainMode} onChange={setRainMode}
                  options={[['rain', 'Annual'], ['winRain', 'Winter'], ['sumRain', 'Summer']]} />
              </ClimateChart>
              {hasField(P, 'frost') && (
                <ClimateChart P={P} metric={METRICS.frost} year={year} onYear={setYear}>
                  <span className="hint">Measured from 1961</span>
                </ClimateChart>
              )}
              <ClimateChart P={P} metric={METRICS.dry} year={year} onYear={setYear}>
                <span className="hint">Higher = drier than 1961–1990</span>
              </ClimateChart>
              <p className="chart-key">
                <i className="k-thin" /> each year <i className="k-roll" /> 10-year average <i className="k-proj" /> model mean <i className="k-band" /> model range. Dotted line: 1961–1990 average.
              </p>
            </div>
            <AnnotationPanel P={P} year={year} />
          </section>

          <Method P={P} />
          <footer>
            Observations: Met Office, <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">Open Government Licence v3.0</a>. Projections: <a href="https://open-meteo.com/">Open-Meteo</a> Climate API (CC BY 4.0).
          </footer>
        </>
      )}
    </main>
  );
}
