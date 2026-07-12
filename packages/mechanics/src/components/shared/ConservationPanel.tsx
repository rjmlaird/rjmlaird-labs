import Katex from './Katex';

type EnergyValues = {
  kinetic: number;
  potential: number;
  dissipated: number;
  initialTotal: number;
};

type MomentumValues = {
  before: number;
  after: number;
};

type ConservationPanelProps = {
  energy?: EnergyValues;
  momentum?: MomentumValues;
};

function fmt(n: number, digits = 1) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

export default function ConservationPanel({ energy, momentum }: ConservationPanelProps) {
  if (!energy && !momentum) return null;

  const energyNow = energy ? energy.kinetic + energy.potential + energy.dissipated : 0;
  const energyDrift = energy ? Math.abs(energyNow - energy.initialTotal) : 0;
  const momentumDrift = momentum ? Math.abs(momentum.after - momentum.before) : 0;

  return (
    <section className="equation-card" aria-label="Conservation checks">
      <div className="equation-card__header">
        <h3>Conservation checks</h3>
        <p>Two of the most useful bookkeeping tools in mechanics.</p>
      </div>

      {energy && (
        <div className="conservation-block">
          <Katex math="E_k + E_p + E_{\text{dissipated}} = E_{\text{initial}}" />
          <p className="suvat-sub">
            {fmt(energy.kinetic)} + {fmt(energy.potential)} + {fmt(energy.dissipated)} = <strong>{fmt(energyNow)} J</strong>, started
            at <strong>{fmt(energy.initialTotal)} J</strong>
            {energyDrift > 0.5 ? ' — drifting, try a smaller time-scale' : ' ✓'}
          </p>
        </div>
      )}

      {momentum && (
        <div className="conservation-block">
          <Katex math="\sum m_i v_i \;(\text{before}) = \sum m_i v_i \;(\text{after})" />
          <p className="suvat-sub">
            {fmt(momentum.before, 2)} kg·m/s → <strong>{fmt(momentum.after, 2)} kg·m/s</strong>
            {momentumDrift > 0.05 ? ' — drifting, try a smaller time-scale' : ' ✓'}
          </p>
        </div>
      )}
    </section>
  );
}
