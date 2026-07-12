import { useEffect, useMemo, useRef, useState } from 'react';
import Panel from './shared/Panel';
import PresetPicker from './shared/PresetPicker';
import SimControls from './shared/SimControls';
import ConservationPanel from './shared/ConservationPanel';
import Katex from './shared/Katex';
import { cradlePresets, getCradlePreset } from '../lib/newtons-cradle/presets';
import { computeCradleMetrics, heightOf, stepCradle, tangentialSpeed, xPositionOf } from '../lib/newtons-cradle/physics';
import type { CradleFrame, CradleScenario } from '../lib/newtons-cradle/types';

const PX_PER_M = 220;
const PIVOT_Y = 46;

function cloneFrame(preset: ReturnType<typeof getCradlePreset>): CradleFrame {
  return {
    time: 0,
    pendulums: preset.pendulums.map((p) => ({ ...p })),
    config: { ...preset.config },
  };
}

export default function NewtonsCradle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<CradleFrame>(cloneFrame(getCradlePreset('one-in')));
  const initialMetricsRef = useRef(computeCradleMetrics(frameRef.current.pendulums, frameRef.current.config.gravity));
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const runningRef = useRef(true);
  const timeScaleRef = useRef(1);

  const [presetId, setPresetId] = useState<CradleScenario>('one-in');
  const [restitution, setRestitution] = useState(1);
  const [pullAngle, setPullAngle] = useState(0.6);
  const [running, setRunning] = useState(true);
  const [timeScale, setTimeScale] = useState(1);
  const [readout, setReadout] = useState(() => computeCradleMetrics(frameRef.current.pendulums, frameRef.current.config.gravity));

  runningRef.current = running;
  timeScaleRef.current = timeScale;

  const preset = useMemo(() => getCradlePreset(presetId), [presetId]);

  const resetSim = () => {
    const next = cloneFrame(preset);
    next.config.restitution = restitution;
    const pulledCount = presetId === 'two-in' ? 2 : 1;
    next.pendulums = next.pendulums.map((p, i) =>
      i < pulledCount ? { ...p, theta: -pullAngle, omega: 0 } : { ...p, theta: 0, omega: 0 }
    );
    frameRef.current = next;
    const metrics = computeCradleMetrics(next.pendulums, next.config.gravity);
    initialMetricsRef.current = metrics;
    setReadout(metrics);
  };

  useEffect(() => {
    setRestitution(preset.config.restitution);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  useEffect(() => {
    resetSim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId, restitution, pullAngle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0b0f1a';
      ctx.fillRect(0, 0, w, h);

      const frame = frameRef.current;
      const centerX = w / 2;

      ctx.strokeStyle = 'rgba(238,242,246,0.16)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 200, PIVOT_Y - 8);
      ctx.lineTo(centerX + 200, PIVOT_Y - 8);
      ctx.stroke();

      for (const p of frame.pendulums) {
        const pivotX = centerX + p.restX * PX_PER_M;
        const ballX = pivotX + p.length * Math.sin(p.theta) * PX_PER_M;
        const ballY = PIVOT_Y + p.length * Math.cos(p.theta) * PX_PER_M;
        const radiusPx = frame.config.ballRadius * PX_PER_M;

        ctx.strokeStyle = 'rgba(238,242,246,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pivotX, PIVOT_Y);
        ctx.lineTo(ballX, ballY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ballX, ballY, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = p.color ?? '#00c2a8';
        ctx.fill();
        ctx.strokeStyle = 'rgba(11,15,26,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#0b0f1a';
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.mass.toFixed(1)}kg`, ballX, ballY + 4);
      }
      ctx.textAlign = 'left';
    };

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dtReal = Math.min(0.033, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      if (runningRef.current) {
        const dt = dtReal * timeScaleRef.current;
        const substeps = 4;
        let frame = frameRef.current;
        for (let i = 0; i < substeps; i++) {
          frame = stepCradle(frame, dt / substeps);
        }
        frameRef.current = frame;
        const metrics = computeCradleMetrics(frame.pendulums, frame.config.gravity);
        setReadout(metrics);
      }

      draw();
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepOnce = () => {
    setRunning(false);
    frameRef.current = stepCradle(frameRef.current, 1 / 60);
    setReadout(computeCradleMetrics(frameRef.current.pendulums, frameRef.current.config.gravity));
  };

  const initial = initialMetricsRef.current;

  return (
    <section className="mech-dashboard" aria-label="Newton's cradle dashboard">
      <Panel title="Controls" subtitle="Choose a scenario and set it swinging.">
        <div className="controls">
          <PresetPicker value={presetId} onChange={(id) => setPresetId(id as CradleScenario)} presets={cradlePresets} />

          <label>
            Pull-back angle
            <input type="range" min="0.2" max="1.1" step="0.01" value={pullAngle} onChange={(e) => setPullAngle(Number(e.target.value))} />
            <span>
              {pullAngle.toFixed(2)} rad ({((pullAngle * 180) / Math.PI).toFixed(0)}°)
            </span>
          </label>

          <label>
            Restitution (e)
            <input type="range" min="0.3" max="1" step="0.01" value={restitution} onChange={(e) => setRestitution(Number(e.target.value))} />
            <span>
              {restitution.toFixed(2)} ({restitution >= 0.995 ? 'elastic' : 'lossy'})
            </span>
          </label>

          <SimControls
            running={running}
            onToggleRun={() => setRunning((r) => !r)}
            onReset={resetSim}
            onStep={stepOnce}
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
          />

          {preset.notes && <p className="callout">{preset.notes}</p>}
        </div>
      </Panel>

      <section className="mech-panel" aria-label="Cradle simulation">
        <div className="mech-panel__header">
          <h2>Newton&apos;s Cradle</h2>
          <p>Each ball is a real pendulum, not a canned animation.</p>
        </div>
        <div className="mech-panel__body mech-panel__body--chart">
          <div className="chart-panel">
            <canvas ref={canvasRef} className="chart-stage" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </section>

      <Panel title="Values" subtitle="Momentum, energy, and the collision rule.">
        <ConservationPanel
          momentum={{ before: initial.momentum, after: readout.momentum }}
          energy={{
            kinetic: readout.kineticEnergy,
            potential: readout.potentialEnergy,
            dissipated: initial.totalEnergy - readout.totalEnergy > 0 ? initial.totalEnergy - readout.totalEnergy : 0,
            initialTotal: initial.totalEnergy,
          }}
        />

        <section className="equation-card" aria-label="Collision rule">
          <div className="equation-card__header">
            <h3>The collision rule</h3>
            <p>The same 1D restitution formula used throughout this lab &mdash; only the geometry (a swing instead of a ramp) changes.</p>
          </div>
          <Katex math="v_1' = \dfrac{(m_1 - e m_2)v_1 + (1+e)m_2 v_2}{m_1 + m_2}" display />
          <Katex math="v_2' = \dfrac{(m_2 - e m_1)v_2 + (1+e)m_1 v_1}{m_1 + m_2}" display />
          <p className="hint">
            e = 1 conserves kinetic energy exactly (elastic); e &lt; 1 conserves momentum but loses kinetic energy to sound and
            deformation at each click.
          </p>
        </section>

        <p className="hint">
          Not shown here: SUVAT. A pendulum&apos;s acceleration changes continuously with its angle, so the constant-acceleration
          equations don&apos;t apply &mdash; energy and momentum conservation are the right tools instead.
        </p>
      </Panel>
    </section>
  );
}

export { tangentialSpeed, xPositionOf, heightOf };
