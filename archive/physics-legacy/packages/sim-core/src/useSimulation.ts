import { useCallback, useRef, useState } from "react";
import { useAnimationFrame } from "./useAnimationFrame";

export interface SimulationOptions<S> {
  /** Build the initial (and reset) state. Called again on reset(). */
  init: () => S;
  /** Pure step: return the next state after `dt` seconds. */
  step: (state: S, dt: number) => S;
  /** Fixed physics timestep in seconds. Keeps results independent of frame rate. Default 1/120. */
  fixedDt?: number;
  /** Cap on substeps per frame so a background tab can't spiral. Default 10. */
  maxSubsteps?: number;
  autoStart?: boolean;
}

export interface Simulation<S> {
  state: S;
  time: number;
  running: boolean;
  timeScale: number;
  setTimeScale: (v: number) => void;
  setRunning: (v: boolean) => void;
  toggle: () => void;
  reset: () => void;
  /** Advance exactly one fixed step (for a Step button). */
  stepOnce: () => void;
  /** Replace state directly (e.g. when a slider edits config). */
  setState: (next: S | ((prev: S) => S)) => void;
}

/**
 * The one simulation loop every lab should use: fixed-timestep accumulator,
 * play/pause/reset/step, time scale. Replaces per-lab rAF + state boilerplate.
 */
export function useSimulation<S>(opts: SimulationOptions<S>): Simulation<S> {
  const { init, step, fixedDt = 1 / 120, maxSubsteps = 10, autoStart = false } = opts;
  const [state, setStateRaw] = useState<S>(init);
  const [running, setRunning] = useState(autoStart);
  const [timeScale, setTimeScale] = useState(1);
  const [time, setTime] = useState(0);
  const acc = useRef(0);
  const stepRef = useRef(step);
  stepRef.current = step;
  const scaleRef = useRef(timeScale);
  scaleRef.current = timeScale;

  useAnimationFrame((_, dt) => {
    acc.current += Math.min(dt, 0.1) * scaleRef.current;
    let steps = 0;
    while (acc.current >= fixedDt && steps < maxSubsteps) {
      acc.current -= fixedDt;
      steps++;
    }
    if (steps === 0) return;
    setStateRaw((prev) => {
      let s = prev;
      for (let i = 0; i < steps; i++) s = stepRef.current(s, fixedDt);
      return s;
    });
    setTime((t) => t + steps * fixedDt);
  }, running);

  const reset = useCallback(() => {
    setRunning(false);
    acc.current = 0;
    setTime(0);
    setStateRaw(init());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  const stepOnce = useCallback(() => {
    setStateRaw((prev) => stepRef.current(prev, fixedDt));
    setTime((t) => t + fixedDt);
  }, [fixedDt]);

  return {
    state, time, running, timeScale, setTimeScale, setRunning,
    toggle: () => setRunning((r) => !r),
    reset, stepOnce,
    setState: setStateRaw,
  };
}
