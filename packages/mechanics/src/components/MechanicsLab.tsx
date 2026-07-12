import { useEffect, useMemo, useRef, useState } from 'react';
import p5 from 'p5';
import {
  Block,
  LabConfig,
  createBlock,
  kineticEnergy,
  momentum,
  potentialEnergy,
  speedOf,
  updateBlock,
} from '../lib/physics';

type Props = {
  initialRampAngle?: number;
};

export default function MechanicsLab({ initialRampAngle = 28 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const p5Ref = useRef<p5 | null>(null);

  const [gravity, setGravity] = useState(9.8);
  const [friction, setFriction] = useState(0.15);
  const [rampAngle, setRampAngle] = useState(initialRampAngle);
  const [mass, setMass] = useState(5);
  const [blocksCount, setBlocksCount] = useState(1);
  const [lastStats, setLastStats] = useState({
    speed: 0,
    ke: 0,
    pe: 0,
    momentum: 0,
    distance: 0,
    acceleration: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (s: p5) => {
      const blocks: Block[] = [];
      let nextId = 1;

      const cfg: LabConfig = {
        gravity,
        friction,
        rampAngle: (rampAngle * Math.PI) / 180,
        rampLength: 360,
        rampX: 120,
        rampY: 110,
        groundY: 380,
      };

      const resetBlocks = () => {
        blocks.length = 0;
        for (let i = 0; i < blocksCount; i++) {
          const block = createBlock(nextId++, cfg.rampX + 10 - i * 34, cfg.rampY - 10 - i * 16);
          block.mass = mass;
          blocks.push(block);
        }
      };

      s.setup = () => {
        s.createCanvas(900, 460);
        resetBlocks();
      };

      s.draw = () => {
        cfg.gravity = gravity;
        cfg.friction = friction;
        cfg.rampAngle = (rampAngle * Math.PI) / 180;

        s.background(11, 15, 26);
        s.stroke(148, 163, 184);
        s.strokeWeight(2);

        s.line(cfg.rampX, cfg.rampY, cfg.rampX + cfg.rampLength, cfg.groundY);
        s.noStroke();
        s.fill(18, 24, 38);
        s.rect(60, cfg.groundY, 780, 8, 4);

        s.fill(238, 242, 246);
        s.textSize(14);
        s.text(`Gravity: ${gravity.toFixed(1)} m/s²`, 20, 24);
        s.text(`Friction: ${friction.toFixed(2)}`, 20, 44);
        s.text(`Ramp angle: ${rampAngle.toFixed(0)}°`, 20, 64);

        const dt = s.deltaTime / 1000;
        const statsBlock = blocks[0];

        for (const block of blocks) {
          block.mass = mass;
          updateBlock(block, dt, cfg);

          s.push();
          s.translate(block.x, block.y);
          s.fill(block.color);
          s.stroke(30);
          s.rectMode(s.CENTER);
          s.rect(0, 0, block.size, block.size, 6);
          s.pop();
        }

        if (statsBlock) {
          setLastStats({
            speed: speedOf(statsBlock),
            ke: kineticEnergy(statsBlock),
            pe: potentialEnergy(statsBlock, cfg.groundY, cfg.gravity),
            momentum: momentum(statsBlock),
            distance: statsBlock.distance,
            acceleration: statsBlock.acceleration,
          });
        }
      };

      (s as p5 & { resetLab?: () => void }).resetLab = () => resetBlocks();
    };

    p5Ref.current = new p5(sketch, containerRef.current);

    return () => {
      p5Ref.current?.remove();
      p5Ref.current = null;
    };
  }, []);

  useEffect(() => {
    const p = p5Ref.current as (p5 & { resetLab?: () => void }) | null;
    p?.resetLab?.();
  }, [blocksCount, mass]);

  const metrics = useMemo(
    () => [
      ['Speed', `${lastStats.speed.toFixed(2)} m/s`],
      ['Kinetic', `${lastStats.ke.toFixed(2)} J`],
      ['Potential', `${lastStats.pe.toFixed(2)} J`],
      ['Momentum', `${lastStats.momentum.toFixed(2)} kg·m/s`],
      ['Distance', `${lastStats.distance.toFixed(2)} m`],
      ['Accel.', `${lastStats.acceleration.toFixed(2)} m/s²`],
    ],
    [lastStats]
  );

  return (
    <section className="graph-lab mech-lab">
      <aside className="controls">
        <label>
          Mass
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
          />
          <span>{mass.toFixed(1)} kg</span>
        </label>

        <label>
          Gravity
          <input
            type="range"
            min="0"
            max="20"
            step="0.1"
            value={gravity}
            onChange={(e) => setGravity(Number(e.target.value))}
          />
          <span>{gravity.toFixed(1)} m/s²</span>
        </label>

        <label>
          Friction
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={friction}
            onChange={(e) => setFriction(Number(e.target.value))}
          />
          <span>{friction.toFixed(2)}</span>
        </label>

        <label>
          Ramp angle
          <input
            type="range"
            min="5"
            max="45"
            step="1"
            value={rampAngle}
            onChange={(e) => setRampAngle(Number(e.target.value))}
          />
          <span>{rampAngle.toFixed(0)}°</span>
        </label>

        <label>
          Blocks
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={blocksCount}
            onChange={(e) => setBlocksCount(Number(e.target.value))}
          />
          <span>{blocksCount}</span>
        </label>

        <button type="button" onClick={() => setBlocksCount((n) => Math.min(5, n + 1))}>
          Add block
        </button>
      </aside>

      <div className="chart-panel">
        <div ref={containerRef} />
      </div>

      <aside className="controls">
        <h2>Live values</h2>
        <dl>
          {metrics.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}
