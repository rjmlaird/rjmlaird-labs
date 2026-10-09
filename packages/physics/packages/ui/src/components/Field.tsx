import type { ReactNode } from "react";

export interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  digits?: number;
  onChange: (value: number) => void;
}

/** Labelled range input with live value. Replaces hand-rolled <label><input type=range> blocks. */
export function SliderField({ label, value, min, max, step = 1, unit = "", digits = 2, onChange }: SliderFieldProps) {
  return (
    <label>
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span>{value.toFixed(digits)}{unit && ` ${unit}`}</span>
    </label>
  );
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Callout({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return <div className={tone === "warn" ? "callout callout-lock" : "callout"}>{children}</div>;
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="chart-legend">
      {items.map((i) => (
        <li key={i.label}><span className="swatch" style={{ background: i.color }} />{i.label}</li>
      ))}
    </ul>
  );
}
