export default function Method({ P }) {
  return (
    <details className="method">
      <summary>How this works</summary>
      <div className="method-body">
        <p><b>Measured years ({P.firstYear}–{P.lastObs}).</b> Met Office regional series for {P.location.name}, derived from HadUK-Grid. {P.location.note}</p>
        <p><b>Projected years ({P.lastObs + 1}–{P.lastYear}).</b> Daily output from {P.models.length} CMIP6 high-resolution climate models via the Open-Meteo Climate API, sampled at {P.location.lat}°N, {Math.abs(P.location.lon)}°{P.location.lon < 0 ? 'W' : 'E'}. Each model is shifted to match the observed 1991–2020 average, so only its change over time is used. The shaded band is the range across models and years, not a statistical confidence interval.</p>
        <p><b>Frost, days and nights.</b> Air frost days are counted from daily minimum temperature below 0 °C and are measured from 1961. Model frost counts are biased, so only their change is applied to the observed 1991–2020 average, and they are floored at zero. Winter is December to February, labelled by the year of its January.</p>
        <p><b>Dryness.</b> A simplified index: April–September rainfall, compared with 1961–1990 and flipped so higher means drier. It ignores evaporation, so it is not the SPEI or a formal drought measure.</p>
        <p><b>Limits.</b> One emissions pathway only, and projections end in 2050. This is an educational overview, not a flood or drought forecast. Data refreshed {P.generated}.</p>
      </div>
    </details>
  );
}
