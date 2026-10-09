import { useCallback, useRef, useState } from 'react';

type Rendering = {
  bidx?: number;
  colormapName?: string;
  colorFormula?: string;
  rescale?: [number, number];
};

type TooltipState = {
  value: string | null;
  x: number;
  y: number;
  loading: boolean;
};

function pointUrl(
  titilerBaseUrl: string,
  cogUrl: string,
  lon: number,
  lat: number,
  rendering?: Rendering
) {
  const base = titilerBaseUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('url', cogUrl);
  if (rendering?.bidx) params.set('bidx', String(rendering.bidx));
  if (rendering?.colormapName) params.set('colormap_name', rendering.colormapName);
  if (rendering?.colorFormula) params.set('color_formula', rendering.colorFormula);
  if (rendering?.rescale) params.set('rescale', `${rendering.rescale[0]},${rendering.rescale[1]}`);
  return `${base}/cog/point/${lon},${lat}?${params.toString()}`;
}

function toRasterCoords(lon: number, lat: number, rasterCrs: 'EPSG:4326' | 'EPSG:3857') {
  if (rasterCrs === 'EPSG:4326') return { lon, lat };
  const x = (lon * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;
  return { lon: x, lat: y };
}

export function usePixelTooltip({
  titilerBaseUrl,
  cogUrl,
  rendering,
  rasterCrs
}: {
  titilerBaseUrl: string;
  cogUrl: string;
  rendering?: Rendering;
  rasterCrs: 'EPSG:4326' | 'EPSG:3857';
}) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    value: null,
    x: 0,
    y: 0,
    loading: false
  });

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const query = useCallback(
    (lon: number, lat: number, x: number, y: number) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setTooltip((t) => ({ ...t, x, y, loading: true }));

      timerRef.current = window.setTimeout(async () => {
        try {
          const coords = toRasterCoords(lon, lat, rasterCrs);
          const res = await fetch(pointUrl(titilerBaseUrl, cogUrl, coords.lon, coords.lat, rendering), {
            signal: controller.signal
          });
          if (!res.ok) throw new Error('query failed');
          const json = await res.json();
          const value = json?.values?.[0] ?? json?.value ?? null;
          setTooltip({ value: value == null ? null : String(value), x, y, loading: false });
        } catch {
          if (!controller.signal.aborted) {
            setTooltip((t) => ({ ...t, value: null, loading: false }));
          }
        }
      }, 120);
    },
    [titilerBaseUrl, cogUrl, rendering, rasterCrs]
  );

  const clear = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    setTooltip((t) => ({ ...t, value: null, loading: false }));
  }, []);

  return { tooltip, query, clear };
}
