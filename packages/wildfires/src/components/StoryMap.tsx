import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { z } from 'astro:content';
import type { caseSchema } from '../content.config';
import { usePixelTooltip } from '../hooks/usePixelTooltip';

type CaseData = z.infer<typeof caseSchema>;
type BoundsTuple = CaseData['beforeBounds'];

function unionBounds(a: BoundsTuple, b: BoundsTuple): BoundsTuple {
  return {
    southWest: [
      Math.min(a.southWest[0], b.southWest[0]),
      Math.min(a.southWest[1], b.southWest[1])
    ],
    northEast: [
      Math.max(a.northEast[0], b.northEast[0]),
      Math.max(a.northEast[1], b.northEast[1])
    ]
  };
}

function toMapLibreBounds(bounds: BoundsTuple): [[number, number], [number, number]] {
  return [
    [bounds.southWest[1], bounds.southWest[0]],
    [bounds.northEast[1], bounds.northEast[0]]
  ];
}

function rasterTileUrl(
  titilerBaseUrl: string | undefined,
  cogUrl: string,
  rendering?: CaseData['rendering']
) {
  if (!titilerBaseUrl) return '';

  const params = new URLSearchParams();
  params.set('url', cogUrl);

  if (rendering?.bidx) params.set('bidx', String(rendering.bidx));
  if (rendering?.colormapName) params.set('colormap_name', rendering.colormapName);
  if (rendering?.colorFormula) params.set('color_formula', rendering.colorFormula);
  if (rendering?.rescale) params.set('rescale', `${rendering.rescale[0]},${rendering.rescale[1]}`);

  return `${titilerBaseUrl.replace(/\/$/, '')}/cog/tiles/{z}/{x}/{y}.png?${params.toString()}`;
}

export default function StoryMap({
  title,
  region,
  beforeCogUrl,
  afterCogUrl,
  beforeBounds,
  afterBounds,
  titilerBaseUrl,
  rendering,
  rasterCrs
}: {
  title: string;
  region: string;
  beforeCogUrl: string;
  afterCogUrl: string;
  beforeBounds: BoundsTuple;
  afterBounds: BoundsTuple;
  titilerBaseUrl: string;
  rendering?: CaseData['rendering'];
  rasterCrs: 'EPSG:4326' | 'EPSG:3857';
}) {
  const beforeRef = useRef<HTMLDivElement | null>(null);
  const afterRef = useRef<HTMLDivElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const beforeMapRef = useRef<maplibregl.Map | null>(null);
  const afterMapRef = useRef<maplibregl.Map | null>(null);

  const { tooltip, query, clear } = usePixelTooltip({
    titilerBaseUrl,
    cogUrl: afterCogUrl,
    rendering,
    rasterCrs
  });

  const fitBounds = useMemo(
    () => toMapLibreBounds(unionBounds(beforeBounds, afterBounds)),
    [beforeBounds, afterBounds]
  );

  const beforeTiles = useMemo(
    () => rasterTileUrl(titilerBaseUrl, beforeCogUrl, rendering),
    [titilerBaseUrl, beforeCogUrl, rendering]
  );

  const afterTiles = useMemo(
    () => rasterTileUrl(titilerBaseUrl, afterCogUrl, rendering),
    [titilerBaseUrl, afterCogUrl, rendering]
  );

  useEffect(() => {
    if (!beforeRef.current || !afterRef.current || !compareRef.current) return;
    if (beforeMapRef.current || afterMapRef.current) return;
    if (!beforeTiles || !afterTiles) return;

    let mounted = true;
    let compareControl: { remove?: () => void } | null = null;

    const style = { version: 8, sources: {}, layers: [] } as const;

    const beforeMap = new maplibregl.Map({
      container: beforeRef.current,
      style,
      center: [0, 0],
      zoom: 2
    });

    const afterMap = new maplibregl.Map({
      container: afterRef.current,
      style,
      center: [0, 0],
      zoom: 2
    });

    beforeMap.on('load', () => {
      beforeMap.addSource('before-tiles', {
        type: 'raster',
        tiles: [beforeTiles],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 24
      });
      beforeMap.addLayer({
        id: 'before-layer',
        type: 'raster',
        source: 'before-tiles'
      });
      beforeMap.fitBounds(fitBounds, { padding: 28, duration: 0, maxZoom: 14 });
      beforeMap.resize();
    });

    afterMap.on('load', () => {
      afterMap.addSource('after-tiles', {
        type: 'raster',
        tiles: [afterTiles],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 24
      });
      afterMap.addLayer({
        id: 'after-layer',
        type: 'raster',
        source: 'after-tiles'
      });
      afterMap.fitBounds(fitBounds, { padding: 28, duration: 0, maxZoom: 14 });
      afterMap.resize();
    });

    (async () => {
      const mod = await import('@maplibre/maplibre-gl-compare');
      if (!mounted) return;
      const Compare = mod.default;
      compareControl = new Compare(beforeMap, afterMap, compareRef.current!, {
        orientation: 'vertical',
        mousemove: true
      });
    })();

    const onMove = (e: MouseEvent) => {
      const rect = compareRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        clear();
        return;
      }

      const point = afterMap.unproject([x, y]);
      query(point.lng, point.lat, e.clientX, e.clientY);
    };

    compareRef.current.addEventListener('mousemove', onMove);
    compareRef.current.addEventListener('mouseleave', clear);

    beforeMapRef.current = beforeMap;
    afterMapRef.current = afterMap;

    return () => {
      mounted = false;
      compareRef.current?.removeEventListener('mousemove', onMove);
      compareRef.current?.removeEventListener('mouseleave', clear);
      compareControl?.remove?.();
      beforeMap.remove();
      afterMap.remove();
      beforeMapRef.current = null;
      afterMapRef.current = null;
    };
  }, [beforeTiles, afterTiles, fitBounds, query, clear]);

  return (
    <section className="card pad" style={{ position: 'relative' }}>
      <div className="map-header">
        <div>
          <span className="pill">Synced compare view</span>
          <h2 style={{ margin: '10px 0 6px' }}>{title}</h2>
          <p>{region}</p>
        </div>
        {titilerBaseUrl ? <p className="map-hint">Drag the divider to compare<br />Hover for the exact pixel value</p> : null}
      </div>

      {!titilerBaseUrl ? (
        <div className="card pad" style={{ marginTop: 12 }}>
          <p>TiTiler URL is missing. Set <code>PUBLIC_TITILER_URL</code> in your <code>.env</code> file.</p>
        </div>
      ) : (
        <div
          ref={compareRef}
          style={{
            height: '62vh',
            minHeight: 480,
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div ref={beforeRef} style={{ position: 'absolute', inset: 0 }} />
          <div ref={afterRef} style={{ position: 'absolute', inset: 0 }} />
        </div>
      )}

      {tooltip.value ? (
        <div
          className="pixel-tooltip"
          role="status"
          aria-live="polite"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          Pixel value: {tooltip.value}
        </div>
      ) : null}
    </section>
  );
}
