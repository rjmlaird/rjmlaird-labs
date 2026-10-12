export interface Readout { label: string; value: string }

/** Label/value rows (was the ad-hoc <dl className="value-list"> in each lab). */
export function ReadoutList({ items }: { items: Readout[] }) {
  return (
    <dl className="value-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
