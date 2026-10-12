import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export interface KatexProps { math: string; display?: boolean; className?: string }

/**
 * Renders a LaTeX string with KaTeX. Pass developer-authored formula strings
 * only (never user input): the generated markup is injected as HTML.
 */
export function Katex({ math, display = false, className = "" }: KatexProps) {
  const html = useMemo(() => katex.renderToString(math, { throwOnError: false, displayMode: display }), [math, display]);
  return <span className={`katex-wrap ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}
