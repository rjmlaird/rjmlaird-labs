import { step, totalEnergy, makeBody, DEFAULT_CONFIG, type Body, type SimConfig } from './physics';
import { presets, getPreset } from './presets';
import { periapsisVelocity, periapsisDistance, estimateOrbitalElements } from './units';
import { sub, type Vec2 } from './vectors';

interface DragState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface OrbitalRow {
  label: string;
  a: number; // AU
  T: number; // years
  ratio: number; // T² / a³
  bound: boolean;
}

interface KeplerWedge {
  points: Vec2[]; // relative to focus, in world (AU) units
  area: number; // AU²
}

export interface StatsPayload {
  bodyCount: number;
  energyDrift: number;
  presetLabel: string;
  unit: 'astro' | 'abstract';
}

export interface KeplerPayload {
  enabled: boolean;
  focusLabel: string | null;
  targetLabel: string | null;
  wedgeAreas: number[];
  table: OrbitalRow[];
  expectedRatio: number | null; // 1 / M_focus, the theoretical T²/a³ constant in these units
}

export class Simulation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bodies: Body[] = [];
  private config: SimConfig = { ...DEFAULT_CONFIG };
  private running = true;
  private showTrails = true;
  private stepsPerFrame = 6;
  private camera = { x: 0, y: 0, zoom: 90 };
  private drag: DragState = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
  private rafId: number | null = null;
  private initialEnergy = 0;
  private currentUnit: 'astro' | 'abstract' = 'astro';
  private currentPresetLabel = 'Custom';
  private currentPresetId = 'keplers-laws';

  private showKepler = false;
  private focusIndex = -1;
  private targetIndex = -1;
  private keplerIntervalDuration = 0;
  private keplerElapsed = 0;
  private keplerSamples: Vec2[] = [];
  private keplerWedges: KeplerWedge[] = [];

  private onStats?: (stats: StatsPayload) => void;
  private onKepler?: (payload: KeplerPayload) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.attachInteraction();
  }

  onStatsUpdate(cb: (stats: StatsPayload) => void) {
    this.onStats = cb;
  }

  onKeplerUpdate(cb: (payload: KeplerPayload) => void) {
    this.onKepler = cb;
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---- preset / body management -------------------------------------------------

  loadPresetById(id: string) {
    const preset = getPreset(id);
    this.currentPresetId = id;
    this.config = { ...DEFAULT_CONFIG, ...preset.config };
    this.bodies = preset.build();
    this.currentPresetLabel = preset.label;
    this.currentUnit = preset.unit;
    this.camera = { x: 0, y: 0, zoom: preset.pixelsPerAU };
    this.initialEnergy = this.bodies.length ? totalEnergy(this.bodies, this.config) : 0;
    this.showKepler = !!preset.keplerDemo;
    this.setupKeplerTargets();
  }

  reset() {
    this.loadPresetById(this.currentPresetId);
  }

  clear() {
    this.bodies = [];
    this.currentPresetLabel = 'Custom';
    this.focusIndex = -1;
    this.targetIndex = -1;
    this.keplerWedges = [];
    this.keplerSamples = [];
  }

  getUnit() {
    return this.currentUnit;
  }

  getG() {
    return this.config.G;
  }

  listBodies() {
    return this.bodies.map((b) => ({ id: b.id, label: b.label, mass: b.mass }));
  }

  /** Place a body on a Keplerian orbit around an existing body, by mass + semi-major axis + eccentricity. */
  addOrbitingBody(opts: {
    mass: number;
    aroundBodyId: number | null;
    a: number;
    e: number;
    retrograde: boolean;
    color?: string;
  }) {
    const palette = ['#00C2A8', '#F5A623', '#E8ECF4', '#E4572E', '#4C8DFF', '#B388FF'];
    const color = opts.color ?? palette[this.bodies.length % palette.length];

    if (opts.aroundBodyId === null || this.bodies.length === 0) {
      const angle = Math.random() * Math.PI * 2;
      this.bodies.push(
        makeBody({
          label: `Body ${this.bodies.length + 1} (${opts.mass} M\u2609)`,
          mass: opts.mass,
          radius: 4 + Math.min(14, Math.cbrt(opts.mass) * 6),
          color,
          pos: { x: Math.cos(angle) * opts.a, y: Math.sin(angle) * opts.a },
          vel: { x: 0, y: 0 },
        })
      );
    } else {
      const central = this.bodies.find((b) => b.id === opts.aroundBodyId);
      if (!central) return;
      const GM = this.config.G * central.mass;
      const rp = periapsisDistance(opts.a, opts.e);
      const speed = periapsisVelocity(GM, opts.a, opts.e) * (opts.retrograde ? -1 : 1);
      const angle = Math.random() * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const localPos = { x: rp, y: 0 };
      const localVel = { x: 0, y: speed };
      const pos = {
        x: central.pos.x + localPos.x * cosA - localPos.y * sinA,
        y: central.pos.y + localPos.x * sinA + localPos.y * cosA,
      };
      const vel = {
        x: central.vel.x + localVel.x * cosA - localVel.y * sinA,
        y: central.vel.y + localVel.x * sinA + localVel.y * cosA,
      };
      this.bodies.push(
        makeBody({
          label: `Body ${this.bodies.length + 1} (${opts.mass} M\u2609)`,
          mass: opts.mass,
          radius: 4 + Math.min(14, Math.cbrt(opts.mass) * 6),
          color,
          pos,
          vel,
        })
      );
    }
    this.currentPresetLabel = 'Custom';
    this.setupKeplerTargets();
  }

  // ---- playback controls ----------------------------------------------------

  setRunning(running: boolean) {
    this.running = running;
  }
  toggleRunning(): boolean {
    this.running = !this.running;
    return this.running;
  }
  isRunning() {
    return this.running;
  }
  setTrails(show: boolean) {
    this.showTrails = show;
    if (!show) for (const b of this.bodies) b.trail.length = 0;
  }
  setSpeed(stepsPerFrame: number) {
    this.stepsPerFrame = stepsPerFrame;
  }
  setG(g: number) {
    this.config.G = g;
  }
  setSoftening(s: number) {
    this.config.softening = s;
  }
  setZoom(pixelsPerAU: number) {
    this.camera.zoom = pixelsPerAU;
  }
  getZoom() {
    return this.camera.zoom;
  }
  setKeplerEnabled(enabled: boolean) {
    this.showKepler = enabled;
    if (enabled) this.setupKeplerTargets();
  }

  // ---- Kepler's-laws bookkeeping ---------------------------------------------

  private setupKeplerTargets() {
    this.keplerWedges = [];
    this.keplerSamples = [];
    this.keplerElapsed = 0;

    if (this.bodies.length < 2) {
      this.focusIndex = -1;
      this.targetIndex = -1;
      return;
    }
    let focus = this.bodies.findIndex((b) => b.fixed);
    if (focus === -1) {
      let maxMass = -Infinity;
      this.bodies.forEach((b, i) => {
        if (b.mass > maxMass) {
          maxMass = b.mass;
          focus = i;
        }
      });
    }
    this.focusIndex = focus;

    let bestIdx = -1;
    let bestEcc = -Infinity;
    const focusBody = this.bodies[focus];
    this.bodies.forEach((b, i) => {
      if (i === focus) return;
      const rel = sub(b.pos, focusBody.pos);
      const relVel = sub(b.vel, focusBody.vel);
      const GM = this.config.G * focusBody.mass;
      const els = estimateOrbitalElements(rel, relVel, GM);
      if (els.bound) {
        const r = Math.hypot(rel.x, rel.y);
        const eccApprox = Math.abs(1 - r / els.a);
        if (eccApprox > bestEcc) {
          bestEcc = eccApprox;
          bestIdx = i;
        }
      }
    });
    this.targetIndex = bestIdx === -1 ? (focus === 0 ? 1 : 0) : bestIdx;

    const target = this.bodies[this.targetIndex];
    if (target) {
      const rel = sub(target.pos, focusBody.pos);
      const relVel = sub(target.vel, focusBody.vel);
      const GM = this.config.G * focusBody.mass;
      const els = estimateOrbitalElements(rel, relVel, GM);
      this.keplerIntervalDuration = els.bound && els.T > 0 ? els.T / 12 : this.config.dt * 200;
    }
  }

  private polygonFanArea(points: Vec2[]): number {
    let sum = 0;
    for (let i = 0; i < points.length - 1; i++) {
      sum += points[i].x * points[i + 1].y - points[i + 1].x * points[i].y;
    }
    return Math.abs(sum) / 2;
  }

  private recordKeplerSample() {
    if (!this.showKepler || this.focusIndex === -1 || this.targetIndex === -1) return;
    const focus = this.bodies[this.focusIndex];
    const target = this.bodies[this.targetIndex];
    if (!focus || !target) return;
    const rel = sub(target.pos, focus.pos);
    this.keplerSamples.push(rel);
    this.keplerElapsed += this.config.dt;
    if (this.keplerElapsed >= this.keplerIntervalDuration && this.keplerSamples.length > 1) {
      const area = this.polygonFanArea(this.keplerSamples);
      this.keplerWedges.push({ points: this.keplerSamples, area });
      if (this.keplerWedges.length > 5) this.keplerWedges.shift();
      this.keplerSamples = [rel];
      this.keplerElapsed = 0;
    }
  }

  private buildKeplerTable(): OrbitalRow[] {
    if (this.focusIndex === -1) return [];
    const focus = this.bodies[this.focusIndex];
    const rows: OrbitalRow[] = [];
    this.bodies.forEach((b, i) => {
      if (i === this.focusIndex) return;
      const rel = sub(b.pos, focus.pos);
      const relVel = sub(b.vel, focus.vel);
      const GM = this.config.G * focus.mass;
      const els = estimateOrbitalElements(rel, relVel, GM);
      if (els.bound) {
        rows.push({
          label: b.label,
          a: els.a,
          T: els.T,
          ratio: (els.T * els.T) / (els.a * els.a * els.a),
          bound: true,
        });
      } else {
        rows.push({ label: b.label, a: NaN, T: NaN, ratio: NaN, bound: false });
      }
    });
    return rows;
  }

  // ---- interaction ------------------------------------------------------------

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: (sx - cx) / this.camera.zoom + this.camera.x,
      y: (sy - cy) / this.camera.zoom + this.camera.y,
    };
  }

  private attachInteraction() {
    const getPos = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const p = getPos(e);
      this.drag = { active: true, startX: p.x, startY: p.y, currentX: p.x, currentY: p.y };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.drag.active) return;
      const p = getPos(e);
      this.drag.currentX = p.x;
      this.drag.currentY = p.y;
    });

    window.addEventListener('mouseup', () => {
      if (!this.drag.active) return;
      const world = this.screenToWorld(this.drag.startX, this.drag.startY);
      const worldEnd = this.screenToWorld(this.drag.currentX, this.drag.currentY);
      const velScale = this.currentUnit === 'astro' ? 0.6 : 0.05;
      const vel = { x: (worldEnd.x - world.x) * velScale, y: (worldEnd.y - world.y) * velScale };

      const palette = ['#00C2A8', '#F5A623', '#E8ECF4', '#E4572E', '#4C8DFF'];
      const color = palette[this.bodies.length % palette.length];
      const mass = this.currentUnit === 'astro' ? 0.000003 : 40 + Math.random() * 40;
      this.bodies.push(
        makeBody({
          label: `Body ${this.bodies.length + 1}`,
          mass,
          radius: this.currentUnit === 'astro' ? 5 : 7,
          color,
          pos: world,
          vel,
        })
      );
      this.currentPresetLabel = 'Custom';
      this.drag.active = false;
      this.setupKeplerTargets();
    });
  }

  // ---- main loop ----------------------------------------------------------------

  start() {
    const loop = () => {
      if (this.running && this.bodies.length > 0) {
        for (let i = 0; i < this.stepsPerFrame; i++) {
          step(this.bodies, this.config);
          this.recordKeplerSample();
        }
      }
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  private render() {
    const rect = this.canvas.getBoundingClientRect();
    const { ctx } = this;
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#0B0F1A';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = (w / 2) % gridSize; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = (h / 2) % gridSize; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2;
    const toScreen = (p: Vec2) => ({
      x: cx + (p.x - this.camera.x) * this.camera.zoom,
      y: cy + (p.y - this.camera.y) * this.camera.zoom,
    });

    if (this.showTrails) {
      for (const b of this.bodies) {
        if (b.trail.length < 2) continue;
        ctx.beginPath();
        for (let i = 0; i < b.trail.length; i++) {
          const s = toScreen(b.trail[i]);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = b.color + '55';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    if (this.showKepler && this.focusIndex !== -1) {
      const focusBody = this.bodies[this.focusIndex];
      const focusScreen = toScreen(focusBody.pos);
      this.keplerWedges.forEach((wedge, idx) => {
        const alpha = 0.08 + (idx / Math.max(1, this.keplerWedges.length - 1)) * 0.22;
        ctx.beginPath();
        ctx.moveTo(focusScreen.x, focusScreen.y);
        for (const p of wedge.points) {
          const abs = { x: focusBody.pos.x + p.x, y: focusBody.pos.y + p.y };
          const s = toScreen(abs);
          ctx.lineTo(s.x, s.y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 194, 168, ${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 194, 168, ${alpha + 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    for (const b of this.bodies) {
      const s = toScreen(b.pos);
      ctx.beginPath();
      ctx.arc(s.x, s.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (this.showKepler && this.focusIndex !== -1 && b.id === this.bodies[this.focusIndex].id) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, b.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245,166,35,0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (this.drag.active) {
      ctx.beginPath();
      ctx.moveTo(this.drag.startX, this.drag.startY);
      ctx.lineTo(this.drag.currentX, this.drag.currentY);
      ctx.strokeStyle = '#F5A623';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(this.drag.startX, this.drag.startY, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#F5A623';
      ctx.stroke();
    }

    if (this.onStats) {
      const drift =
        this.bodies.length > 1 && this.initialEnergy !== 0
          ? ((totalEnergy(this.bodies, this.config) - this.initialEnergy) / Math.abs(this.initialEnergy)) * 100
          : 0;
      this.onStats({
        bodyCount: this.bodies.length,
        energyDrift: drift,
        presetLabel: this.currentPresetLabel,
        unit: this.currentUnit,
      });
    }

    if (this.onKepler) {
      const focus = this.focusIndex !== -1 ? this.bodies[this.focusIndex] : null;
      const target = this.targetIndex !== -1 ? this.bodies[this.targetIndex] : null;
      this.onKepler({
        enabled: this.showKepler,
        focusLabel: focus ? focus.label : null,
        targetLabel: target ? target.label : null,
        wedgeAreas: this.keplerWedges.map((w) => w.area),
        table: this.showKepler ? this.buildKeplerTable() : [],
        expectedRatio: focus && focus.mass > 0 ? 1 / focus.mass : null,
      });
    }
  }
}

export { presets };
