import { useMemo } from 'react';
import type { HeicItem } from '../../lib/data';
import { collectTags, collectTriggers, inferBuckets } from '../../lib/filters';

type Props = {
  items: HeicItem[];
  buckets: Set<string>; onToggleBucket: (bucket: string) => void;
  tags: Set<string>; onToggleTag: (tag: string) => void;
  triggers: Set<string>; onToggleTrigger: (t: string) => void;
  sets: Set<string>; onToggleSet: (s: string) => void;
  setDefs: { key: string; name: string; reqs?: any[] }[];
};

export default function FacetPanel({ items, buckets, onToggleBucket, tags, onToggleTag, triggers, onToggleTrigger, sets, onToggleSet, setDefs }: Props) {
  const bucketCounts = useMemo(() => inferBuckets(items), [items]);
  const tagCounts = useMemo(() => collectTags(items), [items]);
  const triggerCounts = useMemo(() => collectTriggers(items), [items]);

  const canonicalTriggers = ['battleStart', 'turnStart', 'hit', 'wounded', 'exposed', 'passive'];

  return (
    <aside className="w-72 flex-shrink-0 border-r border-border bg-surface p-3 hidden md:block">
      <Section title="Bucket">
        {(['all','items','weapons','upgrades'] as const).map((b) => (
          <FacetCheckbox key={b} label={b} count={bucketCounts[b] || 0} checked={buckets.has(b)} onChange={() => onToggleBucket(b)} />
        ))}
      </Section>

      <Section title="Tags">
        <div className="flex max-h-64 flex-col gap-1 overflow-auto pr-1">
          {Object.keys(tagCounts).sort().map((t) => (
            <FacetCheckbox key={t} label={t} count={tagCounts[t]} checked={tags.has(t)} onChange={() => onToggleTag(t)} />
          ))}
        </div>
      </Section>

      <Section title="Triggers">
        {canonicalTriggers.map((t) => (
          <FacetCheckbox key={t} label={toHumanTrigger(t)} count={triggerCounts[t] || 0} checked={triggers.has(t)} onChange={() => onToggleTrigger(t)} />
        ))}
      </Section>

      {setDefs.length > 0 && (
        <Section title="Sets">
          <div className="flex max-h-64 flex-col gap-1 overflow-auto pr-1">
            {setDefs.map((d) => (
              <FacetCheckbox key={d.key} label={d.name} count={0} checked={sets.has(d.key)} onChange={() => onToggleSet(d.key)} />
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{title}</h4>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FacetCheckbox({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
      <input type="checkbox" className="accent-primary" checked={checked} onChange={onChange} />
      <span>{label}</span>
      {typeof count === 'number' && <span className="ml-auto text-xs text-muted">{count}</span>}
    </label>
  );
}

function toHumanTrigger(t: string) {
  const map: Record<string, string> = {
    battleStart: 'Battle Start',
    turnStart: 'Turn Start',
    hit: 'On Hit',
    wounded: 'On Wounded',
    exposed: 'On Exposed',
    passive: 'Passive',
  };
  return map[t] || t;
}

