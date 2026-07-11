import { useEffect, useMemo, useState } from 'react';
import type { z } from 'astro:content';
import type { caseSchema } from '../content.config';

type CaseData = z.infer<typeof caseSchema>;
type Rendering = NonNullable<CaseData['rendering']>;

function statsUrl(titilerBaseUrl: string | undefined, cogUrl: string, rendering?: Rendering) {
  if (!titilerBaseUrl) return '';

  const base = titilerBaseUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('url', cogUrl);

  if (rendering?.bidx) params.set('bidx', String(rendering.bidx));
  if (rendering?.colormapName) params.set('colormap_name', rendering.colormapName);
  if (rendering?.colorFormula) params.set('color_formula', rendering.colorFormula);
  if (rendering?.rescale) params.set('rescale', `${rendering.rescale[0]},${rendering.rescale[1]}`);

  return `${base}/cog/statistics?${params.toString()}`;
}

function buildSegments(band: any) {
  const min = band?.statistics?.min ?? band?.min ?? 0;
  const max = band?.statistics?.max ?? band?.max ?? 1;
  const colors = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'];
  const steps = colors.length;

  return Array.from({ length: steps }, (_, i) => {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const value = min + (max - min) * t;
    return { label: value.toFixed(2), color: colors[i], value: value.toFixed(2) };
  });
}

export default function Legend({
  titilerBaseUrl,
  cogUrl,
  rendering,
  title = 'Legend'
}: {
  titilerBaseUrl: string;
  cogUrl: string;
  rendering?: Rendering;
  title?: string;
}) {
  const [payload, setPayload] = useState<any>(null);
  const [hovered, setHovered] = useState<{ label: string; value: string; color: string } | null>(null);

  useEffect(() => {
    if (!titilerBaseUrl) return;

    let alive = true;

    fetch(statsUrl(titilerBaseUrl, cogUrl, rendering))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('stats failed'))))
      .then((json) => {
        if (alive) setPayload(json);
      })
      .catch(() => {
        if (alive) setPayload(null);
      });

    return () => {
      alive = false;
    };
  }, [titilerBaseUrl, cogUrl, rendering]);

  const band = useMemo(() => (payload ? (Object.values(payload)[0] as any) : null), [payload]);
  const segments = useMemo(() => buildSegments(band), [band]);

  return (
    <aside className="card pad legend" style={{ position: 'relative' }}>
      <h3 style={{ margin: '0 0 10px' }}>{title}</h3>

      {!titilerBaseUrl ? (
        <p>TiTiler URL is missing. Set <code>PUBLIC_TITILER_URL</code> in your <code>.env</code> file.</p>
      ) : band ? (
        <>
          <div className="bar" aria-label="Legend">
            {segments.map((seg) => (
              <button
                key={seg.value}
                type="button"
                className="segment"
                style={{ background: seg.color }}
                onMouseEnter={() => setHovered(seg)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(seg)}
                onBlur={() => setHovered(null)}
                aria-label={`Value ${seg.value}`}
              />
            ))}
          </div>

          <div className="legend-row">
            <span>{band?.statistics?.min ?? band?.min ?? 'n/a'}</span>
            <span>{band?.statistics?.mean ?? band?.mean ?? 'mean'}</span>
            <span>{band?.statistics?.max ?? band?.max ?? 'n/a'}</span>
          </div>

          {hovered ? (
            <div className="tooltip" role="tooltip" aria-live="polite">
              <strong>{hovered.label}</strong>
              <span>{hovered.value}</span>
            </div>
          ) : null}
        </>
      ) : (
        <p>Loading legend…</p>
      )}
    </aside>
  );
}
