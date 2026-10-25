import { useEffect, useMemo, useRef, useState } from 'react';
import Panel from '../shared/Panel';
import PresetPicker from '../shared/PresetPicker';
import SimControls from '../shared/SimControls';
import SuvatPanel from '../shared/SuvatPanel';
import Katex from '../shared/Katex';
import StoppingDistanceChart from './StoppingDistanceChart';
import { formatValue } from '../../lib/utils/format';
import {
  brakingDeceleration,
  brakingDistance,
  createInitialState,
  reactionDistance,
  stepStopping,
  stoppingDistanceCurve,
  totalStoppingDistance,
} from '../../lib/stopping-distance/physics';
import { ROAD_FRICTION, getStoppingPreset, stoppingPresets } from '../../lib/stopping-distance/presets';
import type { StoppingConfig, StoppingScenario, StoppingState } from '../../lib/stopping-distance/types';

const SPEED_ROWS = [5, 10, 13.4, 15, 20, 22.4, 25, 30, 31.3];

export default function StoppingDistance() {
  const [presetId, setPresetId] = useState<StoppingScenario>('alert-dry');
  const [speed, setSpeed] = useState(13.4);
  const [reactionTime, setReactionTime] = useState(0.7);
  const [roadKey, setRoadKey] = useState<keyof typeof ROAD_FRICTION>('Dry');
  const [running, setRunning] = useState(true);
  const [timeScale, setTimeScale] = useState(1);

  const cfg: StoppingConfig = useMemo(
    () => ({ gravity: 9.81, speed, reactionTime, friction: ROAD_FRICTION[roadKey] }),
    [speed, reactionTime, roadKey]
  );
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const stateRef = useRef<StoppingState>(createInitialState());
  const runningRef = useRef(running);
  runningRef.current = running;
  const timeScaleRef = useRef(timeScale);
  timeScaleRef.current = timeScale;

  const [display, setDisplay] = useState(stateRef.current);

  const applyPreset = (id: string) => {
    const preset = getStoppingPreset(id as StoppingScenario);
    setPresetId(preset.id);
    setSpeed(preset.config.speed);
    setReactionTime(preset.config.reactionTime);
    const match = Object.entries(ROAD_FRICTION).find(([, v]) => v === preset.config.friction);
    if (match) setRoadKey(match[0] as keyof typeof ROAD_FRICTION);
  };

  const resetSim = () => {
    stateRef.current = createInitialState();
    setDisplay(stateRef.current);
    setRunning(true);
  };

  useEffect(() => {
    resetSim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, reactionTime, roadKey]);

  useEffect(() => {
    let raf: number;
    let last: number | null = null;
    const tick = (ts: number) => {
      if (last === null) last = ts;
      const dtReal = Math.min(0.033, (ts - last) / 1000);
      last = ts;
      if (runningRef.current && stateRef.current.phase !== 'stopped') {
        const next = stepStopping(stateRef.current, dtReal * timeScaleRef.current, cfgRef.current);
        stateRef.current = next;
        setDisplay(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stepOnce = () => {
    setRunning(false);
    const next = stepStopping(stateRef.current, 1 / 60, cfgRef.current);
    stateRef.current = next;
    setDisplay(next);
  };

  const totalDist = totalStoppingDistance(cfg);
  const reactDist = reactionDistance(cfg);
  const brakeDist = brakingDistance(cfg);
  const decel = brakingDeceleration(cfg);
  const curve = stoppingDistanceCurve(cfg, SPEED_ROWS);

  const trackLen = Math.max(totalDist * 1.1, 5);
  const carPct = Math.min(1, display.distance / trackLen);

  const brakingElapsed = display.phase === 'braking' || display.phase === 'stopped' ? display.t - reactionTime : 0;
  const brakingDistSoFar = Math.max(0, display.distance - reactDist);

  return (
    <section className="mech-dashboard" aria-label="Stopping distance dashboard">
      <Panel title="Controls" subtitle="Speed, reaction time, and road grip.">
        <div className="controls">
          <PresetPicker value={presetId} onChange={applyPreset} presets={stoppingPresets} />

          <label>
            Speed
            <input type="range" min="2" max="35" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            <span>
              {formatValue(speed, 1)} m/s ({formatValue(speed * 3.6, 0)} km/h)
            </span>
          </label>

          <label>
            Reaction time
            <input type="range" min="0.2" max="2.5" step="0.1" value={reactionTime} onChange={(e) => setReactionTime(Number(e.target.value))} />
            <span>{reactionTime.toFixed(1)} s</span>
          </label>

          <label>
            Road condition
            <select value={roadKey} onChange={(e) => setRoadKey(e.target.value as keyof typeof ROAD_FRICTION)}>
              {Object.keys(ROAD_FRICTION).map((key) => (
                <option key={key} value={key}>
                  {key} (μ ≈ {ROAD_FRICTION[key].toFixed(2)})
                </option>
              ))}
            </select>
          </label>

          <SimControls
            running={running}
            onToggleRun={() => setRunning((r) => !r)}
            onReset={resetSim}
            onStep={stepOnce}
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
          />
        </div>
      </Panel>

      <section className="mech-panel" aria-label="Stopping animation">
        <div className="mech-panel__header">
          <h2>Thinking, then braking</h2>
          <p>The car covers the reaction distance at constant speed before any braking force is applied.</p>
        </div>
        <div className="mech-panel__body mech-panel__body--chart">
          <div className="chart-panel">
            <svg viewBox="0 0 640 200" className="chart-stage" role="img" aria-label="Car travelling then braking to a stop">
              <line x1={30} y1={140} x2={610} y2={140} stroke="rgba(238,242,246,0.18)" strokeWidth={2} />
              <line x1={30 + (reactDist / trackLen) * 580} y1={100} x2={30 + (reactDist / trackLen) * 580} y2={155} stroke="#60a5fa" strokeDasharray="4 3" />
              <text x={30 + (reactDist / trackLen) * 580} y={95} fontSize={10} fill="#60a5fa" textAnchor="middle">
                brakes on
              </text>
              <circle cx={30 + carPct * 580} cy={140} r={9} fill={display.phase === 'stopped' ? '#f87171' : '#00c2a8'} stroke="#0b0f1a" strokeWidth={2} />
              <text x={16} y={22} fill="#eef2f6" fontSize={13}>
                {display.phase === 'reacting' ? 'Reacting…' : display.phase === 'braking' ? 'Braking…' : 'Stopped'} &middot; t ={' '}
                {formatValue(display.t, 2)} s
              </text>
              <text x={16} y={40} fill="#9aa5b1" fontSize={12}>
                distance so far ≈ {formatValue(display.distance, 1)} m of {formatValue(totalDist, 1)} m total
              </text>
            </svg>
          </div>
        </div>
      </section>

      <Panel title="Values" subtitle="SUVAT for the braking phase, and the speed-vs-distance picture.">
        <dl className="value-list">
          <div>
            <dt>Reaction (thinking) distance</dt>
            <dd>{formatValue(reactDist, 1)} m</dd>
          </div>
          <div>
            <dt>Braking distance</dt>
            <dd>{formatValue(brakeDist, 1)} m</dd>
          </div>
          <div>
            <dt>Total stopping distance</dt>
            <dd>{formatValue(totalDist, 1)} m</dd>
          </div>
          <div>
            <dt>Braking deceleration</dt>
            <dd>{formatValue(decel, 2)} m/s²</dd>
          </div>
        </dl>

        <section className="equation-card" aria-label="How the distances are found">
          <div className="equation-card__header">
            <h3>Where the formulas come from</h3>
          </div>
          <p className="suvat-sub">Reaction distance is just speed times time (constant velocity, no SUVAT needed):</p>
          <Katex math="s_{\text{reaction}} = v t_{\text{reaction}}" display />
          <p className="suvat-sub">Braking distance comes from v² = u² + 2as, rearranged for s with the final speed v = 0:</p>
          <Katex math="s_{\text{braking}} = \dfrac{u^2}{2 \mu g}" display />
        </section>

        <SuvatPanel
          title="Braking phase"
          values={{ u: speed, v: display.phase === 'reacting' ? speed : display.speed, a: -decel, s: brakingDistSoFar, t: brakingElapsed }}
        />

        <h3 className="panel-subheading">Stopping distance vs speed</h3>
        <StoppingDistanceChart rows={curve} highlightSpeed={speed} />
        <p className="hint">
          Braking distance grows with the <em>square</em> of speed (u² in the formula above), so doubling your speed roughly
          quadruples how far you travel once the brakes go on — reaction distance only doubles.
        </p>
      </Panel>
    </section>
  );
}
