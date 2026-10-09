import "./metric-card.css";

export interface MetricCardProps {
  label: string;
  /** null or undefined shows a dash and the missing reason. */
  value?: number | string | null;
  unit?: string;
  source: string;
  /** Freshness, e.g. "Last updated 3 hours ago". Always shown. */
  freshness: string;
  /** Explains why the value is missing. */
  missingReason?: string;
}

/** Value, unit, source and freshness always appear together. */
export function MetricCard({ label, value, unit, source, freshness, missingReason }: MetricCardProps) {
  const missing = value === null || value === undefined || value === "";
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">
        {missing ? "\u2014" : value}
        {!missing && unit && <span className="metric__unit"> {unit}</span>}
      </div>
      <div className="metric__stale">{missing ? missingReason ?? "No reading available." : freshness}</div>
      <div className="metric__label">Source: {source}</div>
    </div>
  );
}
