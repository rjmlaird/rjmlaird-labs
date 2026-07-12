import { useEffect, useMemo, useRef, useState } from 'react';
import useAnimationFrame from '../hooks/useAnimationFrame';
import { computeMetrics, ensureInBounds, stepSimulation } from '../lib/ramp/physics';
import { getPreset, presets } from '../lib/ramp/presets';
import Panel from './shared/Panel';
import PresetPicker from './shared/PresetPicker';
import SimControls from './shared/SimControls';
import SuvatPanel from './shared/SuvatPanel';
import ConservationPanel from './shared/ConservationPanel';
import { formatValue } from '../lib/utils/format';
import type { Block, MotionMode, Scenario, SimulationConfig, SimulationFrame, SimulationMetrics } from '../lib/ramp/types';

type LabState = {
  config: SimulationConfig;
  time: number;
  mode: MotionMode;
  metrics: SimulationMetrics;
};

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
  const [timeScale, setTimeScale] = useState(1);

  const currentPreset = useMemo(() => getPreset(scenario), [scenario]);
  const initialMetricsRef = useRef<SimulationMetrics>(computeMetrics(currentPreset.config, currentPreset.config.blocks));
  const dissipatedRef = useRef(0);

  const [state, setState] = useState<LabState>(() => {
    const config = currentPreset.config;
    const metrics = computeMetrics(config, config.blocks);
    initialMetricsRef.current = metrics;
    return { config, time: 0, mode: 'idle', metrics };
  });

  useEffect(() => {
    const config = currentPreset.config;
    const metrics = computeMetrics(config, config.blocks);
    initialMetricsRef.current = metrics;
    dissipatedRef.current = 0;
    setState({ config, time: 0, mode: 'idle', metrics });
    setRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPreset]);

  useAnimationFrame((_, deltaSeconds) => {
    setState((prev) => {
      const frame: SimulationFrame = {
        time: prev.time,
        config: prev.config,
        metrics: prev.metrics,
        blocks: prev.config.blocks,
        mode: prev.mode,
      };

      const dt = deltaSeconds * timeScale;
      const next = stepSimulation(frame, dt);
      const boundedBlocks = ensureInBounds(next.blocks, next.config.ramp.length);
      const metrics = computeMetrics(next.config, boundedBlocks);
      dissipatedRef.current += metrics.energyLost * dt;

      return {
        config: { ...next.config, blocks: boundedBlocks },
        time: next.time,
        mode: 'running',
        metrics,
      };
    });
  }, running);

  function handleReset() {
    const preset = getPreset(scenario);
    const metrics = computeMetrics(preset.config, preset.config.blocks);
    initialMetricsRef.current = metrics;
    dissipatedRef.current = 0;
    setRunning(false);
    setState({ config: preset.config, time: 0, mode: 'idle', metrics });
  }

  function handleToggleRun() {
    setRunning((prev) => !prev);
    setState((prev) => ({ ...prev, mode: !running ? 'running' : 'idle' }));
  }

  function handleStep() {
    setRunning(false);
    setState((prev) => {
      const frame: SimulationFrame = {
        time: prev.time,
        config: prev.config,
        metrics: prev.metrics,
        blocks: prev.config.blocks,
        mode: 'paused',
      };
      const next = stepSimulation(frame, 1 / 60);
      const boundedBlocks = ensureInBounds(next.blocks, next.config.ramp.length);
      return {
        config: { ...next.config, blocks: boundedBlocks },
        time: next.time,
        mode: 'paused',
        metrics: computeMetrics(next.config, boundedBlocks),
      };
    });
  }

  const ramp = state.config.ramp;
  const blocks = getBlockPositions(state.config.blocks, ramp.length, 360, 250, 60);
  const lead = state.config.blocks[0];
  const initialLead = currentPreset.config.blocks[0];
  const angleRad = (ramp.angle * Math.PI) / 180;
  const initialMetrics = initialMetricsRef.current;

  return (
    <section className="mech-dashboard" aria-label="Ramp dashboard">
      <Panel title="Controls" subtitle="Choose a preset and control the motion.">
        <div className="controls">
          <PresetPicker value={scenario} onChange={(id) => setScenario(id as Scenario)} presets={presets} />

          <SimControls
            running={running}
            onToggleRun={handleToggleRun}
            onReset={handleReset}
            onStep={handleStep}
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
          />

          <div className="callout callout-lock">
            Current mode: <strong>{state.mode}</strong>
          </div>
        </div>
      </Panel>

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
                Angle: {formatValue(ramp.angle, 0)}&deg;
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
          {lead?.locked && (
            <p className="callout callout-lock">
              🔒 Static friction is holding this block still — it won&apos;t move until gravity along the slope
              exceeds the maximum static friction force.
            </p>
          )}
        </div>
      </section>

      <Panel title="Values" subtitle="Readouts, SUVAT, and conservation checks.">
        <dl className="value-list">
          <div>
            <dt>Acceleration</dt>
            <dd>{formatValue(state.metrics.acceleration)} m/s²</dd>
          </div>
          <div>
            <dt>Normal force</dt>
            <dd>{formatValue(state.metrics.normalForce)} N</dd>
          </div>
          <div>
            <dt>Friction force</dt>
            <dd>{formatValue(state.metrics.frictionForce)} N</dd>
          </div>
          <div>
            <dt>Drag force</dt>
            <dd>{formatValue(state.metrics.dragForce)} N</dd>
          </div>
        </dl>

        {lead && (
          <SuvatPanel
            values={{
              u: initialLead?.v ?? 0,
              v: lead.v,
              a: state.metrics.acceleration,
              s: lead.x - (initialLead?.x ?? 0),
              t: state.time,
            }}
          />
        )}

        <ConservationPanel
          energy={{
            kinetic: state.metrics.kineticEnergy,
            potential: state.metrics.potentialEnergy,
            dissipated: dissipatedRef.current,
            initialTotal: initialMetrics.kineticEnergy + initialMetrics.potentialEnergy,
          }}
          momentum={
            state.config.blocks.length > 1
              ? { before: initialMetrics.momentum, after: state.metrics.momentum }
              : undefined
          }
        />

        <p className="hint">{currentPreset.notes ?? 'Select a preset to explore the model.'}</p>
        <p className="hint">
          Ramp angle in radians: {formatValue(angleRad, 3)} &middot; used directly in every force calculation above.
        </p>
      </Panel>
    </section>
  );
}
