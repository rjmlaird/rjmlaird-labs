import { formatValue as fmt } from "@labs/sim-core";
import { Katex } from "./Katex";

export interface SuvatValues { u: number; v: number; a: number; s: number; t: number }

/**
 * The four constant-acceleration equations with the live numbers dropped in.
 * Each drops a different one of (s, u, v, a, t), so together they solve any unknown.
 */
export function SuvatPanel({ title = "SUVAT equations", values }: { title?: string; values: SuvatValues }) {
  const { u, v, a, s, t } = values;
  const vPred = u + a * t;
  const s1 = u * t + 0.5 * a * t * t;
  const vSq = u * u + 2 * a * s;
  const s2 = t > 0 ? ((u + v) / 2) * t : 0;
  return (
    <section className="equation-card" aria-label={title}>
      <div className="equation-card__header">
        <h3>{title}</h3>
        <p>The constant-acceleration equations, with this moment's numbers dropped in.</p>
      </div>
      <ul className="suvat-list">
        <li><Katex math="v = u + at" /><span className="suvat-sub">{fmt(u)} + ({fmt(a)})({fmt(t)}) = <strong>{fmt(vPred)} m/s</strong></span></li>
        <li><Katex math="s = ut + \tfrac{1}{2}at^2" /><span className="suvat-sub">({fmt(u)})({fmt(t)}) + ½({fmt(a)})({fmt(t)})² = <strong>{fmt(s1)} m</strong></span></li>
        <li><Katex math="v^2 = u^2 + 2as" /><span className="suvat-sub">{fmt(u)}² + 2({fmt(a)})({fmt(s)}) = <strong>{fmt(vSq)} m²/s²</strong> (v ≈ {fmt(Math.sqrt(Math.max(vSq, 0)))} m/s)</span></li>
        <li><Katex math="s = \tfrac{1}{2}(u+v)t" /><span className="suvat-sub">½({fmt(u)}+{fmt(v)})({fmt(t)}) = <strong>{fmt(s2)} m</strong></span></li>
      </ul>
      <p className="hint">u = {fmt(u)} m/s, v = {fmt(v)} m/s, a = {fmt(a)} m/s², s = {fmt(s)} m, t = {fmt(t)} s</p>
    </section>
  );
}
