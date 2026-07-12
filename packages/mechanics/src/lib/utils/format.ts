export function formatValue(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

export function formatUnit(value: number, unit: string, digits = 2): string {
  return `${formatValue(value, digits)} ${unit}`;
}
