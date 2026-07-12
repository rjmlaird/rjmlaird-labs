import { useEffect, useMemo, useState } from 'react';
import useAnimationFrame from './useAnimationFrame';
import { computeMetrics, ensureInBounds, stepSimulation } from '../lib/ramp/physics';
import { getPreset, presets } from '../lib/ramp/presets';
import type {
  MotionMode,
  Scenario,
  SimulationConfig,
  SimulationFrame,
  SimulationMetrics,
  ReadoutItem,
} from '../lib/ramp/types';

type LabState = {
  config: SimulationConfig;
  time: number;
  mode: MotionMode;
  metrics: SimulationMetrics;
};

type UseRampSimulationResult = {
  scenario: Scenario;
  setScenario: React.Dispatch<React.SetStateAction<Scenario>>;
  running: boolean;
  state: LabState;
  presets: typeof presets;
  currentPreset: ReturnType<typeof getPreset>;
  readouts: ReadoutItem[];
  handleReset: () => void;
  handleTogglePlay: () => void;
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

export function useRampSimulation(): UseRampSimulationResult {
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

  return {
    scenario,
    setScenario,
    running,
    state,
    presets,
    currentPreset,
    readouts,
    handleReset,
    handleTogglePlay,
  };
}
