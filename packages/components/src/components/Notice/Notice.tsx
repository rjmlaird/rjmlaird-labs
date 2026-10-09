import type { ReactNode } from "react";
import "./notice.css";

export type NoticeTone = "info" | "warn" | "danger" | "success";

export interface NoticeProps {
  tone?: NoticeTone;
  /** Required: colour is never the only signal. */
  heading: string;
  children: ReactNode;
}

/** Four tones. Danger notices are announced immediately; the rest are read in order. */
export function Notice({ tone = "info", heading, children }: NoticeProps) {
  return (
    <div className={`notice${tone === "info" ? "" : ` notice--${tone}`}`} role={tone === "danger" ? "alert" : "note"}>
      <b className="notice__heading">{heading}</b>
      {children}
    </div>
  );
}
