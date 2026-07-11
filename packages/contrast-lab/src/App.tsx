import { useMemo, useState } from "react";

// --- WCAG 2.x relative luminance / contrast ratio ---
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [chan(r), chan(g), chan(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const lA = relativeLuminance(a);
  const lB = relativeLuminance(b);
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

function verdict(ratio: number, largeText: boolean) {
  const aaThreshold = largeText ? 3 : 4.5;
  const aaaThreshold = largeText ? 4.5 : 7;
  return {
    aa: ratio >= aaThreshold,
    aaa: ratio >= aaaThreshold
  };
}

export default function App() {
  const [fg, setFg] = useState("#EEF2F6");
  const [bg, setBg] = useState("#0B0F1A");
  const [largeText, setLargeText] = useState(false);

  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg]);
  const result = ratio ? verdict(ratio, largeText) : null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p style={{ color: "#00C2A8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        labs / accessibility
      </p>
      <h1 style={{ fontSize: "1.8rem", margin: "0.5rem 0 0.5rem" }}>Contrast Lab</h1>
      <p style={{ color: "#9AA5B1", lineHeight: 1.6, marginBottom: "2rem" }}>
        Pick a foreground and background colour and see the WCAG 2.x contrast ratio,
        with pass/fail against AA and AAA thresholds.
      </p>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          Foreground
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(fg) ? fg : "#EEF2F6"}
            onChange={(e) => setFg(e.target.value)}
            style={{ width: 60, height: 40, border: "none", background: "none" }}
          />
          <input
            value={fg}
            onChange={(e) => setFg(e.target.value)}
            style={{ background: "#121826", border: "1px solid rgba(238,242,246,0.15)", color: "#EEF2F6", padding: "0.4rem 0.6rem", borderRadius: 6, width: 100 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          Background
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(bg) ? bg : "#0B0F1A"}
            onChange={(e) => setBg(e.target.value)}
            style={{ width: 60, height: 40, border: "none", background: "none" }}
          />
          <input
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            style={{ background: "#121826", border: "1px solid rgba(238,242,246,0.15)", color: "#EEF2F6", padding: "0.4rem 0.6rem", borderRadius: 6, width: 100 }}
          />
        </label>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#9AA5B1" }}>
        <input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} />
        Large text (18pt+ / 14pt+ bold)
      </label>

      <div
        style={{
          background: bg,
          color: fg,
          border: "1px solid rgba(238,242,246,0.1)",
          borderRadius: 12,
          padding: "2rem",
          marginBottom: "1.5rem",
          fontSize: largeText ? "1.5rem" : "1rem"
        }}
      >
        The quick brown fox jumps over the lazy dog.
      </div>

      {ratio && result ? (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Stat label="Ratio" value={`${ratio.toFixed(2)}:1`} />
          <Stat label="AA" value={result.aa ? "Pass" : "Fail"} tone={result.aa ? "good" : "bad"} />
          <Stat label="AAA" value={result.aaa ? "Pass" : "Fail"} tone={result.aaa ? "good" : "bad"} />
        </div>
      ) : (
        <p style={{ color: "#F5A623" }}>Enter valid 6-digit hex colours (e.g. #0B0F1A).</p>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "#00C2A8" : tone === "bad" ? "#F5A623" : "#EEF2F6";
  return (
    <div style={{ background: "#121826", border: "1px solid rgba(238,242,246,0.08)", borderRadius: 10, padding: "0.75rem 1.25rem", minWidth: 100 }}>
      <div style={{ fontSize: "0.7rem", color: "#9AA5B1", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
