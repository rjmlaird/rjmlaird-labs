import React, { useEffect, useMemo, useState } from 'react';
import useAnimationFrame from '../hooks/useAnimationFrame';
import { computeMetrics, ensureInBounds, stepSimulation } from '../lib/ramp/physics';
import { getPreset, presets } from '../lib/ramp/presets';
import type {
  MotionMode,
  Scenario,
  SimulationConfig,
  SimulationFrame,
  SimulationMetrics,
  ReadoutItem,
  Block,
} from '../lib/ramp/types';

type LabState = {
  config: SimulationConfig;
  time: number;
  mode: MotionMode;
  metrics: SimulationMetrics;
};

function formatValue(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

function buildReadouts(metrics: SimulationMetrics): ReadoutItem[] {
  return [
    { label: 'Acceleration', value: `${formatValue(metrics.acceleration)} m/s²` },
    { label: 'Normal force', value: `${formatValue(metrics.normalForce)} N` },
    { label: 'Friction force', value: `${formatValue(metrics.frictionForce)} N` },
    { label: 'Drag force', value: `${formatValue(metrics.dragForce)} N` },
    { label: 'Momentum', value: `${formatValue(metrics.momentum)} kg·m/s` },
    { label: 'Kinetic energy', value: `${formatValue(metrics.kineticEnergy)} J` },
    { label: 'Potential energy', value: `${formatValue(metrics.potentialEnergy)} J` },
    { label: 'Energy lost', value: `${formatValue(metrics.energyLost)} J` },
  ];
}

function getBlockPositions(blocks: Block[], rampLength: number, width: number, topY: number, leftX: number) {
  return blocks.map((block) => {
    const t = rampLength > 0 ? block.x / rampLength : 0;
    const x = leftX + t * width;
    const y = topY - t * width * 0.35;
    return { ...block, px: x, py: y };
  });
}

export default function Ramp() {
  const [scenario, setScenario] = useState<Scenario>('frictionless');
  const [running, setRunning] = useState(false);

  const currentPreset = useMemo(() => getPreset(scenario), [scenario]);

  const [state, setState] = useState<LabState>(() => {
    const config = currentPreset.config;
    return {
      config,
      time: 0,
      mode: 'idle',
      metrics: computeMetrics(config, config.blocks),
    };
  });

  useEffect(() => {
    const config = currentPreset.config;
    setState({
      config,
      time: 0,
      mode: 'idle',
      metrics: computeMetrics(config, config.blocks),
    });
    setRunning(false);
  }, [currentPreset]);

  useAnimationFrame(
    (_, deltaSeconds) => {
      setState((prev) => {
        const frame: SimulationFrame = {
          time: prev.time,
          config: prev.config,
          metrics: prev.metrics,
          blocks: prev.config.blocks,
          mode: prev.mode,
        };

        const next = stepSimulation(frame, deltaSeconds);
        const boundedBlocks = ensureInBounds(next.blocks, next.config.ramp.length);

        return {
          config: {
            ...next.config,
            blocks: boundedBlocks,
          },
          time: next.time,
          mode: 'running',
          metrics: computeMetrics(next.config, boundedBlocks),
        };
      });
    },
    running,
  );

  const readouts = useMemo(() => buildReadouts(state.metrics), [state.metrics]);

  function handleReset() {
    const preset = getPreset(scenario);
    setRunning(false);
    setState({
      config: preset.config,
      time: 0,
      mode: 'idle',
      metrics: computeMetrics(preset.config, preset.config.blocks),
    });
  }

  function handleTogglePlay() {
    setRunning((prev) => !prev);
    setState((prev) => ({ ...prev, mode: !running ? 'running' : 'idle' }));
  }

  const ramp = state.config.ramp;
  const blocks = getBlockPositions(state.config.blocks, ramp.length, 360, 250, 60);

  return (
    <section className="mech-dashboard" aria-label="Ramp dashboard">
      <aside className="mech-panel" aria-label="Controls">
        <div className="mech-panel__header">
          <h2>Controls</h2>
          <p>Choose a preset and control the motion.</p>
        </div>

        <div className="mech-panel__body mech-panel__body--scroll">
          <div className="controls">
            <label>
              Scenario
              <select value={scenario} onChange={(e) => setScenario(e.target.value as Scenario)}>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Preset description
              <textarea value={currentPreset.description} readOnly />
            </label>

            <div className="button-row">
              <button type="button" onClick={handleTogglePlay}>
                {running ? 'Pause' : 'Run'}
              </button>
              <button type="button" onClick={handleReset}>
                Reset
              </button>
            </div>

            <div className="callout">
              {running ? 'Simulation running.' : 'Ready to run. Select a preset to begin.'}
            </div>

            <div className="callout callout-lock">
              Current mode: <strong>{state.mode}</strong>
            </div>
          </div>
        </div>
      </aside>

      <section className="mech-panel" aria-label="Ramp simulation">
        <div className="mech-panel__header">
          <h2>Ramp</h2>
          <p>Position, slope, and block motion.</p>
        </div>

        <div className="mech-panel__body mech-panel__body--chart">
          <div className="chart-panel">
            <svg
              viewBox="0 0 480 320"
              role="img"
              aria-label="Inclined ramp with moving blocks"
              className="chart-stage"
            >
              <defs>
                <linearGradient id="rampGradient" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#121826" />
                  <stop offset="100%" stopColor="#0b0f1a" />
                </linearGradient>
              </defs>

              <rect x="0" y="0" width="480" height="320" fill="url(#rampGradient)" rx="16" />

              <line
                x1="70"
                y1="250"
                x2="390"
                y2={250 - ramp.angle * 0.9}
                stroke="rgba(238,242,246,0.16)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              <polygon
                points={`70,250 390,${250 - ramp.angle * 0.9} 410,${250 - ramp.angle * 0.9 + 8} 90,258`}
                fill="rgba(0, 194, 168, 0.08)"
                stroke="rgba(0, 194, 168, 0.28)"
                strokeWidth="1.5"
              />

              <text x="68" y="282" fill="#9aa5b1" fontSize="12">
                Ramp length: {formatValue(ramp.length, 1)} m
              </text>
              <text x="68" y="298" fill="#9aa5b1" fontSize="12">
                Angle: {formatValue(ramp.angle, 0)}°
              </text>

              {blocks.map((block) => (
                <g key={block.id} transform={`translate(${block.px - block.size * 14}, ${block.py - block.size * 14})`}>
                  <rect
                    x="0"
                    y="0"
                    width={block.size * 28}
                    height={block.size * 28}
                    rx="6"
                    fill={block.color ?? '#00c2a8'}
                    opacity="0.95"
                  />
                  <text x={block.size * 14} y={block.size * 18} fill="#0b0f1a" fontSize="11" textAnchor="middle">
                    {formatValue(block.mass, 1)} kg
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <aside className="mech-panel" aria-label="Values and notes">
        <div className="mech-panel__header">
          <h2>Values</h2>
          <p>Readouts and equations.</p>
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

          <ul className="formula-list">
            <li>
              <strong>Force:</strong> \\(F = ma\\)
            </li>
            <li>
              <strong>Momentum:</strong> \\(p = mv\\)
            </li>
            <li>
              <strong>Kinetic energy:</strong> \\(E\_k = \\frac{1}{2}mv^2\\)
            </li>
            <li>
              <strong>Potential energy:</strong> \\(E\_p = mgh\\)
            </li>
          </ul>

          <div className="hint">{currentPreset.notes ?? 'Select a preset to explore the model.'}</div>
        </div>
      </aside>
    </section>
  );
}
