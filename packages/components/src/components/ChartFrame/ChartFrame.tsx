import { useId } from "react";
import "./chart-frame.css";

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartFrameProps {
  title: string;
  /** Text alternative describing what the chart shows. */
  description: string;
  data: ChartPoint[];
  xHeader: string;
  yHeader: string;
  caption: string;
  source: string;
  methodHref: string;
}

const W = 340;
const H = 130;
const X0 = 20;
const X1 = 320;
const Y_TOP = 14;
const Y_BASE = 110;

/** Every chart ships with a text alternative, a data table, a source and a method link. */
export function ChartFrame({ title, description, data, xHeader, yHeader, caption, source, methodHref }: ChartFrameProps) {
  const uid = useId();
  const titleId = `${uid}-t`;
  const descId = `${uid}-d`;
  const max = Math.max(0, ...data.map((d) => d.value)) * 1.1 || 1;
  const step = data.length > 1 ? (X1 - X0) / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: X0 + i * step,
    y: Y_BASE - (d.value / max) * (Y_BASE - Y_TOP),
  }));

  return (
    <figure className="chart">
      {data.length > 0 ? (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${titleId} ${descId}`} className="chart__svg">
          <title id={titleId}>{title}</title>
          <desc id={descId}>{description}</desc>
          <line x1="10" y1="118" x2="330" y2="118" stroke="var(--border)" />
          <polyline fill="none" stroke="var(--accent)" strokeWidth="3" points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />
          {pts.map((p, i) => (
            <circle key={data[i]?.label} cx={p.x} cy={p.y} r="4" fill="var(--accent)" />
          ))}
        </svg>
      ) : (
        <p className="chart__empty">No data available for this chart.</p>
      )}
      <figcaption className="chart__caption">
        {caption} Source: {source}. <a href={methodHref}>Method</a>
      </figcaption>
      {data.length > 0 && (
        <details className="chart__details">
          <summary>Data table</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">{xHeader}</th>
                <th scope="col">{yHeader}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label}>
                  <td>{d.label}</td>
                  <td>{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </figure>
  );
}
