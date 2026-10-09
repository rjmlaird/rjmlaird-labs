const $ = (s) => document.querySelector(s);
const QUAD = {
  star: { label: "Star", color: "var(--purple)", prompt: "Protect leadership and fund growth, while checking that returns justify the investment." },
  question: { label: "Question Mark", color: "var(--teal)", prompt: "Decide whether to build a credible position, reposition, partner or exit. Run small tests first." },
  cash: { label: "Cash Cow", color: "var(--amber)", prompt: "Maintain health and efficiency, protect cash generation and avoid starving it of renewal." },
  dog: { label: "Dog", color: "var(--red)", prompt: "Consider harvesting, redesigning, repositioning, partnering or exiting, based on wider strategic value." }
};
const DEMOS = {
  software: [
    { name: "Collaborative impact-planning workspace", note: "Early-stage offer in a growing category. It requires evidence of repeat use and willingness to pay before significant investment in acquisition or product expansion.", growth: 14, share: 0.7 },
    { name: "Reporting add-on", note: "Strong adoption among existing customers in a maturing segment.", growth: 6, share: 1.4 },
    { name: "Analytics dashboard", note: "Market leader in a fast-growing niche. Needs continued product investment.", growth: 22, share: 1.6 },
    { name: "Legacy desktop tool", note: "Declining usage and high maintenance load. Review migration paths for remaining users.", growth: -3, share: 0.3 }
  ],
  consumer: [
    { name: "Signature range", note: "Category leader with loyal repeat buyers.", growth: 4, share: 1.8 },
    { name: "Plant-based line", note: "Fast-growing category where the brand is a small player.", growth: 24, share: 0.4 },
    { name: "Premium refill", note: "Rapid growth with a competitive lead.", growth: 18, share: 1.2 },
    { name: "Seasonal gift sets", note: "Low growth and small share; margin is thin.", growth: 1, share: 0.5 }
  ],
  services: [
    { name: "Strategy retainers", note: "Reliable, relationship-led income in a stable market.", growth: 5, share: 1.5 },
    { name: "Training programmes", note: "Growing demand; the firm is one of many providers.", growth: 16, share: 0.6 },
    { name: "Evaluation services", note: "Strong reputation in a growing field.", growth: 13, share: 1.3 },
    { name: "Ad hoc workshops", note: "Low-margin, one-off work with weak differentiation.", growth: 2, share: 0.4 }
  ]
};
const GUIDANCE = [
  "Treat growth and share as directional estimates. Document sources and refresh them regularly.",
  "Define the market boundary first; a narrow or broad definition can move an item between quadrants.",
  "Use thresholds that suit your industry rather than defaulting to 10% growth and 1.0x share.",
  "Look beyond two axes: profitability, capability, customer value, risk and strategic fit all matter.",
  "Balance the portfolio: Question Marks and Stars need cash that Cash Cows and careful Dogs can help provide."
];
let items = [], selected = null;
const els = {
  form: $("#bcg-form"), name: $("#item-name"), note: $("#item-note"), growth: $("#market-growth"), share: $("#relative-share"),
  gt: $("#growth-threshold"), st: $("#share-threshold"), grid: $("#matrix-grid"), demo: $("#demo-picker")
};
const classify = (g, s) => {
  const hg = g >= +els.gt.value, hs = s >= +els.st.value;
  return hg && hs ? "star" : hg ? "question" : hs ? "cash" : "dog";
};
// Map a value to 0-100% so that the threshold always sits at 50%, keeping bubbles aligned with the fixed 2x2 grid.
const pos = (v, thr, min, max) => {
  const t = Math.min(Math.max(v, min), max);
  return t < thr ? 50 * (t - min) / Math.max(thr - min, 1e-6) : 50 + 50 * (t - thr) / Math.max(max - thr, 1e-6);
};
const clampPct = (p) => Math.min(92, Math.max(8, p));
function updateOutputs() {
  $("#market-growth-value").textContent = `${els.growth.value}%`;
  $("#relative-share-value").textContent = `${(+els.share.value).toFixed(2)}x`;
}
function render() {
  els.grid.querySelectorAll(".bubble").forEach((b) => b.remove());
  const counts = { star: 0, question: 0, cash: 0, dog: 0 };
  const gMin = +els.growth.min, gMax = +els.growth.max, sMin = +els.share.min, sMax = +els.share.max;
  items.forEach((it, i) => {
    const q = classify(it.growth, it.share); counts[q]++;
    const b = document.createElement("button");
    b.type = "button"; b.className = "bubble" + (i === selected ? " selected" : "");
    b.style.left = clampPct(100 - pos(it.share, +els.st.value, sMin, sMax)) + "%"; // high share sits on the left, as in the classic BCG layout
    b.style.bottom = clampPct(pos(it.growth, +els.gt.value, gMin, gMax)) + "%";
    b.style.setProperty("--bubble-size", "66px"); b.style.setProperty("--bubble-color", QUAD[q].color);
    b.setAttribute("aria-label", `${it.name}: ${QUAD[q].label}, growth ${it.growth}%, relative share ${it.share.toFixed(1)}x`);
    const label = it.name.length > 14 ? it.name.slice(0, 13) + "…" : it.name;
    b.innerHTML = `<span>${label.replace(/</g, "&lt;")}<small>${it.share.toFixed(1)}x · ${it.growth}%</small></span>`;
    b.addEventListener("click", () => select(i)); els.grid.appendChild(b);
  });
  $("#portfolio-count").textContent = items.length;
  Object.keys(counts).forEach((k) => ($("#count-" + k).textContent = counts[k]));
  const sel = selected !== null ? classify(items[selected].growth, items[selected].share) : null;
  els.grid.querySelectorAll(".quadrant").forEach((el) => el.classList.toggle("dimmed", !!sel && el.dataset.quadrant !== sel));
  els.grid.querySelectorAll(".bubble").forEach((el, i) => el.classList.toggle("dimmed", selected !== null && i !== selected));
  detail();
}
function detail() {
  if (selected === null || !items[selected]) {
    $("#detail-title").textContent = "Select a portfolio item";
    $("#detail-note").textContent = "Click a bubble to inspect its market-growth and relative-share assumptions, strategic note and decision prompts.";
    ["quadrant", "position", "strategy-note", "prompt"].forEach((k) => ($("#detail-" + k).textContent = "—")); return;
  }
  const it = items[selected], q = QUAD[classify(it.growth, it.share)];
  $("#detail-title").textContent = it.name; $("#detail-note").textContent = `${q.label}: ${q.prompt}`;
  $("#detail-quadrant").textContent = q.label; $("#detail-position").textContent = `${it.growth}% growth · ${it.share.toFixed(1)}x share`;
  $("#detail-strategy-note").textContent = it.note || "No note added."; $("#detail-prompt").textContent = q.prompt;
}
function select(i) {
  selected = i; const it = items[i];
  els.name.value = it.name; els.note.value = it.note; els.growth.value = it.growth; els.share.value = it.share; updateOutputs(); render();
}
function loadDemo(key) { items = DEMOS[key].map((d) => ({ ...d })); selected = null; render(); }
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const it = { name: els.name.value.trim() || "Untitled item", note: els.note.value.trim(), growth: +els.growth.value, share: +els.share.value };
  const at = items.findIndex((x) => x.name.toLowerCase() === it.name.toLowerCase());
  if (at >= 0) { items[at] = it; selected = at; } else { items.push(it); selected = items.length - 1; }
  render();
});
[els.growth, els.share].forEach((el) => el.addEventListener("input", updateOutputs));
[els.gt, els.st].forEach((el) => el.addEventListener("input", render));
els.demo.addEventListener("change", () => { if (els.demo.value) loadDemo(els.demo.value); });
$("#remove-item").addEventListener("click", () => { if (selected !== null) { items.splice(selected, 1); selected = null; render(); } });
$("#copy-portfolio").addEventListener("click", async () => {
  const lines = items.map((it) => `- ${it.name}: ${QUAD[classify(it.growth, it.share)].label} (growth ${it.growth}%, relative share ${it.share.toFixed(1)}x)`);
  const text = `BCG growth-share portfolio\n${lines.join("\n")}`; const btn = $("#copy-portfolio"), old = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; } catch { btn.textContent = "Copy not available"; }
  setTimeout(() => (btn.textContent = old), 1600);
});
$("#guidance-list").innerHTML = GUIDANCE.map((g) => `<li><span class="guidance-icon" aria-hidden="true">✓</span>${g}</li>`).join("");
updateOutputs(); loadDemo("software");
