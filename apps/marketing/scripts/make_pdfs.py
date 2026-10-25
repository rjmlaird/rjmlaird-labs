#!/usr/bin/env python3
"""Generate PDF guides for every lab (plus a complete guide) from the built site.
Reads each lab page in dist/ with headless Chromium, extracts its reference text (including the guidance shown for each option of the
main selector) and its form fields, then prints a light A4 guide with a blank worksheet.
Usage: node scripts/build.mjs && python3 scripts/make_pdfs.py   (needs: pip install playwright && playwright install chromium)"""
import json, html, sys, pathlib, datetime
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST, OUT = ROOT / "dist", ROOT / "src" / "assets" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
reg = json.loads((DIST / "labs.json").read_text())
cats = {c["id"]: c["label"] for c in reg["categories"]}

EXTRACT = r"""() => {
  const main = document.querySelector('main'); const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const BLOCK = 'p,li,h1,h2,h3,h4,div,article,section,ul,ol,table,form';
  const INLINE = new Set(['A','EM','STRONG','B','I','CODE','MARK','SUB','SUP','BR','ABBR','SMALL']);
  const skip = (e) => e.closest('form,button,output,select,textarea,nav,footer,svg,[aria-live],.ml-more,.action-row,.bubble,.ml-labbar,[role=tablist]');
  const clean = (t) => t.replace(/\s+/g, ' ').replace(/^[\u2713\u2714\u2022\u2192\-\u2013]\s*/, '').trim();
  const noise = (t) => t.length < 12 && !/\s/.test(t) && /^[A-Z0-9 \/·.:%-]+$/.test(t) || /^\d+\s*\/\s*\d+$/.test(t) || /^(mapped|stages? mapped|items? plotted|pending|draft|ready)$/i.test(t) || /:$/.test(t) && t.length < 60 || /^(stage|step|item|pillar)\s*\d+$/i.test(t) || t.length < 4;
  const blocks = () => { const out = [], seen = new Set(), taken = [];
    for (const e of main.querySelectorAll('*')) {
      if (skip(e) || !vis(e) || e.closest('[data-taken]') || !['H1','H2','H3','H4','P','LI','DT','DD','TD','TH','DIV','SPAN','BLOCKQUOTE','FIGCAPTION','SMALL','STRONG','LABEL'].includes(e.tagName)) continue;
      const kids = [...e.children]; const leaf = e.tagName === 'LI' ? !e.querySelector('ul,ol,p,div') : !e.querySelector(BLOCK) && (kids.every((k) => INLINE.has(k.tagName)) || kids.filter((k) => (k.innerText || '').trim()).length < 2);
      if (!leaf) continue; const t = clean(e.innerText); if (noise(t) || seen.has(t.toLowerCase())) continue; seen.add(t.toLowerCase()); e.setAttribute('data-taken', '1'); taken.push(e);
      out.push({ k: /^H[1-4]$/.test(e.tagName) ? 'h' + e.tagName[1] : e.tagName === 'LI' ? 'li' : 'p', t }); }
    taken.forEach((e) => e.removeAttribute('data-taken')); return out; };
  let base = blocks(); const variants = []; let selLabel = '';
  const sel = [...main.querySelectorAll('form select')].find((s) => !/demo|picker|example|preset/i.test(s.id) && s.options.length >= 3 && s.options.length <= 9);
  if (sel) { const lab = document.querySelector('label[for="' + sel.id + '"]'); selLabel = lab ? lab.innerText.replace(/\s+/g, ' ').trim() : 'option'; const orig = sel.value;
    const fieldVals = new Set([...main.querySelectorAll('input,textarea')].map((e) => clean(e.value || '')));
    const per = [];
    for (const o of sel.options) { sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); per.push({ name: o.text.trim(), blocks: blocks().filter((b) => !fieldVals.has(b.t)) }); }
    sel.value = orig; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true }));
    const count = new Map(); per.forEach((p) => new Set(p.blocks.map((b) => b.t)).forEach((t) => count.set(t, (count.get(t) || 0) + 1)));
    const specific = (b) => count.get(b.t) < per.length;           // varies with the selected option
    base = base.filter((b) => !specific(b)).filter((b) => !fieldVals.has(b.t));
    per.forEach((p) => variants.push({ name: p.name, blocks: p.blocks.filter(specific).filter((b) => b.t.length > 14 && b.t.length <= 320).slice(0, 6) })); }
  const fields = [...main.querySelectorAll('input,textarea,select')].filter((e) => e.id && !['button', 'submit', 'reset', 'file', 'hidden'].includes(e.type) && !/demo|picker|example|preset/i.test(e.id)).map((e) => {
    const lab = document.querySelector('label[for="' + e.id + '"]'); const box = e.closest('.field,.range-row,.field-row') || e.parentElement; const help = box && box.querySelector('.field-help,.help');
    return { id: e.id, label: lab ? lab.innerText.replace(/\s+/g, ' ').trim() : e.getAttribute('aria-label') || e.name || e.id, tag: e.tagName.toLowerCase(), type: e.type, min: e.min, max: e.max,
      help: help ? help.innerText.replace(/\s+/g, ' ').trim() : '', placeholder: e.placeholder || '', options: e.tagName === 'SELECT' ? [...e.options].map((o) => o.text.trim()).filter((t) => !/^choose|^select/i.test(t)) : [] }; });
  return { base, variants, selLabel, fields };
}"""

CSS = """@page{size:A4;margin:16mm 14mm 18mm}*{box-sizing:border-box}
body{margin:0;color:#14202b;font:9.6pt/1.5 Inter,'Helvetica Neue',Arial,sans-serif}
h1,h2,h3,h4{font-family:'Space Grotesk',Inter,Arial,sans-serif;line-height:1.2;margin:0}
.cover{break-after:page;min-height:240mm;display:flex;flex-direction:column;justify-content:center;border-left:6px solid #00a58f;padding-left:12mm}
.cover .mark{width:16mm;height:16mm;border:2px solid #00a58f;border-radius:50%;display:grid;place-items:center;color:#00806f;font:700 11pt 'Space Grotesk',Arial,sans-serif;margin-bottom:8mm}
.cover .cat{color:#00806f;font:600 9pt Inter,Arial;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3mm}
.cover h1{font-size:30pt;letter-spacing:-.02em;margin-bottom:5mm}.cover .head{font-size:14pt;color:#33424f;max-width:150mm;margin-bottom:6mm}.cover .sum{max-width:140mm;color:#4a5866;font-size:10.5pt}
.cover .inc{margin-top:12mm;color:#6a7784;font-size:9pt}
.lab{break-before:page}.lab:first-of-type{break-before:auto}
.band{border-bottom:2px solid #00a58f;padding-bottom:3mm;margin-bottom:6mm}.band small{color:#00806f;letter-spacing:.1em;text-transform:uppercase;font-weight:600}.band h2{font-size:19pt;margin-top:1mm}
h3{font-size:12.5pt;margin:6mm 0 2mm;color:#0b3a35;break-after:avoid}h4{font-size:10.5pt;margin:4mm 0 1mm;break-after:avoid}
p{margin:0 0 2.2mm}ul{margin:0 0 3mm;padding-left:5mm}li{margin:0 0 1.2mm}
.var{border:1px solid #cdd6df;border-left:3px solid #00a58f;border-radius:2mm;padding:2.5mm 3.5mm;margin:0 0 3mm;break-inside:avoid;background:#f7fafb}.var h4{margin:0 0 1.5mm}.var p{margin:0 0 1.3mm;font-size:9.2pt}
.ws .f{margin:0 0 4.5mm;break-inside:avoid}.ws label{display:block;font-weight:600;font-size:9.4pt}.ws .h{color:#5a6773;font-size:8.4pt;margin:.3mm 0 1mm}
.ws .line{border-bottom:1px solid #8896a4;height:6.5mm}.ws .box{border:1px solid #8896a4;border-radius:1.5mm;height:21mm}.ws .opts{display:flex;flex-wrap:wrap;gap:1.5mm 5mm;font-size:9pt}.ws .opts span:before{content:'';display:inline-block;width:3mm;height:3mm;border:1px solid #5a6773;margin-right:1.6mm;vertical-align:-0.4mm}
.ws .scale{display:flex;justify-content:space-between;border-top:1px solid #8896a4;margin-top:4mm;padding-top:1mm;font-size:8pt;color:#5a6773}
.note{color:#5a6773;font-size:8.6pt;border-top:1px solid #d5dce3;margin-top:6mm;padding-top:2.5mm}
.toc li{margin-bottom:1.5mm}"""

def esc(s): return html.escape(s or "")

def blocks_html(bs, skip_first_h1=True):
    out, ul = [], False
    for b in bs:
        if b["k"] == "li":
            if not ul: out.append("<ul>"); ul = True
            out.append(f"<li>{esc(b['t'])}</li>"); continue
        if ul: out.append("</ul>"); ul = False
        if b["k"] == "h1": continue
        out.append(f"<h3>{esc(b['t'])}</h3>" if b["k"] in ("h2", "h3") else f"<h4>{esc(b['t'])}</h4>" if b["k"] == "h4" else f"<p>{esc(b['t'])}</p>")
    if ul: out.append("</ul>")
    return "".join(out)

def worksheet(fields):
    rows = []
    for f in fields:
        ctl = '<div class="line"></div>'
        if f["tag"] == "textarea": ctl = '<div class="box"></div>'
        elif f["tag"] == "select" and f["options"]: ctl = '<div class="opts">' + "".join(f"<span>{esc(o)}</span>" for o in f["options"]) + "</div>"
        elif f["type"] == "range": ctl = f'<div class="scale"><span>{esc(f["min"] or "0")}</span><span>{esc(f["max"] or "100")}</span></div>'
        elif f["type"] in ("checkbox", "radio"): ctl = '<div class="opts"><span>Yes</span><span>No</span></div>'
        hint = f["help"] or f["placeholder"]
        rows.append(f'<div class="f"><label>{esc(f["label"])}</label>' + (f'<div class="h">{esc(hint)}</div>' if hint else "") + ctl + "</div>")
    return "".join(rows)

def lab_section(lab, d, cover=True):
    head = next((b["t"] for b in d["base"] if b["k"] == "h1"), lab["title"])
    intro = [b for b in d["base"] if b["k"] != "h1"]
    s = ""
    if cover:
        s += f'<section class="cover"><div class="mark">{esc(lab["brandMark"] or "ML")}</div><div class="cat">Marketing Labs · {esc(cats[lab["category"]])}</div><h1>{esc(lab["title"])}</h1><div class="head">{esc(head)}</div><div class="sum">{esc(lab["summary"])}</div><div class="inc">Includes: framework reference · guidance by {esc(d["selLabel"] or "stage")} · printable worksheet</div></section>'
    s += f'<section class="lab"><div class="band"><small>{esc(cats[lab["category"]])}</small><h2>{esc(lab["title"])}: reference</h2></div>{blocks_html(intro)}'
    if d["variants"]:
        s += f'<h3>Guidance by {esc(d["selLabel"])}</h3>'
        for v in d["variants"]:
            s += f'<div class="var"><h4>{esc(v["name"])}</h4>' + "".join(f"<p>{esc(b['t'])}</p>" for b in v["blocks"] if b["k"] != "li") + "</div>"
    s += f'</section><section class="lab ws"><div class="band"><small>Worksheet</small><h2>{esc(lab["title"])}: your canvas</h2></div><p class="h" style="color:#5a6773">Print this page or fill it in by hand. The interactive lab asks the same questions.</p>{worksheet(d["fields"])}<div class="note">Planning aid, not advice. Test assumptions with evidence and consider privacy, accessibility, fairness and sustainability before acting.</div></section>'
    return s

def doc(body): return f"<!doctype html><html lang='en'><meta charset='utf-8'><style>{CSS}</style><body>{body}</body></html>"

def main():
    only = set(sys.argv[1:]); data = {}
    with sync_playwright() as p:
        br = p.chromium.launch()
        for lab in reg["labs"]:
            if only and lab["slug"] not in only: continue
            pg = br.new_page(viewport={"width": 1280, "height": 900}); pg.goto((DIST / "labs" / lab["slug"] / "index.html").as_uri()); pg.wait_for_timeout(500)
            data[lab["slug"]] = pg.evaluate(EXTRACT); pg.close()
            print("extracted", lab["slug"], len(data[lab["slug"]]["base"]), "blocks,", len(data[lab["slug"]]["variants"]), "variants,", len(data[lab["slug"]]["fields"]), "fields", flush=True)
        def render(body, path, foot):
            pg = br.new_page(); pg.set_content(doc(body)); pg.wait_for_timeout(200)
            tpl = f"<div style=\"font:7pt Arial;color:#6a7784;width:100%;padding:0 14mm;display:flex;justify-content:space-between\"><span>{esc(foot)}</span><span><span class='pageNumber'></span> / <span class='totalPages'></span></span></div>"
            pg.pdf(path=str(path), format="A4", print_background=True, display_header_footer=True, header_template="<span></span>", footer_template=tpl, margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"}); pg.close()
        for lab in reg["labs"]:
            if lab["slug"] in data: render(lab_section(lab, data[lab["slug"]]), OUT / f"{lab['slug']}.pdf", f"Marketing Labs · {lab['title']}")
        if not only:
            toc = "".join(f"<li><b>{esc(l['title'])}</b> <span style='color:#5a6773'>· {esc(cats[l['category']])}</span></li>" for l in reg["labs"])
            cover = f'<section class="cover"><div class="mark">ML</div><div class="cat">Marketing Labs</div><h1>Complete guide</h1><div class="head">{len(reg["labs"])} frameworks with reference notes and printable worksheets</div><div class="sum">Strategy and growth, positioning, customers and loyalty, content and communications, and impact planning.</div><div class="inc">Contents<ul class="toc">{toc}</ul></div></section>'
            render(cover + "".join(lab_section(l, data[l["slug"]], cover=False) for l in reg["labs"]), OUT / "marketing-labs-complete-guide.pdf", "Marketing Labs · Complete guide")
        br.close()
    print("PDFs written to", OUT)
main()
