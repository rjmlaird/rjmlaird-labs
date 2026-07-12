import React, { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { Plus, Trash2, Download, FileText, LayoutDashboard, Leaf } from "lucide-react";

// ---- UK conversion factors (illustrative, approximate DEFRA-style kg CO2e per unit) ----
const FACTORS = {
  1: [
    { key: "gas_kwh", label: "Natural gas (kWh, gross CV)", unit: "kWh", factor: 0.18293 },
    { key: "diesel_l", label: "Gas oil / diesel (litres) — owned vehicles", unit: "litres", factor: 2.66927 },
    { key: "petrol_l", label: "Petrol (litres) — owned vehicles", unit: "litres", factor: 2.16561 },
    { key: "lpg_l", label: "LPG (litres) — heating/fleet", unit: "litres", factor: 1.55713 },
    { key: "burning_oil_l", label: "Burning oil / kerosene (litres)", unit: "litres", factor: 2.54104 },
    { key: "refrigerant_kg", label: "Refrigerant loss, R-410A (kg)", unit: "kg", factor: 2088 },
  ],
  2: [
    { key: "elec_kwh_lb", label: "Grid electricity, location-based (kWh)", unit: "kWh", factor: 0.20705 },
    { key: "elec_kwh_mb", label: "Grid electricity, market-based (kWh)", unit: "kWh", factor: 0.0 },
    { key: "heat_steam_kwh", label: "Purchased heat / steam (kWh)", unit: "kWh", factor: 0.171 },
  ],
};
const ALL_CATS = { ...Object.fromEntries(FACTORS[1].map(f => [f.key, { ...f, scope: 1 }])), ...Object.fromEntries(FACTORS[2].map(f => [f.key, { ...f, scope: 2 }])) };

// Plain-language definitions shown to viewers alongside the breakdown calculation
const SCOPE_INFO = {
  1: {
    label: "Scope 1",
    title: "Direct emissions",
    description: "Emissions from sources the organisation owns or controls directly — for example, burning fuel in a fleet of vehicles that aren't electrically powered, or gas heating at owned sites.",
    color: "#28402E",
  },
  2: {
    label: "Scope 2",
    title: "Indirect energy emissions",
    description: "Emissions caused indirectly, from the production of energy the organisation purchases and uses — for example, the emissions released generating the electricity used in its buildings.",
    color: "#8FBF8F",
  },
};

const uid = () => Math.random().toString(36).slice(2, 10);
const thisYear = new Date().getFullYear();
const fmt = (n, d = 1) => Number(n).toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });

const emptyEntry = (year) => ({ id: uid(), year, scope: 1, category: "gas_kwh", quantity: "" });

export default function CarbonReductionPlanTool() {
  const [view, setView] = useState("dashboard"); // dashboard | plan
  const [orgName, setOrgName] = useState("Green Orbit Digital");
  const [baselineYear, setBaselineYear] = useState(thisYear - 1);
  const [targetPct, setTargetPct] = useState(10); // % reduction per contract year
  const [planPeriodYears, setPlanPeriodYears] = useState(5);
  const [supplierNetZeroYear, setSupplierNetZeroYear] = useState(2040);
  const [govNetZeroYear] = useState(2050);
  const [measures, setMeasures] = useState([
    "Switch remaining gas heating to air-source heat pumps at owned premises.",
    "Move company fleet to fully electric vehicles as leases expire.",
    "Procure REGO-backed renewable electricity tariff for all sites.",
    "Introduce cycle-to-work scheme and reduce non-essential business travel.",
  ]);
  const [entries, setEntries] = useState([
    { id: uid(), year: baselineYear, scope: 2, category: "elec_kwh_lb", quantity: "18400" },
    { id: uid(), year: baselineYear, scope: 1, category: "gas_kwh", quantity: "9200" },
    { id: uid(), year: thisYear, scope: 2, category: "elec_kwh_lb", quantity: "16100" },
    { id: uid(), year: thisYear, scope: 1, category: "gas_kwh", quantity: "7800" },
  ]);

  const updateEntry = (id, patch) => setEntries(es => es.map(e => e.id === id ? { ...e, ...patch } : e));
  const removeEntry = (id) => setEntries(es => es.filter(e => e.id !== id));
  const addEntry = () => setEntries(es => [...es, emptyEntry(thisYear)]);

  // computed emissions per entry
  const enriched = useMemo(() => entries.map(e => {
    const cat = ALL_CATS[e.category];
    const qty = parseFloat(e.quantity) || 0;
    const kg = qty * (cat?.factor || 0);
    return { ...e, catLabel: cat?.label || "—", unit: cat?.unit || "", tco2e: kg / 1000 };
  }), [entries]);

  const years = useMemo(() => Array.from(new Set(enriched.map(e => e.year))).sort((a, b) => a - b), [enriched]);

  const byYear = useMemo(() => years.map(y => {
    const rows = enriched.filter(e => e.year === y);
    const scope1 = rows.filter(r => r.scope === 1).reduce((s, r) => s + r.tco2e, 0);
    const scope2 = rows.filter(r => r.scope === 2).reduce((s, r) => s + r.tco2e, 0);
    return { year: y, scope1, scope2, total: scope1 + scope2 };
  }), [years, enriched]);

  const baseline = byYear.find(y => y.year === baselineYear) || { total: 0, scope1: 0, scope2: 0 };

  const trajectory = useMemo(() => {
    const out = [];
    for (let i = 0; i <= planPeriodYears; i++) {
      const y = baselineYear + i;
      const target = baseline.total * Math.pow(1 - targetPct / 100, i);
      const actualRow = byYear.find(b => b.year === y);
      out.push({ year: y, target: Number(target.toFixed(2)), actual: actualRow ? Number(actualRow.total.toFixed(2)) : null });
    }
    return out;
  }, [baselineYear, planPeriodYears, targetPct, baseline.total, byYear]);

  const latest = byYear[byYear.length - 1];
  const pctChangeFromBaseline = latest && baseline.total ? ((latest.total - baseline.total) / baseline.total) * 100 : null;

  const handlePrint = () => { setView("plan"); setTimeout(() => window.print(), 150); };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#EDEFE7", minHeight: "100vh", color: "#16241B" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only-plan { display: block !important; }
          body, .app-bg { background: white !important; }
          .plan-page { box-shadow: none !important; margin: 0 !important; }
        }
        .mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; }
        input, select { font-family: inherit; }
        table.entries th, table.entries td { padding: 8px 10px; }
      `}</style>

      {/* Top nav */}
      <div className="no-print" style={{ background: "#16241B", color: "#EDEFE7", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Leaf size={22} color="#8FBF8F" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>Scope 1 &amp; 2 Emissions Lab</div>
            <div style={{ fontSize: 12, opacity: 0.65 }}>Carbon Reduction Plan builder — PPN 06/21 aligned</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setView("dashboard")} style={navBtn(view === "dashboard")}>
            <LayoutDashboard size={15} style={{ marginRight: 6, verticalAlign: -3 }} />Dashboard
          </button>
          <button onClick={() => setView("plan")} style={navBtn(view === "plan")}>
            <FileText size={15} style={{ marginRight: 6, verticalAlign: -3 }} />Carbon Reduction Plan
          </button>
          <button onClick={handlePrint} style={{ ...navBtn(false), background: "#8FBF8F", color: "#16241B", fontWeight: 600 }}>
            <Download size={15} style={{ marginRight: 6, verticalAlign: -3 }} />Export PDF
          </button>
        </div>
      </div>

      {view === "dashboard" ? (
        <Dashboard
          orgName={orgName} setOrgName={setOrgName}
          baselineYear={baselineYear} setBaselineYear={setBaselineYear}
          targetPct={targetPct} setTargetPct={setTargetPct}
          planPeriodYears={planPeriodYears} setPlanPeriodYears={setPlanPeriodYears}
          entries={enriched} updateEntry={updateEntry} removeEntry={removeEntry} addEntry={addEntry}
          byYear={byYear} trajectory={trajectory} baseline={baseline} latest={latest} pctChangeFromBaseline={pctChangeFromBaseline}
        />
      ) : (
        <PlanDocument
          orgName={orgName} baselineYear={baselineYear} targetPct={targetPct} planPeriodYears={planPeriodYears}
          supplierNetZeroYear={supplierNetZeroYear} setSupplierNetZeroYear={setSupplierNetZeroYear} govNetZeroYear={govNetZeroYear}
          byYear={byYear} baseline={baseline} latest={latest} trajectory={trajectory}
          measures={measures} setMeasures={setMeasures}
        />
      )}
    </div>
  );
}

function navBtn(active) {
  return {
    background: active ? "#28402E" : "transparent",
    color: "#EDEFE7", border: "1px solid rgba(237,239,231,0.25)", borderRadius: 6,
    padding: "8px 14px", fontSize: 13, cursor: "pointer",
  };
}

function Card({ children, style }) {
  return <div style={{ background: "#FBFBF7", border: "1px solid #D8DBCB", borderRadius: 10, padding: 18, ...style }}>{children}</div>;
}

function Dashboard(props) {
  const { orgName, setOrgName, baselineYear, setBaselineYear, targetPct, setTargetPct, planPeriodYears, setPlanPeriodYears,
    entries, updateEntry, removeEntry, addEntry, byYear, trajectory, baseline, latest, pctChangeFromBaseline } = props;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
        <Card>
          <Label>Organisation</Label>
          <input value={orgName} onChange={e => setOrgName(e.target.value)} style={inputStyle} />
        </Card>
        <Card>
          <Label>Baseline year</Label>
          <input type="number" value={baselineYear} onChange={e => setBaselineYear(Number(e.target.value))} style={inputStyle} />
        </Card>
        <Card>
          <Label>Annual reduction target (ERT %)</Label>
          <input type="number" value={targetPct} onChange={e => setTargetPct(Number(e.target.value))} style={inputStyle} />
        </Card>
        <Card>
          <Label>Plan period (years)</Label>
          <input type="number" value={planPeriodYears} onChange={e => setPlanPeriodYears(Number(e.target.value))} style={inputStyle} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard label="Baseline emissions" value={`${fmt(baseline.total)} tCO2e`} sub={`Year ${baselineYear}`} />
        <StatCard label="Latest reported emissions" value={latest ? `${fmt(latest.total)} tCO2e` : "—"} sub={latest ? `Year ${latest.year}` : "No data"} />
        <StatCard label="Change vs baseline" value={pctChangeFromBaseline !== null ? `${pctChangeFromBaseline > 0 ? "+" : ""}${fmt(pctChangeFromBaseline)}%` : "—"}
          sub={pctChangeFromBaseline !== null ? (pctChangeFromBaseline < 0 ? "Reducing ✓" : "Above baseline") : ""}
          accent={pctChangeFromBaseline !== null && pctChangeFromBaseline < 0 ? "#2F6D3B" : "#B5482A"} />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Actual emissions vs Emissions Reduction Target trajectory</div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trajectory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8DBCB" />
            <XAxis dataKey="year" stroke="#16241B" />
            <YAxis stroke="#16241B" label={{ value: "tCO2e", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(v) => `${fmt(v)} tCO2e`} />
            <Legend />
            <Line type="monotone" dataKey="target" name="ERT trajectory" stroke="#2F6D3B" strokeDasharray="6 4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#B5482A" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Emissions by scope, per year</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byYear} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8DBCB" />
            <XAxis dataKey="year" stroke="#16241B" />
            <YAxis stroke="#16241B" label={{ value: "tCO2e", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(v) => `${fmt(v)} tCO2e`} />
            <Legend />
            <Bar dataKey="scope1" name="Scope 1" stackId="a" fill="#28402E" />
            <Bar dataKey="scope2" name="Scope 2" stackId="a" fill="#8FBF8F" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <ScopeBreakdownCard byYear={byYear} />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Activity data log</div>
          <button onClick={addEntry} style={addBtn}><Plus size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Add entry</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="entries" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #D8DBCB", color: "#4A5A45" }}>
                <th>Year</th><th>Scope</th><th>Category</th><th>Quantity</th><th>Unit</th><th>tCO2e</th><th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid #EEF0E7" }}>
                  <td><input type="number" value={e.year} onChange={ev => updateEntry(e.id, { year: Number(ev.target.value) })} style={cellInput} /></td>
                  <td>
                    <select value={e.scope} onChange={ev => {
                      const scope = Number(ev.target.value);
                      updateEntry(e.id, { scope, category: FACTORS[scope][0].key });
                    }} style={cellInput}>
                      <option value={1}>Scope 1</option>
                      <option value={2}>Scope 2</option>
                    </select>
                  </td>
                  <td>
                    <select value={e.category} onChange={ev => updateEntry(e.id, { category: ev.target.value })} style={{ ...cellInput, minWidth: 220 }}>
                      {FACTORS[e.scope].map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={e.quantity} onChange={ev => updateEntry(e.id, { quantity: ev.target.value })} style={{ ...cellInput, width: 100 }} /></td>
                  <td className="mono" style={{ color: "#4A5A45" }}>{e.unit}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{fmt(e.tco2e, 3)}</td>
                  <td><button onClick={() => removeEntry(e.id)} style={trashBtn}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "#6B7A66", marginTop: 10 }}>
          Conversion factors are illustrative UK-average figures for demonstration. Replace with the latest DEFRA/BEIS GHG Conversion Factors for Company Reporting (or your verified supplier-specific factors) before formal submission.
        </div>
      </Card>
    </div>
  );
}

function ScopeBreakdownCard({ byYear }) {
  const years = byYear.map(y => y.year);
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] ?? null);
  const activeYear = years.includes(selectedYear) ? selectedYear : years[years.length - 1];
  const row = byYear.find(y => y.year === activeYear) || { scope1: 0, scope2: 0, total: 0 };
  const pct1 = row.total ? (row.scope1 / row.total) * 100 : 0;
  const pct2 = row.total ? (row.scope2 / row.total) * 100 : 0;
  const pieData = [
    { name: SCOPE_INFO[1].label, value: row.scope1 },
    { name: SCOPE_INFO[2].label, value: row.scope2 },
  ];
  const hasData = row.total > 0;

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Scope 1 &amp; Scope 2 breakdown calculation</div>
        {years.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Label>Year</Label>
            <select value={activeYear ?? ""} onChange={e => setSelectedYear(Number(e.target.value))} style={{ ...cellInput, width: "auto" }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 280px) 1fr", gap: 20, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={pieData.some(d => d.value > 0) ? 3 : 0} startAngle={90} endAngle={-270}>
                {pieData.map((d, i) => <Cell key={d.name} fill={i === 0 ? SCOPE_INFO[1].color : SCOPE_INFO[2].color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${fmt(v)} tCO2e`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }} className="mono">{fmt(row.total)}</div>
            <div style={{ fontSize: 10, color: "#6B7A66", textTransform: "uppercase", letterSpacing: 0.4 }}>tCO2e total</div>
          </div>
        </div>

        <div>
          {!hasData && (
            <div style={{ fontSize: 13, color: "#6B7A66", marginBottom: 10 }}>Add activity data below for {activeYear ?? "a reporting year"} to see the Scope 1 / Scope 2 breakdown.</div>
          )}
          {[1, 2].map(scope => {
            const info = SCOPE_INFO[scope];
            const value = scope === 1 ? row.scope1 : row.scope2;
            const pct = scope === 1 ? pct1 : pct2;
            return (
              <div key={scope} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: info.color, marginTop: 3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {info.label} — {info.title}
                    <span className="mono" style={{ fontWeight: 700, marginLeft: 8, color: "#16241B" }}>{fmt(value)} tCO2e</span>
                    <span style={{ fontWeight: 600, marginLeft: 6, color: "#6B7A66" }}>({fmt(pct, 0)}%)</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#4A5A45", lineHeight: 1.5, marginTop: 2 }}>{info.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function Label({ children }) { return <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "#6B7A66", marginBottom: 6 }}>{children}</div>; }
function StatCard({ label, value, sub, accent }) {
  return (
    <Card>
      <Label>{label}</Label>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent || "#16241B" }} className="mono">{value}</div>
      <div style={{ fontSize: 12, color: "#6B7A66", marginTop: 2 }}>{sub}</div>
    </Card>
  );
}

const inputStyle = { width: "100%", border: "1px solid #D8DBCB", borderRadius: 6, padding: "8px 10px", fontSize: 14, background: "#fff", boxSizing: "border-box" };
const cellInput = { border: "1px solid #E3E5D8", borderRadius: 4, padding: "5px 7px", fontSize: 13, background: "#fff", width: 80 };
const addBtn = { background: "#28402E", color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 13, cursor: "pointer" };
const trashBtn = { background: "transparent", border: "none", cursor: "pointer", color: "#B5482A" };

function PlanDocument({ orgName, baselineYear, targetPct, planPeriodYears, supplierNetZeroYear, setSupplierNetZeroYear, govNetZeroYear,
  byYear, baseline, latest, trajectory, measures, setMeasures }) {

  const updateMeasure = (i, v) => setMeasures(m => m.map((x, idx) => idx === i ? v : x));
  const removeMeasure = (i) => setMeasures(m => m.filter((_, idx) => idx !== i));
  const addMeasure = () => setMeasures(m => [...m, ""]);
  const finalTarget = trajectory[trajectory.length - 1];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 80px" }}>
      <div className="plan-page" style={{ background: "#fff", border: "1px solid #D8DBCB", borderRadius: 4, padding: "48px 56px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

        <div style={{ borderBottom: "3px solid #16241B", paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#6B7A66" }}>Carbon Reduction Plan</div>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 30, margin: "4px 0 0" }}>{orgName || "[Organisation name]"}</h1>
          <div style={{ fontSize: 13, color: "#6B7A66", marginTop: 4 }}>Prepared in line with PPN 06/21 — Carbon Reduction Plans for procurement of major government contracts</div>
        </div>

        <Section title="1. Commitment to achieving Net Zero">
          <p>
            {orgName || "[Organisation]"} is committed to achieving Net Zero emissions by <EditableInline value={supplierNetZeroYear} onChange={setSupplierNetZeroYear} width={60} /> across our direct (Scope 1) and energy indirect (Scope 2) emissions, and to supporting the UK government's target of achieving Net Zero emissions by {govNetZeroYear}.
          </p>
          <p>
            This plan sets out our baseline emissions, our progress against our Emissions Reduction Target (ERT), and the carbon reduction measures we have implemented and plan to implement in support of that commitment.
          </p>
        </Section>

        <Section title="2. Baseline emissions footprint">
          <p>Baseline year: <strong>{baselineYear}</strong>. Baseline emissions were calculated using activity data for owned/controlled facilities and vehicles (Scope 1) and purchased electricity and heat (Scope 2).</p>
          <ul style={{ paddingLeft: 20, margin: "6px 0 14px", lineHeight: 1.6 }}>
            <li><strong>Scope 1 — direct emissions:</strong> {SCOPE_INFO[1].description}</li>
            <li><strong>Scope 2 — indirect energy emissions:</strong> {SCOPE_INFO[2].description}</li>
          </ul>
          <table style={tableStyle}>
            <thead><tr><th style={th}>Emissions category</th><th style={th}>tCO2e</th><th style={th}>% of baseline</th></tr></thead>
            <tbody>
              <tr><td style={td}>Scope 1</td><td style={td} className="mono">{fmt(baseline.scope1)}</td><td style={td} className="mono">{fmt(baseline.total ? (baseline.scope1 / baseline.total) * 100 : 0, 0)}%</td></tr>
              <tr><td style={td}>Scope 2</td><td style={td} className="mono">{fmt(baseline.scope2)}</td><td style={td} className="mono">{fmt(baseline.total ? (baseline.scope2 / baseline.total) * 100 : 0, 0)}%</td></tr>
              <tr style={{ fontWeight: 700 }}><td style={td}>Total</td><td style={td} className="mono">{fmt(baseline.total)}</td><td style={td} className="mono">100%</td></tr>
            </tbody>
          </table>
        </Section>

        <Section title="3. Current emissions reporting">
          <p>Emissions have been re-assessed annually since the baseline year, as set out in Table 1 below.</p>
          <table style={tableStyle}>
            <thead><tr><th style={th}>Reporting year</th><th style={th}>Scope 1 (tCO2e)</th><th style={th}>Scope 2 (tCO2e)</th><th style={th}>Total (tCO2e)</th><th style={th}>Scope 1 / Scope 2 split</th></tr></thead>
            <tbody>
              {byYear.map(y => (
                <tr key={y.year}>
                  <td style={td}>{y.year}</td>
                  <td style={td} className="mono">{fmt(y.scope1)}</td>
                  <td style={td} className="mono">{fmt(y.scope2)}</td>
                  <td style={td} className="mono"><b>{fmt(y.total)}</b></td>
                  <td style={td} className="mono">{fmt(y.total ? (y.scope1 / y.total) * 100 : 0, 0)}% / {fmt(y.total ? (y.scope2 / y.total) * 100 : 0, 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {latest && (
            <p style={{ marginTop: 10 }}>
              Most recent reporting year ({latest.year}) total emissions: <strong className="mono">{fmt(latest.total)} tCO2e</strong>, compared to a baseline of <strong className="mono">{fmt(baseline.total)} tCO2e</strong> in {baselineYear}.
            </p>
          )}
        </Section>

        <Section title="4. Emissions Reduction Target">
          <p>
            {orgName || "[Organisation]"} commits to reducing its Contract/Organisational Carbon Footprint by <strong>{targetPct}%</strong> per contract year, for a period of <strong>{planPeriodYears} years</strong> from the baseline year, focusing initially on identified GHG emissions hotspots.
          </p>
          <div style={{ background: "#F3F5EC", border: "1px solid #D8DBCB", borderRadius: 8, padding: "14px 18px", margin: "14px 0" }}>
            <div style={{ fontSize: 13, color: "#4A5A45" }}>Projected emissions at end of plan period ({finalTarget?.year})</div>
            <div style={{ fontSize: 22, fontWeight: 700 }} className="mono">{fmt(finalTarget?.target)} tCO2e</div>
          </div>
          <div className="chart-print">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trajectory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E5D8" />
                <XAxis dataKey="year" stroke="#16241B" fontSize={12} />
                <YAxis stroke="#16241B" fontSize={12} label={{ value: "tCO2e", angle: -90, position: "insideLeft", fontSize: 12 }} />
                <Tooltip formatter={(v) => `${fmt(v)} tCO2e`} />
                <Legend />
                <Line type="monotone" dataKey="target" name="ERT trajectory" stroke="#2F6D3B" strokeDasharray="6 4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#B5482A" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="5. Carbon reduction measures">
          <p>The following environmental management measures and projects have been or will be implemented to achieve the stated emissions reduction target:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
            {measures.map((m, i) => (
              <li key={i} className="no-print-flex" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                <textarea value={m} onChange={e => updateMeasure(i, e.target.value)} rows={1}
                  style={{ flex: 1, border: "1px solid transparent", background: "transparent", fontFamily: "inherit", fontSize: 14, resize: "vertical", padding: "2px 4px" }}
                  onFocus={e => e.target.style.border = "1px solid #D8DBCB"} onBlur={e => e.target.style.border = "1px solid transparent"} />
                <button className="no-print" onClick={() => removeMeasure(i)} style={{ ...trashBtn, marginTop: 2 }}><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
          <button className="no-print" onClick={addMeasure} style={addBtn}><Plus size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Add measure</button>
        </Section>

        <Section title="6. Declaration and sign-off">
          <p>This Carbon Reduction Plan has been reviewed and signed off by the board (or equivalent management body).</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20 }}>
            <div>
              <div style={{ borderBottom: "1px solid #16241B", height: 32 }}></div>
              <div style={{ fontSize: 12, color: "#6B7A66", marginTop: 4 }}>Signature</div>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid #16241B", height: 32 }}></div>
              <div style={{ fontSize: 12, color: "#6B7A66", marginTop: 4 }}>Date</div>
            </div>
          </div>
        </Section>

        <div style={{ marginTop: 32, fontSize: 10, color: "#9AA592", borderTop: "1px solid #E3E5D8", paddingTop: 10 }}>
          Generated by the Scope 1 &amp; 2 Emissions Lab. Conversion factors are illustrative; verify against current DEFRA/BEIS GHG Conversion Factors before formal submission under PPN 06/21 or equivalent.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 17, borderBottom: "1px solid #D8DBCB", paddingBottom: 6, marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#20301F" }}>{children}</div>
    </div>
  );
}

function EditableInline({ value, onChange, width }) {
  return <input value={value} onChange={e => onChange(e.target.value)} style={{ width, border: "none", borderBottom: "1px dashed #6B7A66", background: "transparent", fontWeight: 700, fontFamily: "inherit", fontSize: "inherit" }} />;
}

const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13, margin: "10px 0" };
const th = { textAlign: "left", borderBottom: "2px solid #16241B", padding: "6px 10px", background: "#F3F5EC" };
const td = { borderBottom: "1px solid #E3E5D8", padding: "6px 10px" };
