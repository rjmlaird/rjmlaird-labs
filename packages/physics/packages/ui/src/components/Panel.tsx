import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  subtitle?: string;
  as?: "aside" | "section";
  /** scroll = controls/readouts column; false = fixed chart area */
  scroll?: boolean;
  ariaLabel?: string;
  children: ReactNode;
}

export function Panel({ title, subtitle, as = "aside", scroll = true, ariaLabel, children }: PanelProps) {
  const Tag = as;
  return (
    <Tag className="lab-panel" aria-label={ariaLabel ?? title}>
      <div className="lab-panel__header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className={`lab-panel__body ${scroll ? "lab-panel__body--scroll" : "lab-panel__body--chart"}`}>{children}</div>
    </Tag>
  );
}

/** Three-column control | stage | readouts layout used by every lab page. */
export function LabGrid({ children }: { children: ReactNode }) {
  return <div className="lab-grid">{children}</div>;
}
