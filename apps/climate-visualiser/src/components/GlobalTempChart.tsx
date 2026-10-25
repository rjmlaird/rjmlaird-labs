import { useEffect, useMemo, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist';

type Row = {
  date: string;
  year: number;
  anomaly: number;
  rolling12?: number;
};

const DATA_URL = '/data/GLB.Ts+dSST.csv';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseCsv(csvText: string): Row[] {
  const lines = csvText.trim().split(/\r?\n/);
  const headerLine = lines.find((line) => line.startsWith('Year,'));
  if (!headerLine) throw new Error('GISTEMP header not found');

  const header = headerLine.split(',');
  const yearIdx = header.indexOf('Year');
  const monthIdx = MONTHS.map((m) => header.indexOf(m));
  const rows: Row[] = [];

  for (const line of lines) {
    if (!/^\d{4},/.test(line)) continue;
    const cols = line.split(',');
    const year = Number(cols[yearIdx]);
    if (!Number.isFinite(year)) continue;

    MONTHS.forEach((_, i) => {
      const raw = cols[monthIdx[i]];
      if (raw && raw !== '***') {
        const anomaly = Number(raw);
        if (Number.isFinite(anomaly)) {
          rows.push({
            date: `${year}-${String(i + 1).padStart(2, '0')}-15`,
            year,
            anomaly,
          });
        }
      }
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  for (let i = 11; i < rows.length; i++) {
    const window = rows.slice(i - 11, i + 1).map((r) => r.anomaly);
    rows[i].rolling12 = window.reduce((s, v) => s + v, 0) / 12;
  }

  return rows;
}

export default function ClimateVisualiser() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Data request failed (${r.status})`);
        return r.text();
      })
      .then((text) => {
        if (!alive) return;
        const parsed = parseCsv(text);
        if (!parsed.length) throw new Error('No valid data rows found');
        setRows(parsed);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const annual = useMemo(() => {
    const byYear = new Map<number, number[]>();
    for (const row of rows) {
      const arr = byYear.get(row.year) ?? [];
      arr.push(row.anomaly);
      byYear.set(row.year, arr);
    }
    return Array.from(byYear, ([year, values]) => ({
      year,
      anomaly: values.reduce((s, v) => s + v, 0) / values.length,
    }));
  }, [rows]);

  useEffect(() => {
    if (!ref.current || loading || error || !rows.length || !annual.length) return;

    const monthly = {
      x: rows.map((r) => r.date),
      y: rows.map((r) => r.anomaly),
      type: 'scatter' as const,
      mode: 'lines',
      name: 'Monthly anomaly',
      line: { width: 1.5, color: '#7c8aa5' },
      opacity: 0.45,
      hovertemplate: '%{x|%b %Y}<br>%{y:.2f}°C<extra></extra>',
    };

    const rolling = {
      x: rows.filter((r) => r.rolling12 != null).map((r) => r.date),
      y: rows.filter((r) => r.rolling12 != null).map((r) => r.rolling12),
      type: 'scatter' as const,
      mode: 'lines',
      name: '12-month mean',
      line: { width: 3, color: '#00c2a8' },
      hovertemplate: '%{x|%b %Y}<br>%{y:.2f}°C<extra></extra>',
    };

    const annualTrace = {
      x: annual.map((r) => r.year),
      y: annual.map((r) => r.anomaly),
      type: 'scatter' as const,
      mode: 'lines+markers',
      name: 'Annual mean',
      line: { width: 2, dash: 'dot', color: '#8bb4ff' },
      marker: { size: 5, color: '#8bb4ff' },
      hovertemplate: '%{x}<br>%{y:.2f}°C<extra></extra>',
    };

    Plotly.react(
      ref.current,
      [monthly, rolling, annualTrace],
      {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8ecf4', family: 'Inter, sans-serif' },
        title: {
          text: 'Global temperature anomaly trend',
          x: 0.5,
          xanchor: 'center',
          font: {
            size: 26,
            color: '#ffffff',
            family: 'Space Grotesk, Inter, sans-serif',
          },
          pad: { t: 10, b: 10 },
        },
        hovermode: 'x unified',
        hoverlabel: {
          bgcolor: 'rgba(11, 15, 26, 0.96)',
          bordercolor: 'rgba(255,255,255,0.18)',
          font: {
            color: '#ffffff',
            size: 13,
            family: 'Inter, sans-serif',
          },
          namelength: -1,
        },
        legend: {
          title: { text: 'Series' },
          orientation: 'v',
          x: 1.02,
          xanchor: 'left',
          y: 1,
          yanchor: 'top',
          bgcolor: 'rgba(11, 15, 26, 0.92)',
          bordercolor: 'rgba(255,255,255,0.12)',
          borderwidth: 1,
          font: {
            color: '#ffffff',
            size: 12,
          },
        },
        xaxis: {
          title: {
            text: 'Year',
            font: { color: '#cbd5e1', size: 14 },
          },
          gridcolor: 'rgba(255,255,255,0.08)',
          zerolinecolor: 'rgba(255,255,255,0.12)',
          tickfont: { color: '#cbd5e1' },
          unifiedhovertitle: {
            text: '<b>%{x|%B %Y}</b>',
          },
        },
        yaxis: {
          title: {
            text: 'Anomaly °C',
            font: { color: '#cbd5e1', size: 14 },
          },
          gridcolor: 'rgba(255,255,255,0.08)',
          zerolinecolor: 'rgba(255,255,255,0.12)',
          tickfont: { color: '#cbd5e1' },
          hoverformat: '.2f',
        },
        margin: { t: 140, l: 60, r: 180, b: 60 },
      },
      { responsive: true, displaylogo: false }
    );
  }, [rows, annual, loading, error]);

  useEffect(() => {
    return () => {
      if (ref.current) Plotly.purge(ref.current);
    };
  }, []);

  if (error) {
    return (
      <div className="grid min-h-[700px] place-items-center rounded-2xl border border-rose-400/20 bg-rose-500/10 p-8">
        <p role="alert" className="m-0 text-rose-100">
          Could not load data: {error}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-[700px] place-items-center rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
          <p className="text-slate-200">Loading chart…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div ref={ref} className="min-h-[760px]" />
      <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-300">
        <p className="m-0">
          Monthly anomaly shows every monthly value and is the most detailed, noisier line. The 12-month mean smooths
          short-term fluctuations to highlight the underlying trend. Annual mean compresses each year to one value for
          a simpler year-by-year comparison.
        </p>
        <p className="mt-2 m-0 text-slate-400">
          Source: NASA GISS Surface Temperature Analysis (GISTEMP v4), accessed July 12, 2026.
        </p>
      </div>
    </div>
  );
}
