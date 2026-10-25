// src/components/CH4Visualiser.tsx
import GasChart from './GasChart';

function parseCH4Value(cols: string[]) {
  return Number(cols[4]);
}

export default function CH4Visualiser() {
  return (
    <GasChart
      title="Atmospheric methane trend"
      yLabel="CH4 ppb"
      dataUrl="/data/ch4_mm_gl.csv"
      sourceLabel="Source: NOAA Global Monitoring Laboratory, global monthly mean methane data, accessed July 12, 2026."
      valueUnit="ppb"
      lineColor="#a0aec0"
      smoothColor="#f6ad55"
      annualColor="#8bb4ff"
      caption="Monthly mean methane shows the seasonal cycle and the longer-term rise in atmospheric methane. The 12-month mean reduces month-to-month variability so the trend is easier to read. Annual mean compresses each year to one value for a simpler year-by-year comparison."
      parseValue={parseCH4Value}
    />
  );
}
