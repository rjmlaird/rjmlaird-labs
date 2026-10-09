import { useMemo, useState } from 'react';

const normalizeHex = (value: string) => {
  const hex = value.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return (
      '#' +
      hex
        .split('')
        .map((char) => char + char)
        .join('')
        .toLowerCase()
    );
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }

  return null;
};

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

const luminance = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
};

const contrastRatio = (foreground: string, background: string) => {
  const fg = luminance(foreground);
  const bg = luminance(background);

  if (fg === null || bg === null) return null;

  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
};

const passFail = (ratio: number | null, threshold: number) => {
  if (ratio === null) return 'Fail';
  return ratio >= threshold ? 'Pass' : 'Fail';
};

export default function ContrastChecker() {
  const [foreground, setForeground] = useState('#0f172a');
  const [background, setBackground] = useState('#ffffff');

  const ratio = useMemo(() => contrastRatio(foreground, background), [foreground, background]);

  return (
    <main className="shell">
      <section className="panel">
        <div className="hero">
          <p className="eyebrow">Contrast Lab</p>
          <h1>WCAG 2.x colour contrast checker</h1>
          <p className="lede">
            Pick a foreground/background pair and see the ratio, plus AA/AAA pass or fail.
          </p>
        </div>

        <div className="controls" aria-label="Colour controls">
          <label>
            <span>Foreground</span>
            <input
              aria-label="Foreground colour picker"
              type="color"
              value={foreground}
              onChange={(event) => setForeground(event.target.value)}
            />
            <input
              aria-label="Foreground hex value"
              type="text"
              inputMode="text"
              value={foreground}
              onChange={(event) => {
                const value = normalizeHex(event.target.value);
                if (value) setForeground(value);
              }}
            />
          </label>

          <label>
            <span>Background</span>
            <input
              aria-label="Background colour picker"
              type="color"
              value={background}
              onChange={(event) => setBackground(event.target.value)}
            />
            <input
              aria-label="Background hex value"
              type="text"
              inputMode="text"
              value={background}
              onChange={(event) => {
                const value = normalizeHex(event.target.value);
                if (value) setBackground(value);
              }}
            />
          </label>
        </div>

        <div className="preview" style={{ color: foreground, backgroundColor: background }}>
          <p className="previewLabel">Preview</p>
          <p className="previewText">The quick brown fox jumps over the lazy dog.</p>
        </div>

        <div className="results" aria-live="polite">
          <article className="metric">
            <span>Ratio</span>
            <strong>{ratio ? `${ratio.toFixed(2)}:1` : '—'}</strong>
          </article>

          <article className="metric">
            <span>AA normal</span>
            <strong>{passFail(ratio, 4.5)}</strong>
          </article>

          <article className="metric">
            <span>AAA normal</span>
            <strong>{passFail(ratio, 7)}</strong>
          </article>

          <article className="metric">
            <span>AA large</span>
            <strong>{passFail(ratio, 3)}</strong>
          </article>

          <article className="metric">
            <span>AAA large</span>
            <strong>{passFail(ratio, 4.5)}</strong>
          </article>
        </div>
      </section>
    </main>
  );
}
