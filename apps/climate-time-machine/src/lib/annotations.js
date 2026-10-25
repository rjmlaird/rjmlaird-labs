// Curated notes tied to well-documented UK-wide events. They describe the UK, not a specific
// region, and the UI says so. Region-specific numbers come from the data, not from this file.

export const EVENTS = [
  { year: 1963, title: 'The Big Freeze', text: 'The winter of 1962/63 was one of the coldest of the 20th century in the UK, with snow lying for weeks and rivers freezing.' },
  { year: 1976, title: 'The drought summer', text: 'A long hot, dry summer led to widespread water restrictions and the Drought Act 1976.' },
  { year: 2003, title: 'A European heatwave', text: 'August 2003 brought the UK its first recorded temperature of 38 °C or more, as heat gripped much of Europe.' },
  { year: 2007, title: 'Summer floods', text: 'Exceptional summer rainfall caused serious flooding in parts of England, including areas of the Midlands.' },
  { year: 2010, title: 'A bitter December', text: 'December 2010 was among the coldest Decembers on record for the UK, with heavy snow and disruption.' },
  { year: 2012, title: 'From drought to deluge', text: 'A dry start to the year, with drought declared across much of England, was followed by an exceptionally wet April to June.' },
  { year: 2014, title: 'The wet winter of 2013/14', text: 'The UK’s wettest winter in its records brought prolonged flooding, notably on the Somerset Levels and along the Thames.' },
  { year: 2018, title: 'A long, hot summer', text: 'Summer 2018 joined 2006, 2003 and 1976 among the UK’s warmest summers, with extended dry weather.' },
  { year: 2022, title: 'The year the UK hit 40 °C', text: 'On 19 July 2022 the UK recorded 40 °C for the first time, and the year’s average temperature passed 10 °C across the UK for the first time.' },
];

export const eventFor = (year) => EVENTS.find((e) => e.year === year) ?? null;
