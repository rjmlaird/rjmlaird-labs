import { LabGrid, Panel, ReadoutList, SimControls, SliderField } from "@labs/ui";
import { formatValue, useCanvas2D, useSimHotkeys, useSimulation } from "@labs/sim-core";
import { useState } from "react";

// 1. Pure physics: state in, state out. No React, no DOM — easy to unit test.
type State = { x: number; v: number };
const step = (s: State, dt: number): State => ({ x: s.x + s.v * dt, v: s.v });

export default function Experiment() {
  const [speed, setSpeed] = useState(2);
  const sim = useSimulation<State>({ init: () => ({ x: 0, v: speed }), step });
  useSimHotkeys({ toggle: sim.toggle, reset: sim.reset });

  // 2. Drawing: DPR + resize handled for you.
  const canvasRef = useCanvas2D((ctx, { width, height }) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(ctx.canvas).getPropertyValue("--accent") || "#0cc";
    ctx.beginPath();
    ctx.arc((sim.state.x * 40) % width, height / 2, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Layout from shared panels.
  return (
    <LabGrid>
      <Panel title="Controls">
        <div className="controls">
          <SliderField label="Speed" value={speed} min={0} max={10} step={0.5} unit="m/s" onChange={setSpeed} />
          <SimControls running={sim.running} onToggleRun={sim.toggle} onReset={sim.reset} timeScale={sim.timeScale} onTimeScaleChange={sim.setTimeScale} />
        </div>
      </Panel>
      <Panel title="Simulation" scroll={false}>
        <canvas ref={canvasRef} style={{ width: "100%", height: 320 }} />
      </Panel>
      <Panel title="Values">
        <ReadoutList items={[{ label: "Position", value: `${formatValue(sim.state.x)} m` }, { label: "Time", value: `${formatValue(sim.time)} s` }]} />
      </Panel>
    </LabGrid>
  );
}
