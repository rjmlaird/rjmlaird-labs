import React from 'react';
import RunToggle from './Toggle';
import type { Scenario } from '../../lib/mechanics/types';

type PresetOption = {
  id: Scenario;
  label: string;
  description: string;
};

type ControlsPanelProps = {
  scenario: Scenario;
  presets: PresetOption[];
  description: string;
  running: boolean;
  mode: string;
  onScenarioChange: (scenario: Scenario) => void;
  onReset: () => void;
  onToggle: () => void;
};

export default function ControlsPanel({
  scenario,
  presets,
  description,
  running,
  mode,
  onScenarioChange,
  onReset,
  onToggle,
}: ControlsPanelProps) {
  return (
    <aside className="mech-panel" aria-label="Controls">
      <div className="mech-panel__header">
        <h2>Controls</h2>
        <p>Choose a preset and adjust the run state.</p>
      </div>

      <div className="mech-panel__body mech-panel__body--scroll">
        <div className="controls">
          <label>
            Scenario
            <select value={scenario} onChange={(e) => onScenarioChange(e.target.value as Scenario)}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Preset description
            <textarea value={description} readOnly />
          </label>

          <div className="button-row">
            <Toggle running={running} onToggle={onToggle} />
            <button type="button" onClick={onReset}>
              Reset
            </button>
          </div>

          <div className="callout">
            {running ? 'Simulation running.' : 'Ready to run. Select a preset to begin.'}
          </div>

          <div className="callout callout-lock">
            Current mode: <strong>{mode}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
