/* Shared behaviour for every lab: autosave, save/load JSON, share link, print, reset. Works on any form fields with an id. */
(() => {
  const slug = document.body.dataset.lab;
  if (!slug) return;
  const KEY = `marketing-labs:${slug}:v1`;
  const SKIP = /demo|picker|example|preset/i;
  const toast = document.getElementById("ml-toast");
  const say = (msg) => { if (!toast) return; toast.textContent = msg; toast.classList.add("show"); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("show"), 2400); };
  const fields = () => [...document.querySelectorAll("main input, main textarea, main select")]
    .filter((el) => el.id && el.type !== "file" && !["button", "submit", "reset"].includes(el.type) && !SKIP.test(el.id) && !el.closest("[data-no-persist]"));
  const read = () => Object.fromEntries(fields().map((el) => [el.id, el.type === "checkbox" || el.type === "radio" ? el.checked : el.value]));
  const apply = (state) => {
    for (const el of fields()) {
      if (!(el.id in state)) continue;
      const v = state[el.id], checked = el.type === "checkbox" || el.type === "radio";
      if (checked ? el.checked === !!v : el.value === String(v)) continue;
      if (checked) el.checked = !!v; else el.value = v;
      try { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) { console.warn(e); }
    }
  };
  const store = { get: () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } },
    set: (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }, clear: () => { try { localStorage.removeItem(KEY); } catch {} } };
  const b64 = { enc: (o) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    dec: (s) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)))) };
  // 1. Restore: a share link wins over local autosave.
  let shared = null;
  if (location.hash.startsWith("#s=")) { try { shared = b64.dec(location.hash.slice(3)); } catch { say("That share link couldn't be read."); } }
  const start = shared || store.get();
  if (start) { apply(start); if (shared) say("Loaded the shared inputs."); }
  // 2. Autosave after the user edits something.
  let timer; const queue = () => { clearTimeout(timer); timer = setTimeout(() => store.set(read()), 250); };
  document.addEventListener("input", (e) => { if (e.target.closest("main")) queue(); });
  document.addEventListener("change", (e) => { if (e.target.closest("main")) queue(); });
  // 3. Toolbar actions.
  const download = (name, text, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const actions = {
    save: () => { download(`${slug}-inputs.json`, JSON.stringify({ lab: slug, version: 1, savedAt: new Date().toISOString(), fields: read() }, null, 2), "application/json"); say("Saved your inputs as JSON."); },
    load: () => document.getElementById("ml-file").click(),
    share: async () => { const base = location.href.split("#")[0], url = `${base}#s=${b64.enc(read())}`;
      try { await navigator.clipboard.writeText(url); say(url.length > 6000 ? "Link copied, but it is very long." : "Share link copied."); } catch { prompt("Copy this link:", url); } },
    print: () => window.print(),
    reset: () => { if (confirm("Reset this lab to its starting example? Your saved inputs will be cleared.")) { store.clear(); history.replaceState(null, "", location.href.split("#")[0]); location.reload(); } }
  };
  document.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", () => actions[b.dataset.action]?.()));
  const file = document.getElementById("ml-file");
  if (file) file.addEventListener("change", async () => { try { const j = JSON.parse(await file.files[0].text()); if (j.lab !== slug) return say("That file belongs to a different lab."); apply(j.fields || {}); store.set(read()); say("Loaded your inputs."); } catch { say("Couldn't read that file."); } file.value = ""; });
})();
