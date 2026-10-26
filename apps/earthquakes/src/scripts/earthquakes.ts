import * as S from '../lib/sim-core';

const cfg = JSON.parse(document.getElementById('lab-config')!.textContent!);
const $ = <T extends Element = HTMLElement>(id: string) => document.getElementById(id) as unknown as T;
const NS = 'http://www.w3.org/2000/svg';
const f = (n: number, d = 1) => n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
const sci = (n: number) => {
  if (n < 1e5 && n >= 0.01) return f(n, n < 10 ? 2 : 0);
  const e = Math.floor(Math.log10(n));
  return `${f(n / 10 ** e, 1)} × 10<sup>${e}</sup>`;
};
const num = (id: string) => parseFloat($<HTMLInputElement>(id).value);
const text = (id: string, v: string) => ($(id).textContent = v);
const html = (id: string, v: string) => ($(id).innerHTML = v);
const el = (tag: string, attrs: Record<string, string | number> = {}, parent?: Element) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e;
};

document.documentElement.classList.add('js');
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let t0 = performance.now();

// ---------- Tabs ----------
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role=tab]')];
const panels = tabs.map((t) => $(t.getAttribute('aria-controls')!));
let cur = 0;
function show(i: number, focus = false) {
  cur = Math.max(0, Math.min(tabs.length - 1, i));
  tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === cur)); t.tabIndex = j === cur ? 0 : -1; panels[j].hidden = j !== cur; });
  text('progress', `Module ${cur + 1} of ${tabs.length}`);
  $<HTMLButtonElement>('prev').disabled = cur === 0;
  $<HTMLButtonElement>('next').disabled = cur === tabs.length - 1;
  if (focus) tabs[cur].focus();
  renderAll();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => show(i));
  t.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowRight') show(i + 1, true); else if (k === 'ArrowLeft') show(i - 1, true);
    else if (k === 'Home') show(0, true); else if (k === 'End') show(tabs.length - 1, true); else return;
    e.preventDefault();
  });
});
$('prev').addEventListener('click', () => { show(cur - 1); tabs[cur].scrollIntoView({ block: 'center' }); });
$('next').addEventListener('click', () => { show(cur + 1); tabs[cur].scrollIntoView({ block: 'center' }); });
$('anim-toggle').addEventListener('click', (e) => {
  playing = !playing; t0 = performance.now();
  (e.currentTarget as HTMLElement).textContent = playing ? 'Pause animations' : 'Play animations';
  (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(!playing));
  if (playing) requestAnimationFrame(loop);
});

// ---------- Shared speeds ----------
let vp = 6, vs = 3.5, vr = 3.2;
function readSpeeds(changed?: string) {
  vp = num('vp'); vs = num('vs'); vr = num('vr');
  let warn = false;
  if (vs >= vp - 0.1) { vs = Math.round((vp - 0.2) * 10) / 10; $<HTMLInputElement>('vs').value = String(vs); warn = true; }
  if (changed) $<HTMLSelectElement>('speed-preset').value = 'custom';
  $('speed-warn').hidden = !warn;
  text('o-vp', f(vp)); text('o-vs', f(vs)); text('o-vr', f(vr));
}
$<HTMLSelectElement>('speed-preset').addEventListener('change', (e) => {
  const p = cfg.speedPresets.find((x: { id: string }) => x.id === (e.target as HTMLSelectElement).value);
  if (!p) return;
  $<HTMLInputElement>('vp').value = p.vp; $<HTMLInputElement>('vs').value = p.vs; $<HTMLInputElement>('vr').value = p.vr;
  readSpeeds(); renderAll();
});
['vp', 'vs', 'vr'].forEach((id) => $(id).addEventListener('input', () => { readSpeeds(id); renderAll(); }));

// ---------- Module 1: waves ----------
const wsvg = $<SVGSVGElement>('wave-svg');
const rows = [
  { id: 'tog-p', label: 'P-wave: particles move along the direction of travel', y: 45, dash: '' },
  { id: 'tog-s', label: 'S-wave: particles move across the direction of travel', y: 120, dash: '6 4' },
  { id: 'tog-r', label: 'Surface wave: rolling motion near the surface', y: 195, dash: '2 4' },
];
const parts: SVGCircleElement[][] = [];
rows.forEach((r, ri) => {
  const g = el('g', { id: `row-${ri}` }, wsvg);
  el('line', { x1: 10, x2: 590, y1: r.y, y2: r.y, stroke: '#9aa0a6', 'stroke-dasharray': r.dash || '0' }, g);
  const t = el('text', { x: 12, y: r.y - 24 }, g); t.textContent = r.label;
  const arrow = el('text', { x: 560, y: r.y - 24 }, g); arrow.textContent = 'travel →';
  parts[ri] = [];
  for (let i = 0; i < 30; i++) parts[ri].push(el('circle', { r: ri === 2 ? 3.5 : 4, fill: ['#2f3fa0', '#b3300f', '#0b6e7a'][ri], stroke: '#fff', 'stroke-width': 1 }, g) as SVGCircleElement);
});
const PXK = 30; // px/s per km/s (on-screen scaling, not to scale)
function drawWaves(tt: number) {
  [vp, vs, vr].forEach((v, ri) => {
    const k = (2 * Math.PI) / 120, w = k * v * PXK;
    parts[ri].forEach((c, i) => {
      const x0 = 20 + i * 19.3, ph = k * x0 - w * tt, y = rows[ri].y;
      if (ri === 0) { c.setAttribute('cx', String(x0 + 8 * Math.sin(ph))); c.setAttribute('cy', String(y)); }
      else if (ri === 1) { c.setAttribute('cx', String(x0)); c.setAttribute('cy', String(y + 12 * Math.sin(ph))); }
      else { c.setAttribute('cx', String(x0 + 6 * Math.cos(ph))); c.setAttribute('cy', String(y + 10 * Math.sin(ph))); }
    });
    $(`row-${ri}`).setAttribute('display', $<HTMLInputElement>(rows[ri].id).checked ? 'inline' : 'none');
  });
}
const noise = (i: number) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s) - 0.5; };
function wavelet(t: number, t0: number, a: number, cyc: number, tau: number, tmax: number) {
  return t < t0 ? 0 : a * Math.sin(((2 * Math.PI * cyc) / tmax) * (t - t0)) * Math.exp(-(t - t0) / (tau * tmax));
}
function drawSeis() {
  const d = num('dist'), tp = S.arrivalTime(d, vp), ts = S.arrivalTime(d, vs), tr = S.arrivalTime(d, vr);
  const tmax = Math.max(tr * 1.25, 5);
  text('o-dist', String(d)); text('o-tp', f(tp)); text('o-ts', f(ts)); text('o-dt', f(ts - tp)); text('o-tr', f(tr));
  const svg = $<SVGSVGElement>('seis'); svg.innerHTML = '';
  const X = (t: number) => 30 + (t / tmax) * 550, mid = 100;
  el('line', { x1: 30, x2: 580, y1: 175, y2: 175, stroke: '#4a5059' }, svg);
  for (let i = 0; i <= 5; i++) { const t = (tmax * i) / 5; el('line', { x1: X(t), x2: X(t), y1: 175, y2: 180, stroke: '#4a5059' }, svg); const tx = el('text', { x: X(t), y: 194, 'text-anchor': 'middle' }, svg); tx.textContent = `${f(t, 0)} s`; }
  let p = '';
  for (let i = 0; i < 600; i++) {
    const t = (i / 599) * tmax;
    let y = noise(i) * 4;
    if ($<HTMLInputElement>('tog-p').checked) y += wavelet(t, tp, 18, 40, 0.05, tmax);
    if ($<HTMLInputElement>('tog-s').checked) y += wavelet(t, ts, 36, 28, 0.08, tmax);
    if ($<HTMLInputElement>('tog-r').checked) y += wavelet(t, tr, 60, 14, 0.14, tmax);
    p += `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${(mid - y).toFixed(1)}`;
  }
  el('path', { d: p, fill: 'none', stroke: '#1c1f24', 'stroke-width': 1.2 }, svg);
  [['P', tp, '#2f3fa0', ''], ['S', ts, '#b3300f', '6 4'], ['Surface', tr, '#0b6e7a', '2 4']].forEach(([l, t, c, dash], i) => {
    if (!$<HTMLInputElement>(rows[i].id).checked) return;
    el('line', { x1: X(t as number), x2: X(t as number), y1: 12, y2: 175, stroke: c as string, 'stroke-width': 2, 'stroke-dasharray': (dash as string) || '0' }, svg);
    const tx = el('text', { x: X(t as number) + 3, y: 14 + i * 13, fill: c as string }, svg); tx.textContent = l as string; tx.setAttribute('style', `fill:${c};font-weight:700`);
  });
}

// ---------- Module 2: locate ----------
const SZ: number = cfg.map.size;
const stations: { name: string; x: number; y: number }[] = cfg.map.stations.map((s: object) => ({ ...s }));
let quake = { x: 120, y: 90 }, picks = [0.5, -0.8, 0.3], revealed = false;
const map = $<SVGSVGElement>('map');
for (let v = 0; v <= SZ; v += 50) {
  el('line', { x1: v, x2: v, y1: 0, y2: SZ, stroke: '#d9dbd6' }, map); el('line', { x1: 0, x2: SZ, y1: v, y2: v, stroke: '#d9dbd6' }, map);
  const a = el('text', { x: v, y: SZ + 11, 'text-anchor': 'middle', 'font-size': 9 }, map); a.textContent = `${v}`;
  const b = el('text', { x: -3, y: v + 3, 'text-anchor': 'end', 'font-size': 9 }, map); b.textContent = `${v}`;
}
el('rect', { x: 0, y: 0, width: SZ, height: SZ, fill: 'none', stroke: '#4a5059' }, map);
const dyn = el('g', {}, map);
const stG = stations.map((s, i) => {
  const g = el('g', { class: 'station', tabindex: 0, role: 'group' }, map);
  el('polygon', { points: '0,-7 6.5,5 -6.5,5', fill: '#1c1f24', stroke: '#fff', 'stroke-width': 1 }, g);
  const t = el('text', { y: 17, 'text-anchor': 'middle' }, g); t.textContent = s.name; t.setAttribute('style', 'font-weight:700');
  const move = (nx: number, ny: number) => { s.x = Math.max(0, Math.min(SZ, nx)); s.y = Math.max(0, Math.min(SZ, ny)); renderLocate(); };
  g.addEventListener('pointerdown', (e) => { (g as unknown as HTMLElement).setPointerCapture((e as PointerEvent).pointerId); g.dataset.drag = '1'; });
  g.addEventListener('pointerup', () => delete (g as unknown as HTMLElement).dataset.drag);
  g.addEventListener('pointermove', (e) => {
    if (!(g as unknown as HTMLElement).dataset.drag) return;
    const pt = map.createSVGPoint(); pt.x = (e as PointerEvent).clientX; pt.y = (e as PointerEvent).clientY;
    const q = pt.matrixTransform(map.getScreenCTM()!.inverse()); move(q.x, q.y);
  });
  g.addEventListener('keydown', (e) => {
    const st = (e as KeyboardEvent).shiftKey ? 1 : 5, k = (e as KeyboardEvent).key;
    const d: Record<string, number[]> = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] };
    if (d[k]) { e.preventDefault(); move(s.x + d[k][0], s.y + d[k][1]); }
  });
  return g;
});
const dashes = ['0', '6 4', '2 4'];
function renderLocate() {
  const n = parseInt($<HTMLSelectElement>('nst').value), sigma = num('sigma'), K = S.kmPerSecondOfDelay(vp, vs);
  text('o-sigma', f(sigma));
  dyn.innerHTML = '';
  const circles: S.Circle[] = [];
  const body = $('st-body'); body.innerHTML = '';
  stations.forEach((s, i) => {
    stG[i].setAttribute('transform', `translate(${s.x} ${s.y})`);
    stG[i].setAttribute('aria-label', `Station ${s.name} at x ${f(s.x, 0)}, y ${f(s.y, 0)} kilometres. Arrow keys move it.`);
    const d = Math.hypot(s.x - quake.x, s.y - quake.y), tp = S.arrivalTime(d, vp), ts = S.arrivalTime(d, vs) + sigma * picks[i];
    const dt = ts - tp, est = S.distanceFromPS(dt, vp, vs);
    body.insertAdjacentHTML('beforeend', `<tr${i >= n ? ' style="opacity:.45"' : ''}><th scope="row">${s.name}${i >= n ? ' (not used)' : ''}</th><td>${f(tp)}</td><td>${f(ts)}</td><td>${f(dt)}</td><td>${f(est)}</td></tr>`);
    if (i < n) circles.push({ c: s, r: est, tol: sigma * K });
  });
  if (n === 3 && sigma > 0) {
    const cells = S.uncertaintyCells(circles, SZ, 2);
    el('path', { d: cells.map((c) => `M${c.x} ${c.y}h2v2h-2z`).join(''), fill: '#b3300f', 'fill-opacity': 0.35 }, dyn);
  }
  circles.forEach((k, i) => {
    if (sigma > 0) el('circle', { cx: k.c.x, cy: k.c.y, r: Math.max(k.r, 0.1), fill: 'none', stroke: '#2f3fa0', 'stroke-opacity': 0.15, 'stroke-width': 2 * k.tol }, dyn);
    el('circle', { cx: k.c.x, cy: k.c.y, r: Math.max(k.r, 0.1), fill: 'none', stroke: '#2f3fa0', 'stroke-width': 1.5, 'stroke-dasharray': dashes[i] }, dyn);
  });
  let est: S.Pt | null = null;
  if (n === 3) {
    est = S.locate(circles, SZ);
    el('path', { d: `M${est.x - 5} ${est.y}h10M${est.x} ${est.y - 5}v10`, stroke: '#1c1f24', 'stroke-width': 2 }, dyn);
    text('o-est', `${f(est.x, 0)}, ${f(est.y, 0)}`);
  } else text('o-est', 'needs 3 stations');
  if (revealed) {
    el('circle', { cx: quake.x, cy: quake.y, r: 6, fill: '#b3300f', stroke: '#fff', 'stroke-width': 1.5 }, dyn);
    const t = el('text', { x: quake.x + 9, y: quake.y + 4 }, dyn); t.textContent = 'Epicentre';
  }
  text('o-err', revealed && est ? `${f(Math.hypot(est.x - quake.x, est.y - quake.y))}` : revealed ? 'n/a' : 'reveal to see');
  text('o-msg', n === 1 ? 'One station: the epicentre could be anywhere on this circle. Distance, but no direction.'
    : n === 2 ? 'Two stations: the circles meet at two points, so the location is still ambiguous.'
    : sigma > 0 ? 'Three stations with timing uncertainty: the shaded region is where all three circles agree.' : 'Three stations: the circles meet at the epicentre.');
}
const newQuake = () => { quake = { x: 20 + Math.random() * 160, y: 20 + Math.random() * 160 }; picks = [0, 1, 2].map(() => Math.random() * 2 - 1); revealed = false; syncReveal(); renderLocate(); };
function syncReveal() { const b = $('reveal'); b.setAttribute('aria-pressed', String(revealed)); b.textContent = revealed ? 'Hide epicentre' : 'Reveal epicentre'; }
$('newq').addEventListener('click', newQuake);
$('reveal').addEventListener('click', () => { revealed = !revealed; syncReveal(); renderLocate(); });
$('nst').addEventListener('change', renderLocate); $('sigma').addEventListener('input', renderLocate);

// ---------- Module 3: magnitude ----------
function trace(svg: Element, cy: number, amp: number, color: string, label: string) {
  let p = '';
  for (let i = 0; i < 400; i++) { const t = i / 399, y = Math.sin(t * 90) * Math.exp(-t * 3.2) * (t > 0.08 ? 1 : 0) * amp + noise(i) * 0.6; p += `${i ? 'L' : 'M'}${30 + t * 550} ${cy - y}`; }
  el('line', { x1: 30, x2: 580, y1: cy, y2: cy, stroke: '#d9dbd6' }, svg);
  el('path', { d: p, fill: 'none', stroke: color, 'stroke-width': 1.5 }, svg);
  const t = el('text', { x: 32, y: cy - 48 }, svg); t.textContent = label;
}
function renderMag() {
  const m1 = num('m1'), m2 = num('m2'), dm = m2 - m1, ar = S.amplitudeRatio(m1, m2), er = S.energyRatio(m1, m2);
  text('o-m1', f(m1)); text('o-m2', f(m2)); text('o-dm', `${dm >= 0 ? '+' : ''}${f(dm)}`);
  html('o-ar', sci(ar) + '×'); html('o-er', sci(er) + '×');
  const show = $<HTMLInputElement>('show-energy').checked;
  document.querySelectorAll<HTMLElement>('.en').forEach((e) => (e.hidden = !show));
  html('o-en', `Approximate radiated energy (log₁₀E ≈ 1.5M + 4.8): M${f(m1)} ≈ ${sci(S.energyJoules(m1))} J; M${f(m2)} ≈ ${sci(S.energyJoules(m2))} J. Energy grows much faster than amplitude.`);
  const svg = $<SVGSVGElement>('mag-svg'); svg.innerHTML = '';
  const big = Math.max(1, ar), a1 = 46 / big, a2 = (46 * ar) / big;
  trace(svg, 55, a1, '#2f3fa0', `Earthquake 1 (M${f(m1)}), amplitude relative to the largest trace`);
  trace(svg, 165, a2, '#b3300f', `Earthquake 2 (M${f(m2)})`);
}
['m1', 'm2', 'show-energy'].forEach((id) => $(id).addEventListener('input', renderMag));

// ---------- Module 4: tsunami ----------
let depth = 4000, T = 900;
const tsvg = $<SVGSVGElement>('tsu-svg');
const bath = (u: number) => (u < 0.5 ? depth : u < 0.72 ? depth + ((u - 0.5) / 0.22) * (cfg.tsunami.shelfDepth - depth) : u < 0.86 ? cfg.tsunami.shelfDepth : Math.max(3, cfg.tsunami.shelfDepth + ((u - 0.86) / 0.14) * (3 - cfg.tsunami.shelfDepth)));
const Y = (d: number) => 70 + 120 * Math.sqrt(Math.min(d, 6000) / 6000);
function drawTsunami(tt: number) {
  const N = 150, w = (2 * Math.PI) / T; let ph = 0, line = '', water = '';
  for (let i = 0; i <= N; i++) {
    const u = i / N, d = bath(u), v = S.tsunamiSpeed(d);
    ph += (w / v) * ((400000) / N);
    const amp = Math.min(34, 5 * S.heightRatio(depth, d));
    const y = 70 - amp * Math.sin(ph - (2 * Math.PI * tt) / 4);
    line += `${i ? 'L' : 'M'}${u * 600} ${y.toFixed(1)}`;
  }
  water = `${line}L600 235L0 235Z`;
  let sea = ''; for (let i = 0; i <= N; i++) sea += `${i ? 'L' : 'M'}${(i / N) * 600} ${Y(bath(i / N)).toFixed(1)}`;
  tsvg.innerHTML = `<path d="${water}" fill="#d7eef0" stroke="none"/><path d="${line}" fill="none" stroke="#0b6e7a" stroke-width="2.5"/><path d="${sea}L600 240L0 240Z" fill="#e8dfc8" stroke="#6b5d3a" stroke-width="1.5"/>
  <text x="12" y="228">Deep ocean</text><text x="370" y="228">Continental shelf</text><text x="545" y="228">Shore</text>`;
}
function renderTsunamiStats() {
  const v = S.tsunamiSpeed(depth);
  text('o-depth', f(depth, 0)); text('o-period', f(T / 60, 0)); text('o-lambda', f((v * T) / 1000, 0));
  text('o-v', f(v)); text('o-kmh', f(S.msToKmh(v), 0)); text('o-mph', f(S.msToMph(v), 0));
  html('shore-body', [['Deep ocean', depth], ['Continental shelf', cfg.tsunami.shelfDepth], ['Near shore', cfg.tsunami.shoreDepth]]
    .map(([n, d]) => `<tr><th scope="row">${n}</th><td>${f(d as number, 0)}</td><td>${f(S.tsunamiSpeed(d as number))}</td><td>${f((S.tsunamiSpeed(d as number) * T) / 1000)}</td><td>${f(S.heightRatio(depth, d as number), 2)}×</td></tr>`).join(''));
}
$('depth').addEventListener('input', () => { depth = num('depth'); const v = S.tsunamiSpeed(depth); $<HTMLInputElement>('lambda').value = String(Math.min(700, Math.max(5, Math.round((v * T) / 5000) * 5))); renderTsunamiStats(); if (!playing) drawTsunami(0); });
$('period').addEventListener('input', () => { T = num('period') * 60; $<HTMLInputElement>('lambda').value = String(Math.round((S.tsunamiSpeed(depth) * T) / 5000) * 5); renderTsunamiStats(); });
$('lambda').addEventListener('input', () => { const v = S.tsunamiSpeed(depth); T = Math.min(3600, Math.max(120, (num('lambda') * 1000) / v)); $<HTMLInputElement>('period').value = String(Math.round(T / 60)); renderTsunamiStats(); });

let segs: S.Segment[] = cfg.tsunami.segments.map((s: S.Segment) => ({ ...s }));
const dur = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} h ${m} min` : m ? `${m} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`; };
function renderSegs() {
  const body = $('seg-body'); body.innerHTML = '';
  segs.forEach((g, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<th scope="row">${i + 1}</th><td><input type="number" min="0" step="10" value="${g.km}" aria-label="Segment ${i + 1} distance in kilometres" data-i="${i}" data-k="km"></td><td><input type="number" min="1" step="10" value="${g.depth}" aria-label="Segment ${i + 1} depth in metres" data-i="${i}" data-k="depth"></td><td data-s></td><td data-t></td><td><button type="button" class="btn alt" data-rm="${i}" aria-label="Remove segment ${i + 1}">Remove</button></td>`;
    body.appendChild(tr);
  });
  updSegs();
}
function updSegs() {
  const rowsE = $('seg-body').querySelectorAll('tr'); let tot = 0;
  segs.forEach((g, i) => { if (g.depth > 0 && g.km >= 0) { const t = S.segmentSeconds(g.km, g.depth); tot += t; rowsE[i].querySelector('[data-s]')!.textContent = f(S.tsunamiSpeed(g.depth)); rowsE[i].querySelector('[data-t]')!.textContent = dur(t); } });
  text('seg-total', `${dur(tot)} (${f(tot / 3600, 2)} h)`);
}
$('seg-body').addEventListener('input', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.i) { (segs[+t.dataset.i] as unknown as Record<string, number>)[t.dataset.k!] = parseFloat(t.value) || 0; updSegs(); } });
$('seg-body').addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-rm]') as HTMLElement | null; if (b && segs.length > 1) { segs.splice(+b.dataset.rm!, 1); renderSegs(); } });
$('seg-add').addEventListener('click', () => { segs.push({ km: 10, depth: 20 }); renderSegs(); });
$('seg-reset').addEventListener('click', () => { segs = cfg.tsunami.segments.map((s: S.Segment) => ({ ...s })); renderSegs(); });

// ---------- Loop & init ----------
function renderAll() { drawSeis(); drawWaves(0); renderLocate(); renderMag(); renderTsunamiStats(); drawTsunami(0); }
function loop(now: number) {
  if (!playing) return;
  const tt = (now - t0) / 1000;
  if (cur === 0) drawWaves(tt); else if (cur === 3) drawTsunami(tt);
  requestAnimationFrame(loop);
}
readSpeeds(); renderSegs(); newQuake(); show(0);
if (playing) requestAnimationFrame(loop);
