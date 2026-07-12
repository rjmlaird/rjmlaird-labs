export type GraphPoint = {
  x: number;
  y: number;
};

export const samplePoints: GraphPoint[] = [
  { x: 1, y: 4 },
  { x: 2, y: 7 },
  { x: 3, y: 5 },
  { x: 4, y: 9 },
  { x: 5, y: 6 },
];

export function parseJson(input: string): GraphPoint[] {
  try {
    const parsed = JSON.parse(input) as GraphPoint[];
    return parsed.filter((d) => typeof d.x === 'number' && typeof d.y === 'number');
  } catch {
    return [];
  }
}

export function parseCsv(input: string): GraphPoint[] {
  return input
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [x, y] = line.split(',').map(Number);
      return { x, y };
    })
    .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y));
}
