import React from 'react';
import 'katex/dist/katex.min.css';
import type { ReadoutItem } from '../../lib/ramp/types';

type ValuesPanelProps = {
  readouts: ReadoutItem[];
  notes?: string;
};

export default function ValuesPanel({ readouts, notes }: ValuesPanelProps) {
  return (
    <aside className="mech-panel" aria-label="Values and notes">
      <div className="mech-panel__header">
        <h2>Values</h2>
        <p>Readouts and key formulas.</p>
      </div>

      <div className="mech-panel__body mech-panel__body--scroll">
        <dl className="value-list">
          {readouts.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>

        <section className="equation-card" aria-label="Key equations">
          <div className="equation-card__header">
            <h3>Equations</h3>
            <p>Core mechanics relationships used in the model.</p>
          </div>

          <ul className="equation-list">
            <li>
              <span className="equation-list__label">Force</span>
              <span className="equation-list__math">\\(F = ma\\)</span>
            </li>
            <li>
              <span className="equation-list__label">Momentum</span>
              <span className="equation-list__math">\\(p = mv\\)</span>
            </li>
            <li>
              <span className="equation-list__label">Kinetic energy</span>
              <span className="equation-list__math">\\(E\_k = \\frac{1}{2}mv^2\\)</span>
            </li>
            <li>
              <span className="equation-list__label">Potential energy</span>
              <span className="equation-list__math">\\(E\_p = mgh\\)</span>
            </li>
          </ul>
        </section>

        <div className="hint">{notes ?? 'Select a preset to explore the model.'}</div>
      </div>
    </aside>
  );
}
