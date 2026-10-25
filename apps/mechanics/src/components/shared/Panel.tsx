import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  subtitle?: string;
  as?: 'aside' | 'section';
  scroll?: boolean;
  ariaLabel?: string;
  children: ReactNode;
};

export default function Panel({ title, subtitle, as = 'aside', scroll = true, ariaLabel, children }: PanelProps) {
  const Tag = as;
  return (
    <Tag className="mech-panel" aria-label={ariaLabel ?? title}>
      <div className="mech-panel__header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className={`mech-panel__body ${scroll ? 'mech-panel__body--scroll' : 'mech-panel__body--chart'}`}>
        {children}
      </div>
    </Tag>
  );
}
