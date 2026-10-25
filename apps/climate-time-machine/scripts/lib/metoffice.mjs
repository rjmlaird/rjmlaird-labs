// Parser for Met Office "UK and regional series" year-ordered text files, e.g.
// https://www.metoffice.gov.uk/pub/data/weather/uk/climate/datasets/Tmean/date/Midlands.txt
// Data rows look like:  Year JAN FEB ... DEC WIN SPR SUM AUT ANN   (17 values after the year)
// Missing values are written as -99.9 or ---.

export function parseSeries(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim().split(/\s+/);
    if (!/^\d{4}$/.test(t[0]) || t.length < 18) continue;
    const nums = t.slice(1, 18).map((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > -90 ? n : null;
    });
    out.set(Number(t[0]), {
      months: nums.slice(0, 12),
      win: nums[12],
      spr: nums[13],
      sum: nums[14],
      aut: nums[15],
      ann: nums[16],
    });
  }
  return out;
}

export const metOfficeUrl = (variable, region) =>
  `https://www.metoffice.gov.uk/pub/data/weather/uk/climate/datasets/${variable}/date/${region}.txt`;
