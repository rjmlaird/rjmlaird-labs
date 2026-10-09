import { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { chartRows, firstYearWith } from '../lib/climate.js';

function Tip({ active, payload, label, unit, digits }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const v = row.obs ?? row.proj;
  if (v == null) return null;
  return (
    <div className="tip">
      <b>{label}</b>
      <span>{v.toFixed(digits)} {unit}{row.obs == null ? ' (model mean)' : ''}</span>
    </div>
  );
}

export default function ClimateChart({ P, metric, year, onYear, children }) {
  const start = firstYearWith(P, metric.key) ?? P.firstYear;
  const rows = useMemo(() => chartRows(P, metric.key).filter((r) => r.year >= start), [P, metric.key, start]);
  const ref = metric.key === 'dry' ? 0 : P.ref[metric.key];
  const fmt = (v) => (metric.digits === 0 ? Math.round(v) : v.toFixed(metric.digits));

  return (
    <figure className="chart">
      <figcaption>
        <h3>{metric.label}</h3>
        {children}
      </figcaption>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height={190}>
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} onClick={(e) => e?.activeLabel && onYear(Number(e.activeLabel))}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="year" type="number" domain={[start, P.lastYear]} tickCount={8} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickLine={false} axisLine={{ stroke: 'var(--line)' }} />
            <YAxis domain={['auto', 'auto']} width={44} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
            <Tooltip content={<Tip unit={metric.unit} digits={metric.digits} />} />
            {ref != null && <ReferenceLine y={ref} stroke="var(--muted)" strokeDasharray="2 3" />}
            <Area dataKey="band" stroke="none" fill="var(--proj)" fillOpacity={0.14} isAnimationActive={false} connectNulls={false} />
            <Line dataKey="obs" stroke="var(--ink-soft)" strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
            <Line dataKey="roll" stroke="var(--roll)" strokeWidth={2.4} dot={false} isAnimationActive={false} connectNulls={false} />
            <Line dataKey="proj" stroke="var(--proj)" strokeWidth={2.4} strokeDasharray="6 4" dot={false} isAnimationActive={false} connectNulls={false} />
            <ReferenceLine x={year} stroke="var(--ink)" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
