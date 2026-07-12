import { useEffect, useMemo, useRef, useState } from 'react';
import Panel from './shared/Panel';
import PresetPicker from './shared/PresetPicker';
import SimControls from './shared/SimControls';
import SuvatPanel from './shared/SuvatPanel';
import ConservationPanel from './shared/ConservationPanel';
import { PLANETS } from '../lib/utils/planets';
import { formatValue } from '../lib/utils/format';
import {
  createInitialState,
  idealMaxHeight,
  idealRange,
  idealTimeOfFlight,
  stepProjectile,
} from '../lib/projectile/physics';
import { getProjectilePreset, projectilePresets } from '../lib/projectile/presets';
import type { ProjectileConfig, ProjectileScenario, ProjectileState } from '../lib/projectile/types';

const VIEW_W = 640;
const VIEW_H = 360;
const MARGIN = 44;

export default function Projectile() {
  const [presetId, setPresetId] = useState<ProjectileScenario>('no-drag-45');
  const [gravity, setGravity] = useState(9.81);
  const [launchSpeed, setLaunchSpeed] = useState(20);
  const [launchAngleDeg, setLaunchAngleDeg] = useState(45);
  const [launchHeight, setLaunchHeight] = useState(0);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [dragCoefficient, setDragCoefficient] = useState(0.02);
  const [mass, setMass] = useState(1);
  const [running, setRunning] = useState(true);
  const [timeScale, setTimeScale] = useState(1);

  const stateRef = useRef<ProjectileState>(createInitialState({
    gravity: 9.81,
    mass: 1,
    launchSpeed: 20,
    launchAngleDeg: 45,
    launchHeight: 0,
    dragEnabled: false,
    dragCoefficient: 0.02,
  }));
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const runningRef = useRef(running);
  runningRef.current = running;
  const timeScaleRef = useRef(timeScale);
  timeScaleRef.current = timeScale;

  const [display, setDisplay] = useState(stateRef.current);
  const [trailVersion, setTrailVersion] = useState(0);

  const cfg: ProjectileConfig = useMemo(
    () => ({ gravity, mass, launchSpeed, launchAngleDeg, launchHeight, dragEnabled, dragCoefficient }),
    [gravity, mass, launchSpeed, launchAngleDeg, launchHeight, dragEnabled, dragCoefficient]
  );
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const applyPreset = (id: string) => {
    const preset = getProjectilePreset(id as ProjectileScenario);
    setPresetId(preset.id);
    setGravity(preset.config.gravity);
    setLaunchSpeed(preset.config.launchSpeed);
    setLaunchAngleDeg(preset.config.launchAngleDeg);
    setLaunchHeight(preset.config.launchHeight);
    setDragEnabled(preset.config.dragEnabled);
    setDragCoefficient(preset.config.dragCoefficient);
    setMass(preset.config.mass);
  };

  const resetSim = () => {
    stateRef.current = createInitialState(cfgRef.current);
    trailRef.current = [{ x: stateRef.current.x, y: stateRef.current.y }];
    setDisplay(stateRef.current);
    setTrailVersion((v) => v + 1);
    setRunning(true);
  };

  useEffect(() => {
    resetSim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gravity, launchSpeed, launchAngleDeg, launchHeight, dragEnabled, dragCoefficient, mass, presetId]);

  useEffect(() => {
    let raf: number;
    let last: number | null = null;

    const tick = (ts: number) => {
      if (last === null) last = ts;
      const dtReal = Math.min(0.033, (ts - last) / 1000);
      last = ts;

      if (runningRef.current && !stateRef.current.landed) {
        const dt = dtReal * timeScaleRef.current;
        const next = stepProjectile(stateRef.current, dt, cfgRef.current);
        stateRef.current = next;
        trailRef.current.push({ x: next.x, y: next.y });
        if (trailRef.current.length > 600) trailRef.current.shift();
        setDisplay(next);
        setTrailVersion((v) => v + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stepOnce = () => {
    setRunning(false);
    const next = stepProjectile(stateRef.current, 1 / 60, cfgRef.current);
    stateRef.current = next;
    trailRef.current.push({ x: next.x, y: next.y });
    setDisplay(next);
    setTrailVersion((v) => v + 1);
  };

  const range = idealRange(cfg);
  const maxHeight = idealMaxHeight(cfg);
  const timeOfFlight = idealTimeOfFlight(cfg);

  const scale = Math.min(
    (VIEW_W - 2 * MARGIN) / Math.max(range * 1.15, 4),
    (VIEW_H - 2 * MARGIN) / Math.max(maxHeight * 1.3, cfg.launchHeight + 4, 4)
  );
  const groundY = VIEW_H - MARGIN;
  const toPx = (x: number, y: number) => ({ px: MARGIN + x * scale, py: groundY - y * scale });

  const trailPoints = trailRef.current.map((p) => toPx(p.x, p.y));
  const pathD = trailPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' ');
  const current = toPx(display.x, display.y);
  const speed = Math.hypot(display.vx, display.vy);
  const initialEnergy = 0.5 * mass * launchSpeed * launchSpeed + mass * gravity * launchHeight;
  const nowEnergy = 0.5 * mass * speed * speed + mass * gravity * display.y;

  return (
    <section className="mech-dashboard" aria-label="Projectile motion dashboard">
      <Panel title="Controls" subtitle="Launch speed, angle, height, gravity, and air resistance.">
        <div className="controls">
          <PresetPicker value={presetId} onChange={applyPreset} presets={projectilePresets} />

          <label>
            World / gravity
            <select
              value={Object.keys(PLANETS).find((k) => PLANETS[k] === gravity) ?? 'Earth'}
              onChange={(e) => setGravity(PLANETS[e.target.value])}
            >
              {Object.keys(PLANETS).map((p) => (
                <option key={p} value={p}>
                  {p} ({PLANETS[p]} m/s²)
                </option>
              ))}
            </select>
          </label>

          <label>
            Launch speed
            <input type="range" min="2" max="40" step="0.5" value={launchSpeed} onChange={(e) => setLaunchSpeed(Number(e.target.value))} />
            <span>{launchSpeed.toFixed(1)} m/s</span>
          </label>

          <label>
            Launch angle
            <input type="range" min="0" max="90" step="1" value={launchAngleDeg} onChange={(e) => setLaunchAngleDeg(Number(e.target.value))} />
            <span>{launchAngleDeg.toFixed(0)}°</span>
          </label>

          <label>
            Launch height
            <input type="range" min="0" max="40" step="1" value={launchHeight} onChange={(e) => setLaunchHeight(Number(e.target.value))} />
            <span>{launchHeight.toFixed(0)} m</span>
          </label>

          <label className="checkbox-row">
            <input type="checkbox" checked={dragEnabled} onChange={(e) => setDragEnabled(e.target.checked)} />
            Enable air resistance (F = k·v²)
          </label>
          {dragEnabled && (
            <>
              <label>
                Drag coefficient k
                <input
                  type="range"
                  min="0.005"
                  max="0.1"
                  step="0.005"
                  value={dragCoefficient}
                  onChange={(e) => setDragCoefficient(Number(e.target.value))}
                />
                <span>{dragCoefficient.toFixed(3)}</span>
              </label>
              <label>
                Mass
                <input type="range" min="0.05" max="10" step="0.05" value={mass} onChange={(e) => setMass(Number(e.target.value))} />
                <span>{mass.toFixed(2)} kg</span>
              </label>
            </>
          )}

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

      <section className="mech-panel" aria-label="Trajectory">
        <div className="mech-panel__header">
          <h2>Trajectory</h2>
          <p>Horizontal and vertical motion are independent — that's the whole trick.</p>
        </div>
        <div className="mech-panel__body mech-panel__body--chart">
          <div className="chart-panel">
            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="chart-stage" role="img" aria-label="Projectile trajectory">
              <line x1={0} y1={groundY} x2={VIEW_W} y2={groundY} stroke="rgba(238,242,246,0.18)" strokeWidth={2} />
              {trailPoints.length > 1 && <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth={2} opacity={0.85} />}
              <circle cx={current.px} cy={current.py} r={8} fill={display.landed ? '#f87171' : '#00c2a8'} stroke="#0b0f1a" strokeWidth={2} />
              <text x={16} y={22} fill="#eef2f6" fontSize={13}>
                t = {formatValue(display.t)} s{display.landed ? ' (landed)' : ''}
              </text>
              <text x={16} y={40} fill="#9aa5b1" fontSize={12}>
                ideal range ≈ {formatValue(range, 1)} m &middot; max height ≈ {formatValue(maxHeight, 1)} m &middot; flight time ≈{' '}
                {formatValue(timeOfFlight, 1)} s
              </text>
            </svg>
          </div>
          <p className="hint">
            {dragEnabled
              ? 'With drag on, the numbers above are the no-drag ideal for comparison — the actual flight (blue trail) falls short of them.'
              : 'With no air resistance, the blue trail should land almost exactly on the ideal range shown above.'}
          </p>
        </div>
      </section>

      <Panel title="Values" subtitle="Per-axis SUVAT and energy conservation.">
        <dl className="value-list">
          <div>
            <dt>Position (x, y)</dt>
            <dd>
              {formatValue(display.x, 1)} m, {formatValue(display.y, 1)} m
            </dd>
          </div>
          <div>
            <dt>Velocity (vx, vy)</dt>
            <dd>
              {formatValue(display.vx, 1)}, {formatValue(display.vy, 1)} m/s
            </dd>
          </div>
          <div>
            <dt>Speed</dt>
            <dd>{formatValue(speed, 2)} m/s</dd>
          </div>
        </dl>

        <SuvatPanel
          title="Horizontal axis"
          values={{ u: launchSpeed * Math.cos((launchAngleDeg * Math.PI) / 180), v: display.vx, a: dragEnabled ? NaN : 0, s: display.x, t: display.t }}
        />
        {dragEnabled && (
          <p className="hint">
            Horizontal acceleration isn&apos;t constant with drag enabled, so the horizontal SUVAT numbers above are only
            approximate.
          </p>
        )}

        <SuvatPanel
          title="Vertical axis"
          values={{
            u: launchSpeed * Math.sin((launchAngleDeg * Math.PI) / 180),
            v: display.vy,
            a: -gravity,
            s: display.y - launchHeight,
            t: display.t,
          }}
        />

        <ConservationPanel
          energy={{
            kinetic: 0.5 * mass * speed * speed,
            potential: mass * gravity * display.y,
            dissipated: display.energyDissipated,
            initialTotal: initialEnergy,
          }}
        />
        <p className="hint">
          {dragEnabled
            ? 'Both components of momentum change continuously here, since air resistance pushes back on the projectile in every direction.'
            : 'Horizontal momentum (mvx) stays constant throughout the flight, since gravity only acts vertically — only vertical momentum changes.'}
        </p>
        <p className="hint">Energy right now: {formatValue(nowEnergy, 1)} J (kinetic + potential, excluding drag losses).</p>
      </Panel>
    </section>
  );
}
