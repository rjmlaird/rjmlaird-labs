import { useMemo } from 'react';
import { stripeAnomaly, stripeColor } from '../lib/climate.js';
import { EVENTS } from '../lib/annotations.js';

// The slider track is the region's own warming stripes: one bar per year, coloured by how far
// that year sits from the 1961–1990 average. Years after the last measurement are hatched.
export default function StripeSlider({ P, year, onChange }) {
  const years = useMemo(() => {
    const out = [];
    for (let y = P.firstYear; y <= P.lastYear; y++) out.push(y);
    return out;
  }, [P]);
  const span = P.lastYear - P.firstYear;
  const pos = (y) => ((y - P.firstYear + 0.5) / (span + 1)) * 100;
  const projStart = ((P.lastObs + 1 - P.firstYear) / (span + 1)) * 100;
  const ticks = years.filter((y) => y % 20 === 0 || y === P.lastYear);

  return (
    <div className="slider">
      <div className="slider-flags" aria-hidden="true">
        {EVENTS.filter((e) => e.year >= P.firstYear && e.year <= P.lastObs).map((e) => (
          <button key={e.year} type="button" tabIndex={-1} className="flag" style={{ left: `${pos(e.year)}%` }} title={`${e.year}: ${e.title}`} onClick={() => onChange(e.year)} />
        ))}
      </div>
      <div className="stripes">
        {years.map((y) => (
          <span key={y} style={{ background: stripeColor(stripeAnomaly(P, y)) }} />
        ))}
        <span className="hatch" style={{ left: `${projStart}%` }} />
        <input
          type="range"
          min={P.firstYear}
          max={P.lastYear}
          step={1}
          value={year}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Year"
          aria-valuetext={`${year}, ${year <= P.lastObs ? 'measured' : 'model projection'}`}
        />
      </div>
      <div className="axis" aria-hidden="true">
        {ticks.map((y) => (
          <span key={y} style={{ left: `${pos(y)}%` }}>{y}</span>
        ))}
      </div>
      <div className="legend">
        <span>Cooler than 1961–1990</span>
        <span className="legend-bar" />
        <span>Warmer</span>
        <span className="legend-hatch"><i /> Model projection</span>
      </div>
    </div>
  );
}
