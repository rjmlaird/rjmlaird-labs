import React, { useEffect, useMemo, useRef, useState } from "react";

type Bob = {
  theta: number;
  omega: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Props = {
  count?: number;
  length?: number;
  radius?: number;
  gravity?: number;
  restitution?: number;
  damping?: number;
  initialPull?: number;
  background?: string;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function NewtonsCradleDemo({
  count = 5,
  length = 180,
  radius = 18,
  gravity = 1400,
  restitution = 0.995,
  damping = 0.0015,
  initialPull = 0.9,
  background = "#0b1020",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const runningRef = useRef(true);

  const [running, setRunning] = useState(true);
  const [releaseN, setReleaseN] = useState(1);
  const [pull, setPull] = useState(initialPull);
  const [readout, setReadout] = useState({ p: 0, ke: 0 });

  const config = useMemo(
    () => ({ count, length, radius, gravity, restitution, damping, background }),
    [count, length, radius, gravity, restitution, damping, background]
  );

  const stateRef = useRef<Bob[]>([]);

  const makeState = (n = releaseN) => {
    const arr: Bob[] = [];
    for (let i = 0; i < config.count; i++) {
      arr.push({
        theta: i < n ? -pull : 0,
        omega: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      });
    }
    return arr;
  };

  const reset = (n = releaseN) => {
    stateRef.current = makeState(n);
    lastTsRef.current = null;
    setReadout({ p: 0, ke: 0 });
  };

  useEffect(() => {
    reset(releaseN);
  }, [config.count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const getPivots = (w: number) => {
    const totalWidth = config.count * config.radius * 2 + (config.count - 1) * 6;
    const startX = (w - totalWidth) / 2 + config.radius;
    const pivotY = 70;

    return Array.from({ length: config.count }, (_, i) => ({
      x: startX + i * (config.radius * 2 + 6),
      y: pivotY,
    }));
  };

  const computeBobPositions = (arr: Bob[], w: number) => {
    const pivots = getPivots(w);
    for (let i = 0; i < arr.length; i++) {
      const bob = arr[i];
      const p = pivots[i];
      bob.x = p.x + config.length * Math.sin(bob.theta);
      bob.y = p.y + config.length * Math.cos(bob.theta);
    }
    return pivots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = config.background;
      ctx.fillRect(0, 0, w, h);

      const arr = stateRef.current;
      const pivots = computeBobPositions(arr, w);

      for (let i = 0; i < arr.length; i++) {
        const bob = arr[i];
        const p = pivots[i];

        ctx.strokeStyle = "#7dd3fc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(bob.x, bob.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bob.x, bob.y, config.radius, 0, Math.PI * 2);
        ctx.fillStyle = Math.abs(bob.omega) > 0.001 ? "#38bdf8" : "#e2e8f0";
        ctx.fill();
        ctx.strokeStyle = "#1f2937";
        ctx.stroke();
      }

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText("Newton's cradle", 16, 22);
      ctx.fillText(`p = ${readout.p.toFixed(2)}   K = ${readout.ke.toFixed(2)}`, 16, 42);
      ctx.fillText(`release = ${releaseN}   pull = ${pull.toFixed(2)} rad`, 16, 62);
      ctx.fillText(`e = ${config.restitution.toFixed(3)}   damping = ${config.damping.toFixed(4)}`, 16, 82);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("p = Σmv   K = Σ½mv²", 16, h - 18);
    };

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min(0.02, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      if (runningRef.current) {
        const arr = stateRef.current;
        computeBobPositions(arr, canvas.clientWidth);

        const substeps = 4;
        const hdt = dt / substeps;

        for (let s = 0; s < substeps; s++) {
          for (const bob of arr) {
            const a =
              -(config.gravity / config.length) * Math.sin(bob.theta) -
              config.damping * bob.omega;
            bob.omega += a * hdt;
            bob.theta += bob.omega * hdt;
          }

          for (let i = 0; i < arr.length - 1; i++) {
            const left = arr[i];
            const right = arr[i + 1];

            const dx = right.x - left.x;
            const minDx = config.radius * 2;

            if (Math.abs(dx) < minDx && left.vx > right.vx) {
              const m1 = 1;
              const m2 = 1;
              const v1 = left.vx;
              const v2 = right.vx;

              const v1p =
                ((m1 - m2) / (m1 + m2)) * v1 +
                ((2 * m2) / (m1 + m2)) * v2;
              const v2p =
                ((2 * m1) / (m1 + m2)) * v1 +
                ((m2 - m1) / (m1 + m2)) * v2;

              left.vx = v1p * config.restitution;
              right.vx = v2p * config.restitution;

              left.omega = left.vx / config.length;
              right.omega = right.vx / config.length;

              const overlap = minDx - Math.abs(dx);
              const shift = overlap / 2 + 0.01;
              left.theta -= Math.sign(dx) * shift / config.length;
              right.theta += Math.sign(dx) * shift / config.length;
            }
          }

          for (const bob of arr) {
            bob.vx = config.length * bob.omega * Math.cos(bob.theta);
            bob.vy = -config.length * bob.omega * Math.sin(bob.theta);
          }
        }

        let p = 0;
        let ke = 0;
        for (const bob of arr) {
          p += bob.vx;
          ke += 0.5 * (bob.vx * bob.vx + bob.vy * bob.vy);
        }
        setReadout({ p, ke });
      }

      draw();
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config, pull, releaseN]);

  const onReset = () => reset(releaseN);

  const onRelease = () => {
    stateRef.current = makeState(releaseN);
    setRunning(true);
    runningRef.current = true;
    lastTsRef.current = null;
  };

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "1fr 280px",
        alignItems: "start",
        color: "#e2e8f0",
        background: "#0f172a",
        padding: 16,
        borderRadius: 16,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: 420,
          borderRadius: 12,
          background: config.background,
        }}
      />

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Newton's cradle</div>

        <label style={{ display: "grid", gap: 6 }}>
          Release balls: {releaseN}
          <input
            type="range"
            min={1}
            max={Math.max(1, Math.min(3, config.count))}
            value={releaseN}
            onChange={(e) => setReleaseN(Number(e.target.value))}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Pull angle: {pull.toFixed(2)} rad
          <input
            type="range"
            min={0.2}
            max={1.2}
            step={0.01}
            value={pull}
            onChange={(e) => setPull(Number(e.target.value))}
          />
        </label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setRunning((v) => !v)}>
            {running ? "Pause" : "Play"}
          </button>
          <button onClick={onReset}>Reset</button>
          <button onClick={onRelease}>Release</button>
        </div>

        <div
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 13,
            lineHeight: 1.5,
            padding: 12,
            borderRadius: 12,
            background: "#111827",
          }}
        >
          <div>p = Σmv</div>
          <div>K = Σ½mv²</div>
          <div>v1' = ((m1 - m2)/(m1 + m2))v1 + (2m2/(m1 + m2))v2</div>
          <div>v2' = (2m1/(m1 + m2))v1 + ((m2 - m1)/(m1 + m2))v2</div>
        </div>
      </div>
    </div>
  );
}
