import { useCallback, useEffect, useMemo, useState } from 'react';

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

type EffisResponse = {
  source: string;
  fetchedAt: string;
  count: number;
  records: EffisRecord[];
};

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: EffisResponse };

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
});

export default function CurrentSituation({ apiUrl = '/api/effis-current' }: { apiUrl?: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });

    try {
      const res = await fetch(`${apiUrl}?limit=150`, {
        headers: {
          Accept: 'application/json',
        },
      });

      const contentType = res.headers.get('content-type') ?? '';
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      if (!contentType.includes('application/json')) {
        throw new Error('Live data returned HTML instead of JSON');
      }

      const body = JSON.parse(text) as Partial<EffisResponse> & { error?: string };

      if (body?.error) {
        throw new Error(body.error);
      }

      if (
        !body ||
        typeof body !== 'object' ||
        !Array.isArray(body.records) ||
        typeof body.count !== 'number'
      ) {
        throw new Error('Unexpected data shape');
      }

      setState({
        status: 'ready',
        data: {
          source: typeof body.source === 'string' ? body.source : 'EFFIS',
          fetchedAt: typeof body.fetchedAt === 'string' ? body.fetchedAt : new Date().toISOString(),
          count: body.count,
          records: body.records,
        },
      });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [apiUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    if (state.status !== 'ready') return null;

    const records = state.data.records;
    const totalArea = records.reduce((sum, r) => sum + (r.areaHa ?? 0), 0);

    const byCountry = new Map<string, { name: string; area: number; count: number }>();

    for (const r of records) {
      const key = r.country ?? r.countryName ?? 'Unknown';
      const entry = byCountry.get(key) ?? {
        name: r.countryName ?? r.country ?? 'Unknown',
        area: 0,
        count: 0,
      };

      entry.area += r.areaHa ?? 0;
      entry.count += 1;
      byCountry.set(key, entry);
    }

    const topCountries = [...byCountry.values()]
      .sort((a, b) => b.area - a.area)
      .slice(0, 8);

    const mostRecent = records
      .map((r) => r.fireDate)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1);

    return {
      totalArea,
      topCountries,
      mostRecent,
      countryCount: byCountry.size,
    };
  }, [state]);

  return (
    <section className="card pad situation">
      <div className="map-header">
        <div>
          <span className="pill ember">Live · Copernicus EFFIS</span>
          <h2 style={{ margin: '10px 0 6px' }}>Current wildfire situation</h2>
          <p>
            Recently mapped burnt areas across Europe, the Middle East and North Africa, sourced from the
            European Forest Fire Information System (EFFIS), part of the Copernicus Emergency Management Service.
          </p>
        </div>

        <button className="refresh-btn" onClick={() => void load()} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {state.status === 'loading' && <p className="hint">Fetching the latest EFFIS burnt-area records…</p>}

      {state.status === 'error' && (
        <div className="fallback">
          <p>
            Live data isn&apos;t available right now ({state.message}). You can check the current situation
            directly on the{' '}
            <a
              href="https://forest-fire.emergency.copernicus.eu/apps/effis_current_situation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              EFFIS Current Situation Viewer ↗
            </a>
            .
          </p>
        </div>
      )}

      {state.status === 'ready' && stats && (
        <>
          <div className="stat-grid">
            <div className="stat">
              <span>Burnt-area records</span>
              <strong>{numberFormatter.format(state.data.count)}</strong>
            </div>

            <div className="stat">
              <span>Total area mapped</span>
              <strong>{numberFormatter.format(stats.totalArea)} ha</strong>
            </div>

            <div className="stat">
              <span>Countries reporting</span>
              <strong>{stats.countryCount}</strong>
            </div>

            <div className="stat">
              <span>Most recent event</span>
              <strong>{stats.mostRecent ? dateFormatter.format(new Date(stats.mostRecent)) : '—'}</strong>
            </div>
          </div>

          {state.data.count === 0 && (
            <p className="hint">
              No burnt areas currently mapped in the returned window — that&apos;s good news.
            </p>
          )}

          {stats.topCountries.length > 0 && (
            <div className="country-bars">
              <h3>Burnt area by country (mapped records shown)</h3>
              {stats.topCountries.map((c) => {
                const pct = stats.totalArea ? (c.area / stats.totalArea) * 100 : 0;

                return (
                  <div className="country-row" key={c.name}>
                    <span className="country-name">{c.name}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <span className="country-value">
                      {numberFormatter.format(c.area)} ha · {c.count} fire{c.count === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {state.data.records.length > 0 && (
            <div className="table-wrap">
              <h3>Most recent mapped events</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Country</th>
                    <th>Province / commune</th>
                    <th>Area (ha)</th>
                    <th>Land cover</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.records.slice(0, 25).map((r, i) => (
                    <tr key={r.id ?? i}>
                      <td>{r.fireDate ? dateFormatter.format(new Date(r.fireDate)) : '—'}</td>
                      <td>{r.countryName ?? r.country ?? '—'}</td>
                      <td>{[r.province, r.commune].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="num">{r.areaHa != null ? numberFormatter.format(r.areaHa) : '—'}</td>
                      <td>{landCoverSummary(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="attribution">
            Source:{' '}
            <a href="https://effis.jrc.ec.europa.eu/" target="_blank" rel="noopener noreferrer">
              EFFIS
            </a>
            , Copernicus Emergency Management Service (European Commission Joint Research Centre). Fetched{' '}
            {dateFormatter.format(new Date(state.data.fetchedAt))}. Mapped fires may include intentional
            vegetation-management burns, and figures reflect mapped burnt areas rather than active fire fronts.
            See the{' '}
            <a
              href="https://forest-fire.emergency.copernicus.eu/about-effis/data-license"
              target="_blank"
              rel="noopener noreferrer"
            >
              data licence
            </a>
            .
          </p>
        </>
      )}

      <style>{`
        .situation .hint { color: var(--ink-faint); }

        .refresh-btn {
          background: var(--bg-inset);
          border: 1px solid var(--line);
          color: var(--ink);
          border-radius: var(--radius-sm);
          padding: 8px 14px;
          font-size: 0.85rem;
          cursor: pointer;
          flex: none;
        }
        .refresh-btn:hover:not(:disabled) { border-color: var(--orbit); }
        .refresh-btn:disabled { opacity: 0.6; cursor: default; }

        .fallback {
          padding: 16px;
          border-radius: var(--radius-md);
          background: var(--ember-dim);
          border: 1px solid var(--line);
        }
        .fallback a { color: var(--ember); }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin: 18px 0;
        }
        .stat {
          padding: 14px;
          border-radius: var(--radius-md);
          background: var(--bg-inset);
          border: 1px solid var(--line);
          display: grid;
          gap: 6px;
        }
        .stat span {
          color: var(--ink-faint);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .stat strong {
          font-family: var(--font-display);
          font-size: 1.3rem;
        }

        .country-bars { margin: 22px 0; }
        .country-bars h3,
        .table-wrap h3 {
          font-size: 1rem;
          margin: 0 0 12px;
          color: var(--ink-soft);
          font-weight: 600;
        }
        .country-row {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 0.85rem;
        }
        .country-name { color: var(--ink-soft); }
        .bar-track {
          height: 10px;
          border-radius: 999px;
          background: var(--bg-inset);
          border: 1px solid var(--line);
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--ember), var(--orbit));
        }
        .country-value {
          color: var(--ink-faint);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .table-wrap {
          margin-top: 26px;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        th,
        td {
          text-align: left;
          padding: 8px 10px;
          border-bottom: 1px solid var(--line-soft);
          white-space: nowrap;
        }
        th {
          color: var(--ink-faint);
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.03em;
          font-weight: 600;
        }
        td.num { font-variant-numeric: tabular-nums; }

        .attribution {
          margin-top: 18px;
          font-size: 0.78rem;
          color: var(--ink-faint);
        }
        .attribution a { color: var(--ink-soft); }
      `}</style>
    </section>
  );
}

function landCoverSummary(r: EffisRecord) {
  const parts: string[] = [];
  if (r.broadleafPct) parts.push(`${Math.round(r.broadleafPct)}% broadleaf`);
  if (r.coniferPct) parts.push(`${Math.round(r.coniferPct)}% conifer`);
  if (r.mixedPct) parts.push(`${Math.round(r.mixedPct)}% mixed`);
  return parts.length ? parts.join(' · ') : '—';
}
