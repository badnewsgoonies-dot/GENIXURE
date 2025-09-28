import React from 'react';
import { panel, headerBar, outline, badge } from '../../theme/legacyTheme';

export type Facet = { key: string; label: string; count: number; active?: boolean };

export default function LeftSidebar({
  buckets,
  tags,
  triggers,
  onToggleBucket,
  onToggleTag,
  onToggleTrigger,
  onClear,
}: {
  buckets: Facet[];
  tags: Facet[];
  triggers: Facet[];
  onToggleBucket: (k: string) => void;
  onToggleTag: (k: string) => void;
  onToggleTrigger: (k: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={`${panel} h-full p-2`}>
      <div className={headerBar}>
        <span className="text-xs uppercase tracking-wide text-muted">Compendium</span>
        <button className={`${badge}`} onClick={onClear}>Clear All</button>
      </div>

      <Section title="Bucket">
        {buckets.map((f) => (
          <Row key={f.key} name={f.label} count={f.count} active={!!f.active} onClick={() => onToggleBucket(f.key)} />
        ))}
      </Section>

      <Section title="Tag Families">
        {tags.map((f) => (
          <Row key={f.key} name={f.label} count={f.count} active={!!f.active} onClick={() => onToggleTag(f.key)} />
        ))}
      </Section>

      <Section title="Triggers">
        {triggers.map((f) => (
          <Row key={f.key} name={f.label} count={f.count} active={!!f.active} onClick={() => onToggleTrigger(f.key)} />
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

function Row({ name, count, onClick, active }: { name: string; count: number; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs hover:bg-white/5 ${
        active ? 'bg-white/10' : ''
      }`}
    >
      <span className="truncate">{name}</span>
      <span className="ml-2 rounded bg-black/60 px-1 text-[10px]">{count}</span>
    </button>
  );
}
