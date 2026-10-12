import { useMemo } from 'react';

type Row = { speed: number; reaction: number; braking: number; total: number };

type Props = {
  rows: Row[];
  highlightSpeed?: number;
  width?: number;
  height?: number;
  speedUnitLabel?: string;
};

export default function StoppingDistanceChart({ rows, highlightSpeed, width = 620, height = 260, speedUnitLabel = 'm/s' }: Props) {
  const { bars, maxTotal } = useMemo(() => {
    const maxTotal = Math.max(...rows.map((r) => r.total), 1);
    const padLeft = 40;
    const padBottom = 28;
    const padTop = 10;
    const chartW = width - padLeft - 10;
    const chartH = height - padBottom - padTop;
    const barW = chartW / rows.length;

    const built = rows.map((r, i) => {
      const totalH = (r.total / maxTotal) * chartH;
      const reactionH = (r.reaction / maxTotal) * chartH;
      const brakingH = (r.braking / maxTotal) * chartH;
      const x = padLeft + i * barW + barW * 0.15;
      const w = barW * 0.7;
      const baseY = height - padBottom;
      return {
        x,
        w,
        baseY,
        reactionY: baseY - reactionH,
        reactionH,
        brakingY: baseY - totalH,
        brakingH,
        speed: r.speed,
        total: r.total,
        isHighlight: highlightSpeed !== undefined && Math.abs(r.speed - highlightSpeed) < 0.6,
      };
    });
    return { bars: built, maxTotal };
  }, [rows, width, height, highlightSpeed]);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Stopping distance vs speed">
        {bars.map((b) => (
          <g key={b.speed}>
            <rect x={b.x} y={b.reactionY} width={b.w} height={b.reactionH} fill="#60a5fa" opacity={b.isHighlight ? 1 : 0.75} />
            <rect x={b.x} y={b.brakingY} width={b.w} height={b.brakingH} fill="#f87171" opacity={b.isHighlight ? 1 : 0.75} />
            <text x={b.x + b.w / 2} y={height - 10} textAnchor="middle" fontSize={10} fill="#9aa5b1">
              {b.speed}
            </text>
          </g>
        ))}
      </svg>
      <ul className="chart-legend">
        <li>
          <span className="swatch" style={{ background: '#60a5fa' }} /> Reaction (thinking) distance
        </li>
        <li>
          <span className="swatch" style={{ background: '#f87171' }} /> Braking distance
        </li>
      </ul>
      <p className="hint">
        Speed in {speedUnitLabel} along the bottom; tallest bar ≈ {maxTotal.toFixed(0)} m total stopping distance.
      </p>
    </div>
  );
}
