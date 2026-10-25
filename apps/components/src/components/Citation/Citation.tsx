import "./citation.css";

export interface CitationProps {
  source: string;
  publisher?: string;
  /** Human-readable date, e.g. "12 Sep 2026". */
  updated?: string;
  href?: string;
  /** Link text must describe the destination. */
  linkText?: string;
}

/** Source, publisher, date and a persistent link. */
export function Citation({ source, publisher, updated, href, linkText = "View source record" }: CitationProps) {
  const detail = [publisher, updated && `updated ${updated}`].filter(Boolean).join(", ");
  return (
    <p className="cite">
      {source}
      {(detail || href) && (
        <small className="cite__detail">
          {detail}
          {detail && href ? ". " : ""}
          {href && <a href={href}>{linkText}</a>}
        </small>
      )}
    </p>
  );
}
