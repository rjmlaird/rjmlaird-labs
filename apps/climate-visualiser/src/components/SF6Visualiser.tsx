// src/components/SF6Visualiser.tsx
import GasChart from './GasChart';

function parseSF6Value(cols: string[]) {
  return Number(cols[4]);
}

export default function SF6Visualiser() {
  return (
    <GasChart
      title="Atmospheric sulphur hexafluoride trend"
      yLabel="SF6 ppt"
      dataUrl="/data/sf6_mm_gl.csv"
      sourceLabel="Source: NOAA Global Monitoring Laboratory, global monthly mean SF6 data, accessed July 12, 2026."
      valueUnit="ppt"
      lineColor="#a0aec0"
      smoothColor="#d53f8c"
      annualColor="#8bb4ff"
      caption="Monthly mean SF6 shows a strong upward trend from a very small baseline concentration. The 12-month mean smooths the series so the increase is easier to see. Annual mean compresses each year to one value for a simpler year-by-year comparison."
      parseValue={parseSF6Value}
    />
  );
}
