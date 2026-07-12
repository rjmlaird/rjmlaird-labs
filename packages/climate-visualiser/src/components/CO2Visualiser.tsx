// src/components/CO2Visualiser.tsx
import GasChart from './GasChart';

function parseCO2Value(cols: string[]) {
  return Number(cols[4]);
}

export default function CO2Visualiser() {
  return (
    <GasChart
      title="Atmospheric carbon dioxide trend"
      yLabel="CO2 ppm"
      dataUrl="/data/co2_mm_mlo.csv"
      sourceLabel="Source: NOAA Global Monitoring Laboratory, Mauna Loa monthly mean CO2 data, accessed July 12, 2026."
      valueUnit="ppm"
      lineColor="#a0aec0"
      smoothColor="#00c2a8"
      annualColor="#8bb4ff"
      caption="Monthly mean CO2 shows the full seasonal cycle and the long-term rise in atmospheric carbon dioxide. The 12-month mean smooths seasonal variation to make the underlying trend easier to see. Annual mean compresses each year to one value for a simpler year-by-year comparison."
      parseValue={parseCO2Value}
    />
  );
}
