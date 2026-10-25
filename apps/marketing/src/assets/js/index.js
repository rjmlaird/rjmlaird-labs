/* Marketing Labs index: text search + category filter. */
(() => {
  const q = document.getElementById("q"), cards = [...document.querySelectorAll(".ml-card")], groups = [...document.querySelectorAll(".ml-group")], chips = [...document.querySelectorAll("button[data-cat]")], out = document.getElementById("count");
  let cat = "all";
  const run = () => {
    const t = q.value.trim().toLowerCase(); let n = 0;
    cards.forEach((c) => { const ok = (cat === "all" || c.dataset.cat === cat) && (!t || c.dataset.search.includes(t)); c.hidden = !ok; if (ok) n++; });
    groups.forEach((g) => (g.hidden = !g.querySelector(".ml-card:not([hidden])")));
    out.textContent = `${n} of ${cards.length} labs`;
  };
  q.addEventListener("input", run);
  chips.forEach((c) => c.addEventListener("click", () => { cat = c.dataset.cat; chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c))); run(); }));
  run();
})();
