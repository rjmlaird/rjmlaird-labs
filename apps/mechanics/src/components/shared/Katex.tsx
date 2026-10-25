import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

type KatexProps = {
  math: string;
  display?: boolean;
  className?: string;
};

/**
 * Renders a LaTeX string with KaTeX. Every call site in this app passes a
 * fixed, developer-authored formula string (never user input), so the
 * generated markup is safe to inject directly.
 */
export default function Katex({ math, display = false, className = '' }: KatexProps) {
  const html = useMemo(
    () =>
      katex.renderToString(math, {
        throwOnError: false,
        displayMode: display,
      }),
    [math, display]
  );

  return <span className={`katex-wrap ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />;
}
