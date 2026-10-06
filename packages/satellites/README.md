# Satellites (Vercel)

Astro static site + two Vercel Functions that front Celestrak, with caching at three levels.

```
browser ──► IndexedDB cache (2h fresh, 24h stale-while-revalidate)
   │
   └──► /api/gp, /api/satcat ──► Vercel edge cache (s-maxage 2h, SWR 24h, stale-if-error 7d)
                                   │
                                   └──► Celestrak (warm function instances also keep the parsed SATCAT in memory)
```

| Route | Returns |
| --- | --- |
| `/api/gp?group=stations` | TLE text for the group |
| `/api/satcat?group=stations` | SATCAT rows for only that group's objects, trimmed to the columns the app uses |
| `/api/satcat?scope=payloads` | Payload-only table (type, owner, launch date) for Launch Stats |

## Deploy

1. Push this folder to a repo (or keep it in the monorepo and set **Root Directory** to `packages/satellites` in Vercel).
2. Import in Vercel. Framework preset: Astro (detected from `vercel.json`). No env vars needed.
3. Add the domain `satellites.labs.rjmlaird.co.uk` under Project → Domains.

## Local

```
npm install
npm run vercel:dev   # runs Astro + /api together (plain `astro dev` has no /api)
npm test             # API tests (mocked Celestrak)
```

## Notes

- Allowed groups live in `api/_lib/celestrak.js`; add more with the `EXTRA_GROUPS` env var (comma-separated).
- Verify edge caching after deploy: `curl -sI 'https://<domain>/api/gp?group=stations' | grep -i x-vercel-cache` — expect `MISS` once, then `HIT`.
- Cache lifetimes: `CACHE_CONTROL` in `api/_lib/celestrak.js` (server) and `TTL_MS` / `SWR_MS` in `src/scripts/lib/cache.ts` (browser).
- The Cloudflare worker and `wrangler.jsonc` are gone; static caching headers are in `vercel.json`.
