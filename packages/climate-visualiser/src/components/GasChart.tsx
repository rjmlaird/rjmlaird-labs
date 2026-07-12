// src/components/GasChart.tsx
import { useState, type ReactNode } from 'react';
import CO2Visualiser from './CO2Visualiser';
import CH4Visualiser from './CH4Visualiser';
import N2OVisualiser from './N2OVisualiser';
import SF6Visualiser from './SF6Visualiser';

type TabKey = 'gases';

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

type ChartCardProps = {
  children: ReactNode;
};

function TabButton(props: TabButtonProps) {
  const { active, onClick, children } = props;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-sm font-medium transition',
        active
          ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-black/20'
          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ChartCard(props: ChartCardProps) {
  return <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">{props.children}</div>;
}

export default function GasChart() {
  const [tab] = useState<TabKey>('gases');

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Greenhouse gas dashboard sections" className="flex flex-wrap gap-2">
        <TabButton active={tab === 'gases'} onClick={() => {}}>
          Greenhouse gases
        </TabButton>
      </div>

      {tab === 'gases' && (
        <section role="tabpanel" aria-label="Greenhouse gases dashboard" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard>
              <CO2Visualiser />
            </ChartCard>
            <ChartCard>
              <CH4Visualiser />
            </ChartCard>
            <ChartCard>
              <N2OVisualiser />
            </ChartCard>
            <ChartCard>
              <SF6Visualiser />
            </ChartCard>
          </div>
        </section>
      )}
    </div>
  );
}
