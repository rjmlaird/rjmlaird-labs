const EFFIS_WFS = 'https://maps.effis.emergency.copernicus.eu/effis';
const TYPE_NAME = 'ms:modis.ba.poly';
const CACHE_SECONDS = 1800;

type EffisRecord = {
  id: number | string | null;
  country: string | null;
  countryName: string | null;
  province: string | null;
  commune: string | null;
  fireDate: string | null;
  areaHa: number | null;
  broadleafPct: number | null;
  coniferPct: number | null;
  mixedPct: number | null;
};

export async function onRequestGet(context: {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}) {
  const { request } = context;
  const url = new URL(request.url);

  const limit = clampInt(url.searchParams.get('limit'), 150, 1, 500);
  const country = url.searchParams.get('country');
  const minArea = url.searchParams.get('min_area_ha');

  const upstream = buildUrl(country, minArea);

  const cache = caches.default;
  const cacheKey = new Request(
    `${url.origin}${url.pathname}?limit=${limit}${country ? `&country=${country}` : ''}${minArea ? `&min_area_ha=${minArea}` : ''}`,
    { method: 'GET' }
  );

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(upstream.toString(), {
      headers: {
        accept: 'application/json',
        'user-agent': 'wildfire-story-lab/1.0 (+https://rjmlaird.co.uk)',
      },
      cf: {
        cacheTtl: CACHE_SECONDS,
        cacheEverything: true,
      },
    });

    if (!res.ok) {
      return jsonError(`EFFIS WFS returned ${res.status}`, 502);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return jsonError(`EFFIS returned unsupported content-type: ${contentType || 'unknown'}`, 502);
    }

    const raw = await res.json();
    const records = normaliseGeoJson(raw).slice(0, limit);

    const response = jsonResponse(
      {
        source: upstream.toString(),
        fetchedAt: new Date().toISOString(),
        count: records.length,
        records,
      },
      200
    );

    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown WFS error';
    return jsonError(`Failed to reach EFFIS WFS: ${message}`, 502);
  }
}

function buildUrl(country: string | null, minArea: string | null) {
  const u = new URL(EFFIS_WFS);
  u.searchParams.set('service', 'WFS');
  u.searchParams.set('request', 'GetFeature');
  u.searchParams.set('typename', TYPE_NAME);
  u.searchParams.set('version', '1.1.0');
  u.searchParams.set('outputformat', 'application/json');
  if (country) u.searchParams.set('cql_filter', `country='${country.toUpperCase()}'`);
  if (minArea) u.searchParams.set('cql_filter', `${country ? `country='${country.toUpperCase()}' AND ` : ''}area_ha >= ${minArea}`);
  return u;
}

function normaliseGeoJson(raw: any): EffisRecord[] {
  const features = Array.isArray(raw?.features) ? raw.features : [];
  return features.map((f: any, idx: number) => {
    const p = f?.properties ?? {};
    return {
      id: p.id ?? p.objectid ?? idx + 1,
      country: stringOrNull(p.country ?? p.iso2),
      countryName: stringOrNull(p.country_name ?? p.countryful),
      province: stringOrNull(p.province),
      commune: stringOrNull(p.commune),
      fireDate: stringOrNull(p.firedate ?? p.fire_date ?? p.date),
      areaHa: numberOrNull(p.area_ha ?? p.area),
      broadleafPct: numberOrNull(p.broadlea ?? p.broadleaf_pct),
      coniferPct: numberOrNull(p.conifer ?? p.conifer_pct),
      mixedPct: numberOrNull(p.mixed ?? p.mixed_pct),
    };
  });
}

function jsonResponse(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${CACHE_SECONDS}`,
      'access-control-allow-origin': '*',
    },
  });
}

function jsonError(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

function stringOrNull(v: unknown) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s : null;
}

function numberOrNull(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
