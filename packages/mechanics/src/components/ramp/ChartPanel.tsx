import React from 'react';

type ChartPanelProps = {
  time: number;
  label?: string;
};

function formatValue(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

export default function ChartPanel({ time, label = 'Chart area' }: ChartPanelProps) {
  return (
    <section className="mech-panel" aria-label="Simulation">
      <div className="mech-panel__header">
        <h2>Simulation</h2>
        <p>Graph and motion view.</p>
      </div>

      <div className="mech-panel__body mech-panel__body--chart">
        <div className="chart-panel">
          <div className="chart-placeholder">
            <div>
              <strong>{label}</strong>
              <p>Replace this with your graph or canvas renderer.</p>
              <p>Time: {formatValue(time, 2)} s</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
