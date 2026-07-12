// Server-side proxy for EFFIS (European Forest Fire Information System) current
// burnt-area data, part of the Copernicus Emergency Management Service:
// https://forest-fire.emergency.copernicus.eu/
//
// EFFIS does not publish a documented, stable public API. This proxies the
// legacy "rest/2" REST endpoint that JRC/EFFIS has exposed since ~2017 and
// that community tooling (e.g. the R package "effisr") still relies on.
// If EFFIS retires or reshapes this endpoint, the human-facing equivalents to
// check against when updating EFFIS_SOURCE below are:
//   - Current Situation Viewer 2.0: https://forest-fire.emergency.copernicus.eu/apps/effis.csv
//   - Current Statistics Portal:    https://forest-fire.emergency.copernicus.eu/apps/effis.statistics
//
// This runs server-side (as a Cloudflare Pages Function, not in the browser)
// to avoid CORS restrictions on the upstream service and to apply a short
// edge cache so the site doesn't hammer EFFIS on every page load.

const EFFIS_SOURCE = 'https://effis.jrc.ec.europa.eu/rest/2/burntareas/current/';
const CACHE_SECONDS = 1800; // 30 minutes — EFFIS burnt-area data updates at most daily

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);

  const limit = clampInt(url.searchParams.get('limit'), 100, 1, 500);
  const country = url.searchParams.get('country');
  const minArea = url.searchParams.get('min_area_ha');

  const upstream = new URL(EFFIS_SOURCE);
  upstream.searchParams.set('format', 'json');
  upstream.searchParams.set('ordering', '-firedate');
  upstream.searchParams.set('limit', String(limit));
  if (country) upstream.searchParams.set('country', country.toUpperCase());
  if (minArea) upstream.searchParams.set('area_ha__gt', minArea);

  const cache = caches.default;
  const cacheKey = new Request(upstream.toString(), request);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const upstreamResponse = await fetch(upstream.toString(), {
      headers: {
        accept: 'application/json',
        'user-agent': 'wildfire-story-lab/1.0 (+https://rjmlaird.co.uk; contact via rjmlaird.co.uk)'
      },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
    });

    if (!upstreamResponse.ok) {
      return jsonError(`EFFIS upstream responded with status ${upstreamResponse.status}`, 502);
    }

    const raw = await upstreamResponse.json();
    const records = normalise(raw);

    const body = JSON.stringify({
      source: EFFIS_SOURCE,
      fetchedAt: new Date().toISOString(),
      count: records.length,
      records
    });

    const response = new Response(body, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': `public, max-age=${CACHE_SECONDS}`,
        'access-control-allow-origin': '*'
      }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return jsonError(`Failed to reach EFFIS: ${err.message}`, 502);
  }
}

// EFFIS has, across versions, returned a bare array, a GeoJSON
// FeatureCollection, or a DRF-style { results: [...] } payload. Handle all
// three so this proxy degrades gracefully rather than breaking outright if
// the upstream shape shifts slightly.
function normalise(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.features)
      ? raw.features.map((f) => ({ ...f.properties, geometry: f.geometry }))
      : Array.isArray(raw?.results)
        ? raw.results
        : [];

  return list.map((item) => ({
    id: item.id ?? item.objectid ?? null,
    country: item.country ?? item.iso2 ?? null,
    countryName: item.countryful ?? item.country_name ?? null,
    province: item.province ?? null,
    commune: item.commune ?? null,
    fireDate: item.firedate ?? item.fire_date ?? null,
    areaHa: numberOrNull(item.area_ha),
    broadleafPct: numberOrNull(item.broadlea),
    coniferPct: numberOrNull(item.conifer),
    mixedPct: numberOrNull(item.mixed)
  }));
}

function numberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }
  });
}
