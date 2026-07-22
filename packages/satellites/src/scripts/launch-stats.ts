import { fetchText, parseSatcat, escapeHtml, SATCAT_URL } from './lib/celestrak';

type YearCount = { year: number; count: number };
type OwnerCount = { owner: string; count: number };

// Decorative colour cycle for owner bars — reuses the existing status
// palette so the page stays visually consistent with the rest of the site
// even though "owner" isn't itself a status.
const PALETTE = ['var(--op)', 'var(--backup)', 'var(--partial)', 'var(--extended)', 'var(--spare)'];

let yearCounts: YearCount[] = [];
let ownerCounts: OwnerCount[] = [];
let ownerFiltered: OwnerCount[] = [];
let showAllOwners = false;
let totalPayloads = 0;

let overlay!: HTMLDivElement;
let statusBadge!: HTMLSpanElement;
let statusBadgeText!: HTMLSpanElement;
let statTotal!: HTMLSpanElement;
let statOwners!: HTMLSpanElement;
let statYears!: HTMLSpanElement;
let statPeak!: HTMLSpanElement;
let yearChartEl!: HTMLDivElement;
let ownerChartEl!: HTMLDivElement;
let ownerSearch!: HTMLInputElement;
let ownerNote!: HTMLSpanElement;
let toggleOwnersBtn!: HTMLButtonElement;
let tooltip!: HTMLDivElement;
let statsWrap!: HTMLDivElement;

function setBadge(mode: string, text: string) {
  statusBadge.className = 'badge ' + mode;
  statusBadgeText.textContent = text;
}

function showTooltip(e: MouseEvent, html: string) {
  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  moveTooltip(e);
}
function moveTooltip(e: MouseEvent) {
  const rect = statsWrap.getBoundingClientRect();
  tooltip.style.left = e.clientX - rect.left + statsWrap.scrollLeft + 16 + 'px';
  tooltip.style.top = e.clientY - rect.top + statsWrap.scrollTop + 10 + 'px';
}
function hideTooltip() {
  tooltip.style.display = 'none';
}

async function loadStats() {
  overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="ring"></div><div class="msg" id="overlayMsg">Fetching SATCAT from Celestrak…</div>`;
  setBadge('wait', 'connecting');

  try {
    const csvText = await fetchText(SATCAT_URL);
    const { rows, keys } = parseSatcat(csvText);
    if (!keys.launch || !keys.owner || !keys.type) {
      throw new Error('SATCAT response was missing expected columns (launch date, owner, or object type).');
    }

    const yearMap = new Map<number, number>();
    const ownerMap = new Map<string, number>();
    const currentYear = new Date().getUTCFullYear();
    totalPayloads = 0;

    for (const row of rows) {
      const type = (row[keys.type] || '').trim().toUpperCase();
      if (type !== 'PAY') continue; // exclude rocket bodies / debris — count actual spacecraft only

      const launchRaw = (row[keys.launch] || '').trim();
      const year = launchRaw ? parseInt(launchRaw.slice(0, 4), 10) : NaN;
      if (isNaN(year) || year < 1957 || year > currentYear + 1) continue;

      const owner = (row[keys.owner] || '').trim() || 'UNKNOWN';

      yearMap.set(year, (yearMap.get(year) || 0) + 1);
      ownerMap.set(owner, (ownerMap.get(owner) || 0) + 1);
      totalPayloads++;
    }

    if (totalPayloads === 0) throw new Error('SATCAT was fetched but no payload records with a launch year could be found.');

    yearCounts = Array.from(yearMap, ([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);
    ownerCounts = Array.from(ownerMap, ([owner, count]) => ({ owner, count })).sort((a, b) => b.count - a.count);

    renderStatBar();
    renderYearChart();
    applyOwnerFilter();

    setBadge('live', 'loaded');
    overlay.style.display = 'none';
  } catch (err: any) {
    showError(err);
  }
}

function showError(err: any) {
  setBadge('off', 'decayed');
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="err">
      <div style="color:var(--text); font-size:13px; font-weight:700; margin-bottom:6px;">Could not load SATCAT</div>
      ${escapeHtml(err.message || String(err))}
      <br><br>
      This is usually a browser CORS/network restriction reaching <b>celestrak.org</b>, not a problem with your request.
    </div>
    <div class="fallback">
      <label>Paste SATCAT CSV text (from the footer link)</label>
      <textarea id="pasteCSV" placeholder="OBJECT_NAME,OBJECT_ID,NORAD_CAT_ID,OBJECT_TYPE,OPS_STATUS_CODE,OWNER,LAUNCH_DATE,..."></textarea>
      <div style="display:flex; gap:8px;">
        <button class="primary" id="pasteLoadBtn">Load pasted data</button>
        <button id="retryBtn">Retry fetch</button>
      </div>
    </div>
  `;
  (document.getElementById('retryBtn') as HTMLButtonElement).onclick = () => loadStats();
  (document.getElementById('pasteLoadBtn') as HTMLButtonElement).onclick = () => {
    loadFromPasted((document.getElementById('pasteCSV') as HTMLTextAreaElement).value);
  };
}

function loadFromPasted(csvText: string) {
  try {
    const { rows, keys } = parseSatcat(csvText);
    if (!keys.launch || !keys.owner || !keys.type) throw new Error('Pasted CSV is missing expected columns.');

    const yearMap = new Map<number, number>();
    const ownerMap = new Map<string, number>();
    const currentYear = new Date().getUTCFullYear();
    totalPayloads = 0;

    for (const row of rows) {
      const type = (row[keys.type] || '').trim().toUpperCase();
      if (type !== 'PAY') continue;
      const launchRaw = (row[keys.launch] || '').trim();
      const year = launchRaw ? parseInt(launchRaw.slice(0, 4), 10) : NaN;
      if (isNaN(year) || year < 1957 || year > currentYear + 1) continue;
      const owner = (row[keys.owner] || '').trim() || 'UNKNOWN';
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
      ownerMap.set(owner, (ownerMap.get(owner) || 0) + 1);
      totalPayloads++;
    }

    if (totalPayloads === 0) throw new Error('No payload records with a launch year found in pasted data.');

    yearCounts = Array.from(yearMap, ([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);
    ownerCounts = Array.from(ownerMap, ([owner, count]) => ({ owner, count })).sort((a, b) => b.count - a.count);

    renderStatBar();
    renderYearChart();
    applyOwnerFilter();

    setBadge('live', 'loaded (manual)');
    overlay.style.display = 'none';
  } catch (err: any) {
    alert('Could not parse pasted data: ' + err.message);
  }
}

function renderStatBar() {
  statTotal.textContent = totalPayloads.toLocaleString();
  statOwners.textContent = ownerCounts.length.toLocaleString();
  if (yearCounts.length) {
    statYears.textContent = `${yearCounts[0].year}–${yearCounts[yearCounts.length - 1].year}`;
    const peak = yearCounts.reduce((a, b) => (b.count > a.count ? b : a));
    statPeak.textContent = `${peak.year} (${peak.count.toLocaleString()})`;
  } else {
    statYears.textContent = '–';
    statPeak.textContent = '–';
  }
}

function renderYearChart() {
  const max = Math.max(...yearCounts.map((y) => y.count), 1);
  yearChartEl.innerHTML = yearCounts
    .map((y) => {
      const h = Math.max(2, Math.round((y.count / max) * 176));
      const showLabel = y.year % 5 === 0;
      return `<div class="year-bar-col" data-year="${y.year}" data-count="${y.count}">
        <div class="year-bar" style="height:${h}px;"></div>
        ${showLabel ? `<span class="year-label">${y.year}</span>` : ''}
      </div>`;
    })
    .join('');

  yearChartEl.querySelectorAll<HTMLDivElement>('.year-bar-col').forEach((col) => {
    col.addEventListener('mouseenter', (e) => {
      showTooltip(e as MouseEvent, `<b>${col.dataset.year}</b><br>${Number(col.dataset.count).toLocaleString()} satellites launched`);
    });
    col.addEventListener('mousemove', (e) => moveTooltip(e as MouseEvent));
    col.addEventListener('mouseleave', hideTooltip);
  });

  // Scroll to the most recent years by default
  yearChartEl.scrollLeft = yearChartEl.scrollWidth;
}

function applyOwnerFilter() {
  const q = ownerSearch.value.trim().toUpperCase();
  ownerFiltered = q ? ownerCounts.filter((o) => o.owner.toUpperCase().includes(q)) : ownerCounts;
  renderOwnerChart();
}

function renderOwnerChart() {
  const list = showAllOwners ? ownerFiltered : ownerFiltered.slice(0, 25);
  const max = ownerCounts.length ? ownerCounts[0].count : 1;

  ownerChartEl.innerHTML = list
    .map((o, i) => {
      const pct = Math.max(1.5, Math.round((o.count / max) * 100));
      const color = PALETTE[i % PALETTE.length];
      return `<div class="owner-row">
        <span class="owner-rank">#${i + 1}</span>
        <span class="owner-name" title="${escapeHtml(o.owner)}">${escapeHtml(o.owner)}</span>
        <span class="owner-bar-track"><span class="owner-bar-fill" style="width:${pct}%; background:${color};"></span></span>
        <span class="owner-count">${o.count.toLocaleString()}</span>
      </div>`;
    })
    .join('');

  const filteredNote = ownerFiltered.length !== ownerCounts.length ? ` (filtered from ${ownerCounts.length.toLocaleString()})` : '';
  ownerNote.textContent = `Showing ${list.length.toLocaleString()} of ${ownerFiltered.length.toLocaleString()} owners/operators${filteredNote}`;
  toggleOwnersBtn.textContent = showAllOwners ? 'Show top 25' : `Show all ${ownerFiltered.length.toLocaleString()}`;
  toggleOwnersBtn.style.display = ownerFiltered.length > 25 ? 'inline-block' : 'none';
}

function mount() {
  overlay = document.getElementById('overlay') as HTMLDivElement;
  statusBadge = document.getElementById('statusBadge') as HTMLSpanElement;
  statusBadgeText = document.getElementById('statusBadgeText') as HTMLSpanElement;
  statTotal = document.getElementById('statTotal') as HTMLSpanElement;
  statOwners = document.getElementById('statOwners') as HTMLSpanElement;
  statYears = document.getElementById('statYears') as HTMLSpanElement;
  statPeak = document.getElementById('statPeak') as HTMLSpanElement;
  yearChartEl = document.getElementById('yearChart') as HTMLDivElement;
  ownerChartEl = document.getElementById('ownerChart') as HTMLDivElement;
  ownerSearch = document.getElementById('ownerSearch') as HTMLInputElement;
  ownerNote = document.getElementById('ownerNote') as HTMLSpanElement;
  toggleOwnersBtn = document.getElementById('toggleOwnersBtn') as HTMLButtonElement;
  tooltip = document.getElementById('tooltip') as HTMLDivElement;
  statsWrap = document.querySelector('.stats-wrap') as HTMLDivElement;

  ownerSearch.addEventListener('input', () => applyOwnerFilter());
  toggleOwnersBtn.addEventListener('click', () => {
    showAllOwners = !showAllOwners;
    renderOwnerChart();
  });
  (document.getElementById('reloadBtn') as HTMLButtonElement).addEventListener('click', () => loadStats());

  loadStats();
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', mount);
}
