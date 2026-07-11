import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as math from "mathjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Camera,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  Star,
  Mail,
  Share2,
  Trash2,
  ScanLine,
  ChevronDown,
  ChevronUp,
  X,
  FolderOpen,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Physical constants (real numbers — this is, after all, a scanner   */
/* built by two experimental/theoretical physicists)                  */
/* ------------------------------------------------------------------ */
const HBAR = 1.054571817e-34; // J·s
const ME = 9.1093837015e-31; // kg
const EV = 1.602176634e-19; // J per eV
const NM = 1e-9; // m per nm

const fmt = (n, d = 3) => {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) !== 0 && (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e5)) {
    return n.toExponential(d - 1);
  }
  return Number(n.toFixed(d)).toString();
};

const linspace = (a, b, n) =>
  Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/* ------------------------------------------------------------------ */
/* Equation database — "the algorithm drops the results from a        */
/* database" once handwriting recognition confirms a match.           */
/* ------------------------------------------------------------------ */
const DB = [
  {
    id: "schrodinger",
    name: "Schrödinger Equation",
    subtitle: "Time-independent, 1D infinite square well",
    standardForm: "−ħ²/(2m) · d²Ψ/dx² = E·Ψ",
    generalSolution: "Ψₙ(x) = √(2/L)·sin(nπx/L),   Eₙ = n²π²ħ²/(2mL²)",
    xLabel: "x (nm)",
    yLabel: "Ψ(x)",
    coeffConfig: [
      { key: "n", label: "Quantum number n", unit: "", min: 1, max: 6, step: 1 },
      { key: "L", label: "Well width L", unit: "nm", min: 0.1, max: 5, step: 0.1 },
    ],
    defaults: { n: 1, L: 1 },
    summary: (c) => {
      const Ljoules = c.L * NM;
      const E = (c.n ** 2 * Math.PI ** 2 * HBAR ** 2) / (2 * ME * Ljoules ** 2);
      const Eev = E / EV;
      return `Level n=${c.n}: Eₙ = ${fmt(Eev, 4)} eV  (well width L = ${fmt(
        c.L,
        2
      )} nm, electron mass)`;
    },
    series: (c) => {
      const xs = linspace(0, c.L, 60);
      return xs.map((x) => ({
        x,
        y: Math.sqrt(2 / c.L) * Math.sin((c.n * Math.PI * x) / c.L),
      }));
    },
    ocrMisreads: ["Sinh-Gordon Equation", "Illegible whiteboard scrawl"],
  },
  {
    id: "sho",
    name: "Simple Harmonic Oscillator",
    subtitle: "Undamped, unforced",
    standardForm: "y″ + ω²y = 0",
    generalSolution: "y(t) = y₀cos(ωt) + (v₀/ω)sin(ωt)",
    xLabel: "t (s)",
    yLabel: "y(t)",
    coeffConfig: [
      { key: "omega", label: "Angular frequency ω", unit: "rad/s", min: 0.1, max: 10, step: 0.1 },
      { key: "y0", label: "Initial position y₀", unit: "", min: -5, max: 5, step: 0.1 },
      { key: "v0", label: "Initial velocity v₀", unit: "", min: -5, max: 5, step: 0.1 },
    ],
    defaults: { omega: 2, y0: 1, v0: 0 },
    summary: (c) => {
      const T = (2 * Math.PI) / c.omega;
      const A = Math.sqrt(c.y0 ** 2 + (c.v0 / c.omega) ** 2);
      return `Amplitude A ≈ ${fmt(A, 3)}, period T = ${fmt(T, 3)} s`;
    },
    series: (c) => {
      const tMax = (4 * Math.PI) / c.omega;
      return linspace(0, tMax, 60).map((t) => ({
        x: t,
        y: c.y0 * Math.cos(c.omega * t) + (c.v0 / c.omega) * Math.sin(c.omega * t),
      }));
    },
    ocrMisreads: ["Fourier series fragment", "Roommate Agreement, clause 37"],
  },
  {
    id: "damped",
    name: "Damped Harmonic Oscillator",
    subtitle: "Underdamped case",
    standardForm: "y″ + 2γy′ + ω₀²y = 0",
    generalSolution:
      "y(t) = e^(−γt)[y₀cos(ω_d t) + ((v₀+γy₀)/ω_d)sin(ω_d t)],  ω_d=√(ω₀²−γ²)",
    xLabel: "t (s)",
    yLabel: "y(t)",
    coeffConfig: [
      { key: "gamma", label: "Damping γ", unit: "1/s", min: 0, max: 2, step: 0.01 },
      { key: "omega0", label: "Natural frequency ω₀", unit: "rad/s", min: 0.1, max: 10, step: 0.1 },
      { key: "y0", label: "Initial position y₀", unit: "", min: -5, max: 5, step: 0.1 },
      { key: "v0", label: "Initial velocity v₀", unit: "", min: -5, max: 5, step: 0.1 },
    ],
    defaults: { gamma: 0.15, omega0: 2, y0: 1, v0: 0 },
    summary: (c) => {
      const disc = c.omega0 ** 2 - c.gamma ** 2;
      if (disc <= 0) return "Overdamped / critically damped — no oscillation";
      const wd = Math.sqrt(disc);
      return `Damped frequency ω_d = ${fmt(wd, 3)} rad/s, decay time 1/γ = ${fmt(
        1 / c.gamma,
        2
      )} s`;
    },
    series: (c) => {
      const disc = Math.max(c.omega0 ** 2 - c.gamma ** 2, 1e-6);
      const wd = Math.sqrt(disc);
      const tMax = Math.min(Math.max(5 / c.gamma, (4 * Math.PI) / wd), 40);
      return linspace(0, tMax, 70).map((t) => ({
        x: t,
        y:
          Math.exp(-c.gamma * t) *
          (c.y0 * Math.cos(wd * t) + ((c.v0 + c.gamma * c.y0) / wd) * Math.sin(wd * t)),
      }));
    },
    ocrMisreads: ["Navier–Stokes residual term", "Coffee-stained margin note"],
  },
  {
    id: "cooling",
    name: "Newton's Law of Cooling",
    subtitle: "First-order linear",
    standardForm: "dT/dt = −k(T − T_env)",
    generalSolution: "T(t) = T_env + (T₀ − T_env)e^(−kt)",
    xLabel: "t (min)",
    yLabel: "T (°C)",
    coeffConfig: [
      { key: "k", label: "Cooling constant k", unit: "1/min", min: 0.01, max: 1, step: 0.01 },
      { key: "T0", label: "Initial temperature T₀", unit: "°C", min: 0, max: 200, step: 1 },
      { key: "Tenv", label: "Ambient temperature", unit: "°C", min: 0, max: 100, step: 1 },
    ],
    defaults: { k: 0.08, T0: 95, Tenv: 22 },
    summary: (c) =>
      `Time constant 1/k = ${fmt(1 / c.k, 2)} min, approaching ${fmt(c.Tenv, 1)} °C`,
    series: (c) => {
      const tMax = Math.min(5 / c.k, 90);
      return linspace(0, tMax, 60).map((t) => ({
        x: t,
        y: c.Tenv + (c.T0 - c.Tenv) * Math.exp(-c.k * t),
      }));
    },
    ocrMisreads: ["Heat Equation (1D, misread)", "Someone's phone number"],
  },
  {
    id: "exponential",
    name: "Exponential Growth / Decay",
    subtitle: "First-order linear, separable",
    standardForm: "dy/dt = k·y",
    generalSolution: "y(t) = y₀e^(kt)",
    xLabel: "t (s)",
    yLabel: "y(t)",
    coeffConfig: [
      { key: "k", label: "Rate constant k", unit: "1/s", min: -2, max: 2, step: 0.05 },
      { key: "y0", label: "Initial value y₀", unit: "", min: 0.1, max: 100, step: 0.1 },
    ],
    defaults: { k: -0.3, y0: 50 },
    summary: (c) =>
      c.k >= 0
        ? `Doubling time ≈ ${fmt(Math.LN2 / c.k, 3)} s`
        : `Half-life ≈ ${fmt(Math.LN2 / -c.k, 3)} s`,
    series: (c) => {
      const tMax = Math.min(5 / Math.abs(c.k || 0.01), 60);
      return linspace(0, tMax, 60).map((t) => ({
        x: t,
        y: c.y0 * Math.exp(c.k * t),
      }));
    },
    ocrMisreads: ["Radioactive decay law", "Napkin compound-interest math"],
  },
  {
    id: "logistic",
    name: "Logistic Equation",
    subtitle: "Bounded population growth",
    standardForm: "dy/dt = r·y·(1 − y/K)",
    generalSolution: "y(t) = K / (1 + ((K−y₀)/y₀)e^(−rt))",
    xLabel: "t",
    yLabel: "y(t)",
    coeffConfig: [
      { key: "r", label: "Growth rate r", unit: "1/t", min: 0.01, max: 2, step: 0.01 },
      { key: "K", label: "Carrying capacity K", unit: "", min: 1, max: 500, step: 1 },
      { key: "y0", label: "Initial value y₀", unit: "", min: 0.1, max: 500, step: 0.1 },
    ],
    defaults: { r: 0.4, K: 100, y0: 5 },
    summary: (c) =>
      `Approaches carrying capacity K = ${fmt(c.K, 1)}, steepest growth near y = ${fmt(
        c.K / 2,
        1
      )}`,
    series: (c) => {
      const tMax = Math.min(10 / c.r, 60);
      return linspace(0, tMax, 60).map((t) => ({
        x: t,
        y: c.K / (1 + ((c.K - c.y0) / c.y0) * Math.exp(-c.r * t)),
      }));
    },
    ocrMisreads: ["SIR epidemic model", "Val's cat-population estimate"],
  },
  {
    id: "rc",
    name: "RC Circuit Charging",
    subtitle: "First-order linear circuit equation",
    standardForm: "dV/dt = (V_s − V)/(RC)",
    generalSolution: "V(t) = V_s + (V₀ − V_s)e^(−t/RC)",
    xLabel: "t (s)",
    yLabel: "V (V)",
    coeffConfig: [
      { key: "R", label: "Resistance R", unit: "Ω", min: 10, max: 100000, step: 10 },
      { key: "C_uF", label: "Capacitance C", unit: "µF", min: 1, max: 10000, step: 1 },
      { key: "Vs", label: "Supply voltage V_s", unit: "V", min: 0, max: 24, step: 0.5 },
      { key: "V0", label: "Initial voltage V₀", unit: "V", min: 0, max: 24, step: 0.5 },
    ],
    defaults: { R: 1000, C_uF: 1000, Vs: 5, V0: 0 },
    summary: (c) => {
      const tau = c.R * (c.C_uF * 1e-6);
      return `Time constant RC = ${fmt(tau, 3)} s`;
    },
    series: (c) => {
      const tau = c.R * (c.C_uF * 1e-6);
      return linspace(0, 5 * tau, 60).map((t) => ({
        x: t,
        y: c.Vs + (c.V0 - c.Vs) * Math.exp(-t / tau),
      }));
    },
    ocrMisreads: ["Ohm's Law variant", "Howard's napkin schematic"],
  },
];

/* ------------------------------------------------------------------ */

const MODE = {
  IDLE: "idle",
  SCANNING: "scanning",
  CANDIDATES: "candidates",
  SOLVED: "solved",
  MANUAL: "manual",
};

/* ------------------------------------------------------------------ */
/* Offline ODE classifier — a small JS port of the idea behind         */
/* SymPy's classify_ode: test a first-order equation dy/dx = R(x,y)    */
/* against a few solvable patterns using numeric identity checks,      */
/* rather than symbolic algebra (which needs a real CAS we don't have  */
/* in the browser). Whatever the classification, the curve itself is   */
/* always produced by numerical integration (RK4), so any equation —   */
/* classifiable or not — still gets solved.                            */
/* ------------------------------------------------------------------ */
const safeEval = (compiled, x, y) => {
  try {
    const v = compiled.evaluate({ x, y });
    return typeof v === "number" && isFinite(v) ? v : NaN;
  } catch (e) {
    return NaN;
  }
};

const classifyODE = (compiled) => {
  const X = [0.6, 1.3, 2.1];
  const Y = [0.5, 1.4, 2.2];
  const grid = X.map((x) => Y.map((y) => safeEval(compiled, x, y)));
  const gridFinite = grid.every((row) => row.every((v) => isFinite(v)));

  if (gridFinite) {
    // Linear-in-y test: second finite difference over equally spaced y is ~0
    const linearOk = X.every((x, i) => {
      const r = grid[i];
      const secondDiff = r[0] - 2 * r[1] + r[2];
      const scale = Math.max(1, Math.abs(r[1]));
      return Math.abs(secondDiff) < 1e-3 * scale;
    });
    if (linearOk) {
      return {
        type: "linear",
        label: "First-order linear",
        desc: "Matches dy/dx + P(x)·y = Q(x) — SymPy's \"1st_linear\" hint.",
      };
    }

    // Separable test: rank-1 check on the sample grid (R(x,y) = f(x)·g(y))
    let sepOk = true;
    for (let i = 0; i < X.length; i++) {
      for (let j = 0; j < Y.length; j++) {
        const lhs = grid[i][j] * grid[0][0];
        const rhs = grid[i][0] * grid[0][j];
        const scale = Math.max(1, Math.abs(lhs), Math.abs(rhs));
        if (Math.abs(lhs - rhs) > 1e-3 * scale) sepOk = false;
      }
    }
    if (sepOk) {
      return {
        type: "separable",
        label: "Separable",
        desc: "Matches dy/dx = f(x)·g(y) — variables separate and integrate independently.",
      };
    }

    // Homogeneous (degree 0) test: R(kx,ky) = R(x,y)
    const homogOk = X.every((x, i) => {
      const y = Y[i];
      const r1 = safeEval(compiled, x, y);
      const r2 = safeEval(compiled, x * 2, y * 2);
      const scale = Math.max(1, Math.abs(r1));
      return isFinite(r2) && Math.abs(r1 - r2) < 1e-3 * scale;
    });
    if (homogOk) {
      return {
        type: "homogeneous",
        label: "Homogeneous (degree 0)",
        desc: "Matches dy/dx = f(y/x) — solvable via the substitution v = y/x.",
      };
    }
  }

  return {
    type: "nonlinear",
    label: "General nonlinear first-order",
    desc: "No standard closed-form pattern detected — solved purely by numerical integration.",
  };
};

const rk4 = (f, x0, y0, xEnd, steps) => {
  const h = (xEnd - x0) / Math.max(steps, 1);
  let x = x0;
  let y = y0;
  const out = [{ x, y }];
  for (let i = 0; i < steps; i++) {
    const k1 = f(x, y);
    if (!isFinite(k1)) break;
    const k2 = f(x + h / 2, y + (h / 2) * k1);
    const k3 = f(x + h / 2, y + (h / 2) * k2);
    const k4 = f(x + h, y + h * k3);
    if (![k2, k3, k4].every(isFinite)) break;
    const yNext = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (!isFinite(yNext) || Math.abs(yNext) > 1e8) break;
    x += h;
    y = yNext;
    out.push({ x, y });
  }
  return out;
};

const integrateODE = (compiled, x0, y0, xMin, xMax, totalSteps = 120) => {
  const f = (x, y) => safeEval(compiled, x, y);
  const fwdSpan = Math.max(xMax - x0, 0);
  const bwdSpan = Math.max(x0 - xMin, 0);
  const totalSpan = fwdSpan + bwdSpan || 1;
  const fwdSteps = Math.max(5, Math.round((totalSteps * fwdSpan) / totalSpan));
  const bwdSteps = Math.max(5, totalSteps - fwdSteps);
  const forward = rk4(f, x0, y0, xMax, fwdSteps);
  const backward = rk4(f, x0, y0, xMin, bwdSteps).reverse();
  backward.pop(); // drop duplicate (x0,y0) point
  return [...backward, ...forward];
};

const buildManualEquation = (exprText, xMin, xMax, x0, y0) => {
  const node = math.parse(exprText);
  const compiled = node.compile();
  const testVal = safeEval(compiled, x0, y0);
  if (!isFinite(testVal)) {
    throw new Error("Expression does not evaluate to a finite number at (x₀, y₀)");
  }
  const classification = classifyODE(compiled);
  const yRange = Math.max(10, Math.abs(y0) * 4);

  return {
    id: `manual-${Date.now()}`,
    name: "Custom First-Order ODE",
    subtitle: `Classified offline: ${classification.label}`,
    standardForm: `dy/dx = ${exprText}`,
    generalSolution: classification.desc,
    xLabel: "x",
    yLabel: "y(x)",
    coeffConfig: [
      { key: "x0", label: "Initial x₀", unit: "", min: xMin, max: xMax, step: (xMax - xMin) / 200 || 0.01 },
      { key: "y0", label: "Initial y₀", unit: "", min: -yRange, max: yRange, step: yRange / 200 || 0.01 },
    ],
    defaults: { x0, y0 },
    meta: { expr: exprText, xMin, xMax },
    summary: (c) =>
      `Integrated numerically (RK4) from (x₀,y₀) = (${fmt(c.x0, 3)}, ${fmt(
        c.y0,
        3
      )}) across x ∈ [${fmt(xMin, 2)}, ${fmt(xMax, 2)}]`,
    series: (c) => {
      try {
        return integrateODE(compiled, c.x0, c.y0, xMin, xMax);
      } catch (e) {
        return [];
      }
    },
    ocrMisreads: [],
  };
};

const LOG_LINES = [
  "INITIALIZING OCR MODULE...",
  "VECTORIZING HANDWRITING STROKES...",
  "NORMALIZING SYMBOL GLYPHS...",
  "QUERYING SOLUTION DATABASE...",
  "RANKING CANDIDATE MATCHES...",
];

export default function LenwoloppaliScannerDesktop() {
  const [mode, setMode] = useState(MODE.IDLE);
  const [imgUrl, setImgUrl] = useState(null);
  const [logIndex, setLogIndex] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [equation, setEquation] = useState(null);
  const [coeffs, setCoeffs] = useState({});
  const [showCoeffs, setShowCoeffs] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [lastIndex, setLastIndex] = useState(-1);
  const [toast, setToast] = useState("");
  const [manualExpr, setManualExpr] = useState("");
  const [manualX0, setManualX0] = useState("1");
  const [manualY0, setManualY0] = useState("1");
  const [manualXMin, setManualXMin] = useState("0");
  const [manualXMax, setManualXMax] = useState("10");
  const [manualError, setManualError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("ldes-favorites", false);
        if (res && res.value) setFavorites(JSON.parse(res.value));
      } catch (e) {
        // no favorites saved yet
      }
    })();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Desktop convenience: Ctrl+V / Cmd+V pastes a copied image straight in
  useEffect(() => {
    const handlePaste = (e) => {
      if (mode !== MODE.IDLE) return;
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            if (imgUrl) URL.revokeObjectURL(imgUrl);
            const url = URL.createObjectURL(file);
            setImgUrl(url);
            startScan();
            flashToast("PASTED FROM CLIPBOARD");
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [mode, imgUrl]);

  const flashToast = (msg) => {
    setToast(msg);
    const t = setTimeout(() => setToast(""), 2200);
    timers.current.push(t);
  };

  const persistFavorites = async (list) => {
    try {
      await window.storage.set("ldes-favorites", JSON.stringify(list), false);
    } catch (e) {
      flashToast("COULD NOT SAVE FAVORITES");
    }
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    startScan();
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (mode === MODE.IDLE) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (mode !== MODE.IDLE) return;
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    startScan();
  };

  const startScan = () => {
    setMode(MODE.SCANNING);
    setLogIndex(0);
    setShowCoeffs(false);

    LOG_LINES.forEach((_, i) => {
      const t = setTimeout(() => setLogIndex(i + 1), 380 * (i + 1));
      timers.current.push(t);
    });

    const finish = setTimeout(() => {
      let idx = Math.floor(Math.random() * DB.length);
      if (DB.length > 1 && idx === lastIndex) idx = (idx + 1) % DB.length;
      setLastIndex(idx);
      const match = DB[idx];

      const correctConf = 78 + Math.random() * 18; // 78-96
      const remainder = 100 - correctConf;
      const split = Math.random();
      const wrong1 = remainder * split;
      const wrong2 = remainder - wrong1;

      const cands = [
        { label: match.name, confidence: correctConf, correct: true, eq: match },
        { label: match.ocrMisreads[0], confidence: wrong1, correct: false, eq: null },
        { label: match.ocrMisreads[1], confidence: wrong2, correct: false, eq: null },
      ].sort((a, b) => b.confidence - a.confidence);

      setCandidates(cands);
      setMode(MODE.CANDIDATES);
    }, 380 * (LOG_LINES.length + 1));
    timers.current.push(finish);
  };

  const confirmCandidate = (cand) => {
    const match = cand.correct ? cand.eq : DB[lastIndex]; // recognition always resolves to true match on confirm
    setEquation(match);
    setCoeffs({ ...match.defaults });
    setMode(MODE.SOLVED);
    if (!cand.correct) {
      flashToast("CORRECTED READING — REFER TO DATABASE MATCH");
    }
  };

  const resetScan = () => {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(null);
    setEquation(null);
    setCoeffs({});
    setShowCoeffs(false);
    setCandidates([]);
    setManualError("");
    setMode(MODE.IDLE);
  };

  const openManualEntry = () => {
    setManualError("");
    setMode(MODE.MANUAL);
  };

  const submitManual = () => {
    const xMin = parseFloat(manualXMin);
    const xMax = parseFloat(manualXMax);
    const x0 = parseFloat(manualX0);
    const y0 = parseFloat(manualY0);
    if (!manualExpr.trim()) {
      setManualError("ENTER AN EXPRESSION FOR dy/dx");
      return;
    }
    if (![xMin, xMax, x0, y0].every(isFinite) || xMax <= xMin) {
      setManualError("CHECK RANGE AND INITIAL CONDITION VALUES");
      return;
    }
    try {
      const eq = buildManualEquation(manualExpr.trim(), xMin, xMax, x0, y0);
      setEquation(eq);
      setCoeffs({ ...eq.defaults });
      setManualError("");
      setMode(MODE.SOLVED);
    } catch (e) {
      setManualError("COULD NOT PARSE OR EVALUATE THAT EXPRESSION");
    }
  };

  const updateCoeff = (key, value) => {
    setCoeffs((prev) => ({ ...prev, [key]: value }));
  };

  const seriesData = useMemo(() => {
    if (!equation) return [];
    try {
      return equation.series(coeffs);
    } catch (e) {
      return [];
    }
  }, [equation, coeffs]);

  const summaryText = useMemo(() => {
    if (!equation) return "";
    try {
      return equation.summary(coeffs);
    } catch (e) {
      return "";
    }
  }, [equation, coeffs]);

  const saveFavorite = () => {
    if (!equation) return;
    const isManual = equation.id.startsWith("manual-");
    const fav = {
      id: `${equation.id}-${Date.now()}`,
      equationId: equation.id,
      name: equation.name,
      coeffs: { ...coeffs },
      savedAt: new Date().toISOString(),
      ...(isManual
        ? { manualExpr: equation.meta.expr, xMin: equation.meta.xMin, xMax: equation.meta.xMax }
        : {}),
    };
    const list = [fav, ...favorites].slice(0, 30);
    setFavorites(list);
    persistFavorites(list);
    flashToast("SAVED TO FAVORITES");
  };

  const loadFavorite = (fav) => {
    if (fav.manualExpr) {
      try {
        const eq = buildManualEquation(fav.manualExpr, fav.xMin, fav.xMax, fav.coeffs.x0, fav.coeffs.y0);
        setEquation(eq);
        setCoeffs({ ...fav.coeffs });
        setMode(MODE.SOLVED);
        setShowFavorites(false);
      } catch (e) {
        flashToast("COULD NOT RELOAD SAVED EQUATION");
      }
      return;
    }
    const match = DB.find((d) => d.id === fav.equationId);
    if (!match) return;
    setEquation(match);
    setCoeffs({ ...fav.coeffs });
    setMode(MODE.SOLVED);
    setShowFavorites(false);
  };

  const deleteFavorite = (id) => {
    const list = favorites.filter((f) => f.id !== id);
    setFavorites(list);
    persistFavorites(list);
  };

  const shareByMail = () => {
    if (!equation) return;
    const subject = `LDES scan result: ${equation.name}`;
    const body = [
      equation.name,
      equation.standardForm,
      equation.generalSolution,
      summaryText,
      "",
      "— sent from the Lenwoloppali Differential Equation Scanner",
    ].join("\n");
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const shareToFacebook = () => {
    if (!equation) return;
    const quote = `Just solved the ${equation.name} with the Lenwoloppali Differential Equation Scanner: ${equation.generalSolution}`;
    const url = "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent("https://lenwoloppali.app") +
      "&quote=" + encodeURIComponent(quote);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-black text-green-400 p-3">
      <style>{`
        @keyframes ldes-sweep {
          0% { top: 0%; opacity: .9; }
          50% { opacity: .5; }
          100% { top: 100%; opacity: .9; }
        }
        @keyframes ldes-blink {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .ldes-mono { font-family: ui-monospace, SFMono-Regular, "Courier New", monospace; }
        .ldes-scanline-overlay {
          background-image: repeating-linear-gradient(
            0deg,
            rgba(74,255,176,0.05) 0px,
            rgba(74,255,176,0.05) 1px,
            transparent 1px,
            transparent 3px
          );
        }
        .ldes-glow { text-shadow: 0 0 6px rgba(74,255,176,0.55), 0 0 1px rgba(74,255,176,0.8); }
        .ldes-btn {
          font-family: ui-monospace, SFMono-Regular, "Courier New", monospace;
          letter-spacing: 0.03em;
          transition: background-color .15s ease, box-shadow .15s ease;
        }
        .ldes-btn:hover { box-shadow: 0 0 10px rgba(74,255,176,0.35); }
        .ldes-btn:active { transform: translateY(1px); }
        .ldes-cursor::after {
          content: "▊";
          animation: ldes-blink 1s steps(1) infinite;
          margin-left: 2px;
        }
        input[type="range"] { accent-color: #4affb0; }
      `}</style>

      <div className="w-full max-w-5xl relative">
        <div className="pointer-events-none absolute inset-0 ldes-scanline-overlay rounded-xl" />

        {/* Header */}
        <div className="text-center pt-2 pb-6 relative">
          <div className="ldes-mono text-3xl font-bold tracking-widest ldes-glow">
            LENWOLOPPALI
          </div>
          <div className="ldes-mono text-xs tracking-widest text-green-500/80 mt-1">
            DIFFERENTIAL EQUATION SCANNER · MODEL LH-Δ · DESKTOP UNIT
          </div>
          <div className="ldes-mono text-[10px] text-green-700 mt-1">
            PATENT PENDING — RAJESH INDUSTRIES
          </div>
        </div>

        <div className="flex flex-row gap-6 items-start">
          {/* ---------------- LEFT COLUMN: capture / input ---------------- */}
          <div className="w-96 flex-shrink-0">
            {/* Dropzone / viewfinder */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => mode === MODE.IDLE && fileInputRef.current && fileInputRef.current.click()}
              className={`relative border rounded-lg aspect-[4/3] flex items-center justify-center overflow-hidden mb-3 transition-colors ${
                dragActive ? "border-green-300 bg-green-900/25" : "border-green-700/60 bg-green-950/10"
              } ${mode === MODE.IDLE ? "cursor-pointer" : ""}`}
            >
              {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map(
                (pos, i) => (
                  <div
                    key={i}
                    className={`absolute ${pos} w-4 h-4 border-green-400`}
                    style={{
                      borderTopWidth: pos.includes("top") ? 2 : 0,
                      borderBottomWidth: pos.includes("bottom") ? 2 : 0,
                      borderLeftWidth: pos.includes("left") ? 2 : 0,
                      borderRightWidth: pos.includes("right") ? 2 : 0,
                    }}
                  />
                )
              )}

              {mode === MODE.IDLE && (
                <div className="text-center px-6 ldes-mono text-xs text-green-600">
                  <Upload className="mx-auto mb-2 opacity-60" size={28} />
                  DRAG &amp; DROP A PHOTO, CLICK TO BROWSE,
                  <br />
                  OR PASTE (CTRL+V) A HANDWRITTEN EQUATION
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openManualEntry();
                      }}
                      className="ldes-mono text-[10px] text-green-500 underline underline-offset-2 hover:text-green-300"
                    >
                      or type one in instead
                    </button>
                  </div>
                </div>
              )}

              {(mode === MODE.SCANNING || mode === MODE.CANDIDATES) && imgUrl && (
                <img
                  src={imgUrl}
                  alt="captured equation"
                  className="w-full h-full object-contain opacity-80"
                  style={{ filter: "grayscale(0.4) contrast(1.1) sepia(0.15) hue-rotate(60deg)" }}
                />
              )}

              {mode === MODE.SCANNING && (
                <div
                  className="absolute left-0 w-full h-0.5 bg-green-400"
                  style={{
                    boxShadow: "0 0 8px 2px rgba(74,255,176,0.8)",
                    animation: "ldes-sweep 1.8s ease-in-out infinite",
                  }}
                />
              )}

              {mode === MODE.SOLVED && equation && (
                <div className="text-center px-4 ldes-mono">
                  <div className="text-[10px] text-green-600 mb-1">MATCHED PATTERN</div>
                  <div className="text-base font-bold ldes-glow">{equation.standardForm}</div>
                </div>
              )}
            </div>

            {/* Scanning log */}
            {mode === MODE.SCANNING && (
              <div className="ldes-mono text-[11px] text-green-500 mb-3 min-h-[80px] leading-5">
                {LOG_LINES.slice(0, logIndex).map((l, i) => (
                  <div key={i}>&gt; {l}</div>
                ))}
                <div className="ldes-cursor">&gt;&nbsp;</div>
              </div>
            )}

            {/* Candidates */}
            {mode === MODE.CANDIDATES && (
              <div className="mb-3">
                <div className="ldes-mono text-[11px] text-green-600 mb-2">
                  &gt; {candidates.length} CANDIDATE MATCHES — CONFIRM READING:
                </div>
                <div className="space-y-2">
                  {candidates.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => confirmCandidate(c)}
                      className="ldes-btn w-full text-left border border-green-700/60 rounded-md px-3 py-2 bg-green-950/20 hover:bg-green-900/30"
                    >
                      <div className="flex justify-between items-center">
                        <span className="ldes-mono text-sm text-green-300">{c.label}</span>
                        <span className="ldes-mono text-xs text-green-600">
                          {c.confidence.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-green-950 rounded mt-1 overflow-hidden">
                        <div
                          className="h-full bg-green-400"
                          style={{ width: `${c.confidence}%` }}
                        />
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={openManualEntry}
                    className="ldes-btn w-full text-left border border-green-800/50 rounded-md px-3 py-2 bg-black/40 hover:bg-green-950/30 ldes-mono text-xs text-green-600"
                  >
                    None of these — enter it manually
                  </button>
                </div>
              </div>
            )}

            {/* Manual entry form */}
            {mode === MODE.MANUAL && (
              <div className="mb-3 border border-green-800/50 rounded-md bg-green-950/10 p-3">
                <div className="ldes-mono text-[11px] text-green-600 mb-3">
                  &gt; MANUAL ENTRY — CLASSIFIED OFFLINE, NO NETWORK
                </div>

                <label className="block ldes-mono text-[11px] text-green-400 mb-1">
                  dy/dx = 
                </label>
                <input
                  type="text"
                  value={manualExpr}
                  onChange={(e) => setManualExpr(e.target.value)}
                  placeholder="e.g. x*y   or   (x+y)/x   or   sin(y)-x"
                  className="ldes-mono w-full bg-black border border-green-700 rounded-md px-2 py-2 text-sm text-green-300 mb-3 placeholder-green-800"
                />

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block ldes-mono text-[10px] text-green-500 mb-1">x₀ (initial x)</label>
                    <input
                      type="number"
                      value={manualX0}
                      onChange={(e) => setManualX0(e.target.value)}
                      className="ldes-mono w-full bg-black border border-green-700 rounded-md px-2 py-1.5 text-xs text-green-300"
                    />
                  </div>
                  <div>
                    <label className="block ldes-mono text-[10px] text-green-500 mb-1">y₀ (initial y)</label>
                    <input
                      type="number"
                      value={manualY0}
                      onChange={(e) => setManualY0(e.target.value)}
                      className="ldes-mono w-full bg-black border border-green-700 rounded-md px-2 py-1.5 text-xs text-green-300"
                    />
                  </div>
                  <div>
                    <label className="block ldes-mono text-[10px] text-green-500 mb-1">x range: min</label>
                    <input
                      type="number"
                      value={manualXMin}
                      onChange={(e) => setManualXMin(e.target.value)}
                      className="ldes-mono w-full bg-black border border-green-700 rounded-md px-2 py-1.5 text-xs text-green-300"
                    />
                  </div>
                  <div>
                    <label className="block ldes-mono text-[10px] text-green-500 mb-1">x range: max</label>
                    <input
                      type="number"
                      value={manualXMax}
                      onChange={(e) => setManualXMax(e.target.value)}
                      className="ldes-mono w-full bg-black border border-green-700 rounded-md px-2 py-1.5 text-xs text-green-300"
                    />
                  </div>
                </div>

                {manualError && (
                  <div className="ldes-mono text-[11px] text-amber-400 mb-3">&gt; {manualError}</div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={resetScan}
                    className="ldes-btn flex items-center justify-center gap-2 border border-green-700 rounded-md py-2 text-xs hover:bg-green-900/30"
                  >
                    <X size={14} /> CANCEL
                  </button>
                  <button
                    onClick={submitManual}
                    className="ldes-btn flex items-center justify-center gap-2 bg-green-500 text-black font-bold rounded-md py-2 text-xs hover:bg-green-400"
                  >
                    CLASSIFY &amp; INTEGRATE
                  </button>
                </div>
              </div>
            )}

            {/* Primary action */}
            <div className="mb-3">
              {mode === MODE.IDLE && (
                <button
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="ldes-btn w-full flex items-center justify-center gap-2 bg-green-500 text-black font-bold rounded-md py-3 text-sm hover:bg-green-400"
                >
                  <Upload size={16} /> UPLOAD PHOTO
                </button>
              )}
              {mode === MODE.CANDIDATES && (
                <button
                  onClick={resetScan}
                  className="ldes-btn w-full flex items-center justify-center gap-2 border border-green-700 rounded-md py-2 text-xs hover:bg-green-900/30"
                >
                  <X size={14} /> CANCEL SCAN
                </button>
              )}
              {mode === MODE.SOLVED && (
                <button
                  onClick={resetScan}
                  className="ldes-btn w-full flex items-center justify-center gap-2 border border-green-600 rounded-md py-2 text-xs hover:bg-green-900/30"
                >
                  <RefreshCw size={14} /> NEW SCAN
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />

            {/* Favorites */}
            <button
              onClick={() => setShowFavorites((s) => !s)}
              className="ldes-btn w-full flex items-center justify-between border border-green-800/60 rounded-md px-3 py-2 text-xs text-green-500 mb-2"
            >
              <span className="flex items-center gap-2">
                <FolderOpen size={14} /> FAVORITES ({favorites.length})
              </span>
              {showFavorites ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFavorites && (
              <div className="border border-green-800/50 rounded-md bg-green-950/10 p-2 mb-4 max-h-72 overflow-y-auto">
                {favorites.length === 0 && (
                  <div className="ldes-mono text-[11px] text-green-700 text-center py-3">
                    NO SAVED EQUATIONS YET
                  </div>
                )}
                {favorites.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between border-b border-green-900/60 py-2 last:border-0"
                  >
                    <button
                      onClick={() => loadFavorite(f)}
                      className="ldes-mono text-xs text-green-300 text-left hover:underline"
                    >
                      {f.name}
                      <div className="text-[9px] text-green-700">
                        {new Date(f.savedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => deleteFavorite(f.id)}
                      className="text-green-700 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---------------- RIGHT COLUMN: solved output ---------------- */}
          <div className="flex-1 min-w-0">
            {mode === MODE.SOLVED && equation ? (
              <div className="border border-green-800/50 rounded-lg bg-green-950/5 p-5">
                <div className="ldes-mono text-lg font-bold text-green-300">{equation.name}</div>
                <div className="ldes-mono text-xs text-green-600 mb-2">{equation.subtitle}</div>
                <div className="ldes-mono text-sm text-green-500 mb-3 leading-6">
                  {equation.generalSolution}
                </div>
                <div className="ldes-mono text-sm text-green-300 bg-green-950/20 border border-green-800/50 rounded-md px-3 py-2 mb-4">
                  {summaryText}
                </div>

                <div className="border border-green-800/50 rounded-md bg-green-950/10 p-3 mb-4" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={seriesData} margin={{ top: 10, right: 20, left: -5, bottom: 5 }}>
                      <CartesianGrid stroke="#0f3d2a" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="x"
                        stroke="#4affb0"
                        tick={{ fontSize: 10, fill: "#4affb0" }}
                        tickFormatter={(v) => fmt(v, 2)}
                        label={{ value: equation.xLabel, position: "insideBottom", offset: -3, fill: "#4affb0", fontSize: 10 }}
                      />
                      <YAxis
                        stroke="#4affb0"
                        tick={{ fontSize: 10, fill: "#4affb0" }}
                        tickFormatter={(v) => fmt(v, 2)}
                        width={50}
                      />
                      <Tooltip
                        contentStyle={{ background: "#031a10", border: "1px solid #146b45", fontSize: 12 }}
                        labelStyle={{ color: "#4affb0" }}
                        formatter={(v) => fmt(v, 4)}
                        labelFormatter={(v) => `${equation.xLabel}: ${fmt(v, 3)}`}
                      />
                      <Line type="monotone" dataKey="y" stroke="#4affb0" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <button
                  onClick={() => setShowCoeffs((s) => !s)}
                  className="ldes-btn w-full flex items-center justify-between border border-green-700/60 rounded-md px-3 py-2 mb-2 bg-green-950/20 hover:bg-green-900/30 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={14} /> SUBSTITUTE COEFFICIENTS
                  </span>
                  {showCoeffs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showCoeffs && (
                  <div className="border border-green-800/50 rounded-md bg-green-950/10 p-3 mb-4 grid grid-cols-2 gap-x-6 gap-y-3">
                    {equation.coeffConfig.map((cfg) => (
                      <div key={cfg.key}>
                        <div className="flex justify-between text-[11px] ldes-mono text-green-400 mb-1">
                          <span>{cfg.label}</span>
                          <span>
                            {fmt(coeffs[cfg.key], 3)} {cfg.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={cfg.min}
                          max={cfg.max}
                          step={cfg.step}
                          value={coeffs[cfg.key]}
                          onChange={(e) => updateCoeff(cfg.key, parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={saveFavorite}
                    className="ldes-btn flex items-center justify-center gap-2 border border-green-600 rounded-md py-2 text-xs hover:bg-green-900/30"
                  >
                    <Star size={14} /> SAVE FAVORITE
                  </button>
                  <button
                    onClick={shareByMail}
                    className="ldes-btn flex items-center justify-center gap-2 border border-green-600 rounded-md py-2 text-xs hover:bg-green-900/30"
                  >
                    <Mail size={14} /> FORWARD
                  </button>
                  <button
                    onClick={shareToFacebook}
                    className="ldes-btn flex items-center justify-center gap-2 border border-green-600 rounded-md py-2 text-xs hover:bg-green-900/30"
                  >
                    <Share2 size={14} /> POST TO FACEBOOK
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-green-800/70 rounded-lg h-full min-h-[420px] flex items-center justify-center ldes-mono text-xs text-green-700 text-center px-10">
                {mode === MODE.MANUAL
                  ? "Fill in the form on the left, then press Classify & Integrate."
                  : mode === MODE.SCANNING || mode === MODE.CANDIDATES
                  ? "Recognition in progress on the left — confirm a match to see the solved output here."
                  : "Drop, browse, or paste an equation on the left to see the solved output here."}
              </div>
            )}
          </div>
        </div>

        <div className="ldes-mono text-[9px] text-green-800 text-center pt-6 pb-4">
          LDES v3.7 — "THE BUS PANTS UTILIZATION" EDITION — DESKTOP UNIT
        </div>

        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-black ldes-mono text-xs px-4 py-2 rounded-md shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
