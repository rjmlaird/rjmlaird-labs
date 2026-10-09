import type { z } from 'astro:content';
import type { caseSchema } from '../content.config';

type CaseData = z.infer<typeof caseSchema>;

export default function MetadataCards({ data }: { data: CaseData }) {
  const rendering = data.rendering;
  const items = [
    ['Sensor', data.sensor],
    ['Burn metric', data.burnMetric],
    ['Severity', data.severity],
    ['Area affected', data.areaAffected],
    ['Before date', data.beforeDate],
    ['After date', data.afterDate],
    ['Raster CRS', data.rasterCrs],
    ['Colormap', rendering?.colormapName ?? 'Default'],
    ['Color formula', rendering?.colorFormula ?? 'None'],
    ['Rescale', rendering?.rescale ? `${rendering.rescale[0]} to ${rendering.rescale[1]}` : 'Auto'],
    ['Band index', rendering?.bidx?.toString() ?? 'Auto']
  ] as const;

  return (
    <div className="meta-grid">
      {items.map(([label, value]) => (
        <div className="meta-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}

      <style>{`
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .meta-card {
          padding: 14px;
          border-radius: var(--radius-md, 14px);
          background: var(--bg-inset, #0a1119);
          border: 1px solid var(--line, #1c2a38);
          display: grid;
          gap: 6px;
        }
        .meta-card span {
          color: var(--ink-faint, #6d8091);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .meta-card strong {
          color: var(--ink, #eef3f6);
          font-size: 1rem;
          line-height: 1.3;
          font-family: var(--font-display), serif;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
