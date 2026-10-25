import { useMemo } from 'react';
import type { Sample } from '../lib/physics';

type Props = {
  data: Sample[];
  width?: number;
  height?: number;
};

const SERIES: { key: keyof Sample; color: string; label: string }[] = [
  { key: 'ke', color: '#60a5fa', label: 'Kinetic' },
  { key: 'pe', color: '#f5a623', label: 'Potential' },
  { key: 'total', color: '#00c2a8', label: 'Mechanical (KE+PE)' },
  { key: 'dissipated', color: '#f87171', label: 'Dissipated (heat)' },
];

export default function EnergyChart({ data, width = 300, height = 170 }: Props) {
  const { paths, maxY, maxT } = useMemo(() => {
    if (data.length < 2) return { paths: [], maxY: 1, maxT: 1 };
    const maxT = data[data.length - 1].t || 1;
    let maxY = 1;
    for (const d of data) {
      maxY = Math.max(maxY, d.ke, d.pe, d.total, d.dissipated);
    }
    const pad = 8;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const toX = (t: number) => pad + (t / maxT) * w;
    const toY = (y: number) => pad + h - (y / maxY) * h;

    const built = SERIES.map((series) => {
      const d = data
        .map((sample, i) => `${i === 0 ? 'M' : 'L'} ${toX(sample.t).toFixed(1)} ${toY(sample[series.key] as number).toFixed(1)}`)
        .join(' ');
      return { d, color: series.color, label: series.label };
    });
    return { paths: built, maxY, maxT };
  }, [data, width, height]);

  if (data.length < 2) {
    return <p className="hint">Run the simulation to start plotting energy over time.</p>;
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Energy vs time chart">
        <rect x="0" y="0" width={width} height={height} fill="rgba(255,255,255,0.02)" rx="10" />
        {paths.map((p) => (
          <path key={p.label} d={p.d} fill="none" stroke={p.color} strokeWidth={1.8} strokeLinejoin="round" />
        ))}
      </svg>
      <ul className="chart-legend">
        {paths.map((p) => (
          <li key={p.label}>
            <span className="swatch" style={{ background: p.color }} />
            {p.label}
          </li>
        ))}
      </ul>
      <p className="hint">
        {maxT.toFixed(1)}s elapsed &middot; scale tops out at {maxY.toFixed(1)} J
      </p>
    </div>
  );
}
