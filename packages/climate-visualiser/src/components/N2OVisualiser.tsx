// src/components/N2OVisualiser.tsx
import GasChart from './GasChart';

function parseN2OValue(cols: string[]) {
  return Number(cols[4]);
}

export default function N2OVisualiser() {
  return (
    <GasChart
      title="Atmospheric nitrous oxide trend"
      yLabel="N2O ppb"
      dataUrl="/data/n2o_mm_gl.csv"
      sourceLabel="Source: NOAA Global Monitoring Laboratory, global monthly mean nitrous oxide data, accessed July 12, 2026."
      valueUnit="ppb"
      lineColor="#a0aec0"
      smoothColor="#63b3ed"
      annualColor="#8bb4ff"
      caption="Monthly mean nitrous oxide shows a steadier rise than the more seasonal greenhouse gases. The 12-month mean makes the long-term trend easier to compare across decades. Annual mean compresses each year to one value for a simpler year-by-year comparison."
      parseValue={parseN2OValue}
    />
  );
}
