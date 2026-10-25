import Katex from './Katex';

type SuvatValues = {
  /** initial velocity, m/s */
  u: number;
  /** current/final velocity, m/s */
  v: number;
  /** acceleration, m/s^2 (assumed constant over the interval shown) */
  a: number;
  /** displacement, m */
  s: number;
  /** elapsed time, s */
  t: number;
};

type SuvatPanelProps = {
  title?: string;
  values: SuvatValues;
};

function fmt(n: number, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

/**
 * The four "SUVAT" equations of motion for constant acceleration. Each one
 * drops a different one of the five variables (s, u, v, a, t), so together
 * they let you solve for any unknown from any three of the others.
 */
export default function SuvatPanel({ title = 'SUVAT equations', values }: SuvatPanelProps) {
  const { u, v, a, s, t } = values;
  const predictedV = u + a * t; // v = u + at (no s)
  const predictedS1 = u * t + 0.5 * a * t * t; // s = ut + 1/2 at^2 (no v)
  const predictedVSq = u * u + 2 * a * s; // v^2 = u^2 + 2as (no t)
  const predictedS2 = t > 0 ? ((u + v) / 2) * t : 0; // s = 1/2(u+v)t (no a)

  return (
    <section className="equation-card" aria-label={title}>
      <div className="equation-card__header">
        <h3>{title}</h3>
        <p>The constant-acceleration equations, with this moment's numbers dropped in.</p>
      </div>

      <ul className="suvat-list">
        <li>
          <Katex math="v = u + at" />
          <span className="suvat-sub">
            {fmt(u)} + ({fmt(a)})({fmt(t)}) = <strong>{fmt(predictedV)} m/s</strong>
          </span>
        </li>
        <li>
          <Katex math="s = ut + \tfrac{1}{2}at^2" />
          <span className="suvat-sub">
            ({fmt(u)})({fmt(t)}) + ½({fmt(a)})({fmt(t)})² = <strong>{fmt(predictedS1)} m</strong>
          </span>
        </li>
        <li>
          <Katex math="v^2 = u^2 + 2as" />
          <span className="suvat-sub">
            {fmt(u)}² + 2({fmt(a)})({fmt(s)}) = <strong>{fmt(predictedVSq)} m²/s²</strong> (v ≈ {fmt(Math.sqrt(Math.max(predictedVSq, 0)))} m/s)
          </span>
        </li>
        <li>
          <Katex math="s = \tfrac{1}{2}(u+v)t" />
          <span className="suvat-sub">
            ½({fmt(u)}+{fmt(v)})({fmt(t)}) = <strong>{fmt(predictedS2)} m</strong>
          </span>
        </li>
      </ul>
      <p className="hint">
        u = {fmt(u)} m/s, v = {fmt(v)} m/s, a = {fmt(a)} m/s², s = {fmt(s)} m, t = {fmt(t)} s
      </p>
    </section>
  );
}
