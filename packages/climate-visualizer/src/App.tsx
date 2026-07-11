import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { sampleTempAnomaly, annotations } from "./data";

export default function App() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={{ color: "#00C2A8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        labs / science communication
      </p>
      <h1 style={{ fontSize: "1.8rem", margin: "0.5rem 0 0.5rem" }}>Climate Visualizer</h1>
      <p style={{ color: "#9AA5B1", lineHeight: 1.6, marginBottom: "0.5rem" }}>
        Global temperature anomaly by decade, relative to a mid-20th-century baseline.
      </p>
      <p style={{ color: "#F5A623", fontSize: "0.85rem", marginBottom: "2rem" }}>
        Sample data for layout purposes — swap <code>src/data.ts</code> for a live
        NASA GISTEMP or NOAA feed before publishing.
      </p>

      <div style={{ background: "#121826", border: "1px solid rgba(238,242,246,0.08)", borderRadius: 12, padding: "1.5rem" }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={sampleTempAnomaly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(238,242,246,0.08)" vertical={false} />
            <XAxis dataKey="year" stroke="#9AA5B1" tickLine={false} />
            <YAxis stroke="#9AA5B1" tickLine={false} unit="°C" width={50} />
            <Tooltip
              contentStyle={{ background: "#0B0F1A", border: "1px solid rgba(238,242,246,0.15)", borderRadius: 8 }}
              labelStyle={{ color: "#EEF2F6" }}
            />
            <Line type="monotone" dataKey="anomaly" stroke="#00C2A8" strokeWidth={2} dot={{ r: 3 }} />
            {annotations.map((a) => {
              const point = sampleTempAnomaly.find((d) => d.year === a.year);
              return point ? (
                <ReferenceDot key={a.year} x={a.year} y={point.anomaly} r={5} fill="#F5A623" stroke="none" />
              ) : null;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {annotations.map((a) => (
          <li key={a.year} style={{ display: "flex", gap: "0.75rem", alignItems: "baseline" }}>
            <span style={{ color: "#F5A623", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}>{a.year}</span>
            <span style={{ color: "#9AA5B1", fontSize: "0.9rem" }}>{a.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
