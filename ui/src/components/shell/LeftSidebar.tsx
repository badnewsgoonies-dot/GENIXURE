import React from 'react';
import { panel, headerBar, outline, badge } from '../../theme/legacyTheme';

export default function LeftSidebar() {
  return (
    <div className={`${panel} h-full p-2`}>
      <div className={headerBar}>
        <span className="text-xs uppercase tracking-wide text-muted">Compendium</span>
        <button className={`${badge}`}>Clear All</button>
      </div>

      {/* Buckets */}
      <Section title="Bucket">
        {['All Items', 'Items', 'Weapons', 'Upgrades'].map((x, i) => (
          <Row key={i} name={x} count={i === 0 ? 400 : 100 - i * 12} />
        ))}
      </Section>

      {/* Tag Families */}
      <Section title="Tag Families">
        {['Bomb', 'Symphony', 'Poison', 'Armor', 'Regen', 'Wound', 'Blood', 'Order', 'Wind'].map((x, i) => (
          <Row key={i} name={x} count={i * 3 + 2} />
        ))}
      </Section>

      {/* Triggers */}
      <Section title="Triggers">
        {['Battle Start', 'First Turn', 'On Hit', 'On Wounded', 'On Exposed', 'Turn End'].map((x, i) => (
          <Row key={i} name={x} count={i * 5 + 1} />
        ))}
      </Section>

      {/* Sets */}
      <Section title="Sets">
        {['Glasses of the Hero', 'Highborn', 'Bloodmoon'].map((x, i) => (
          <Row key={i} name={x} count={i + 1} />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{title}</div>
      <div className={`${outline} max-h-48 space-y-1 overflow-auto p-1`}>{children}</div>
    </div>
  );
}

function Row({ name, count }: { name: string; count: number }) {
  return (
    <button className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs hover:bg-white/5">
      <span className="truncate">{name}</span>
      <span className="ml-2 rounded bg-black/60 px-1 text-[10px]">{count}</span>
    </button>
  );
}

