import React, { useMemo, useState } from 'react';
import AppShell from '../components/shell/AppShell';
import ItemCard from '../components/cards/ItemCard';
import { gridWrap, headerBar } from '../theme/legacyTheme';
import { LoadoutProvider } from '../state/LoadoutContext';
import LeftSidebar, { type Facet } from '../components/shell/LeftSidebar';
import useCompendium from '../data/useCompendium';

export default function CompendiumPage() {
  const { items, error } = useCompendium();
  const [q, setQ] = useState('');

  // Search-first subset
  const searched = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(
      (i: any) =>
        i.name.toLowerCase().includes(s) ||
        i.slug.toLowerCase().includes(s) ||
        (Array.isArray(i.tags) && i.tags.some((t: string) => t.toLowerCase().includes(s)))
    );
  }, [items, q]);

  // Filter state
  const [bucketSel, setBucketSel] = useState<Set<string>>(new Set());
  const [tagSel, setTagSel] = useState<Set<string>>(new Set());
  const [trigSel, setTrigSel] = useState<Set<string>>(new Set());

  // Helpers
  const bucketOf = (k: string) => (k.startsWith('weapons/') ? 'weapons' : k.startsWith('upgrades/') ? 'upgrades' : k.startsWith('sets/') ? 'sets' : 'items');
  const triggersOf = (txt: string): string[] => {
    const t = (txt || '').toLowerCase();
    const res: string[] = [];
    if (t.includes('battle start')) res.push('battleStart');
    if (t.includes('first turn')) res.push('firstTurn');
    if (t.includes('turn end')) res.push('turnEnd');
    if (t.includes('on hit')) res.push('onHit');
    if (t.includes('wounded')) res.push('onWounded');
    if (t.includes('exposed')) res.push('onExposed');
    if (t.includes('countdown')) res.push('countdown');
    if (t.includes('symphony')) res.push('symphony');
    return res;
  };

  // Counts for sidebar (computed on searched set)
  const buckets: Facet[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of searched) {
      const b = bucketOf(it.key || it.slug);
      map.set(b, (map.get(b) || 0) + 1);
    }
    const order = ['items', 'weapons', 'upgrades', 'sets'];
    return order.map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), count: map.get(k) || 0, active: bucketSel.has(k) }));
  }, [searched, bucketSel]);

  const tags: Facet[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of searched) {
      (it.tags || []).forEach((t: string) => map.set(t, (map.get(t) || 0) + 1));
    }
    const arr = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([k, v]) => ({ key: k, label: k, count: v, active: tagSel.has(k) }));
    return arr;
  }, [searched, tagSel]);

  const triggers: Facet[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of searched) {
      triggersOf(it.text || '').forEach((t) => map.set(t, (map.get(t) || 0) + 1));
    }
    const list: { key: string; label: string }[] = [
      { key: 'battleStart', label: 'Battle Start' },
      { key: 'firstTurn', label: 'First Turn' },
      { key: 'onHit', label: 'On Hit' },
      { key: 'onWounded', label: 'On Wounded' },
      { key: 'onExposed', label: 'On Exposed' },
      { key: 'turnEnd', label: 'Turn End' },
      { key: 'countdown', label: 'Countdown' },
      { key: 'symphony', label: 'Symphony' },
    ];
    return list.map(({ key, label }) => ({ key, label, count: map.get(key) || 0, active: trigSel.has(key) }));
  }, [searched, trigSel]);

  // Apply filters
  const filtered = useMemo(() => {
    return searched.filter((it: any) => {
      const b = bucketOf(it.key || it.slug);
      if (bucketSel.size && !bucketSel.has(b)) return false;
      if (tagSel.size && !(it.tags || []).some((t: string) => tagSel.has(t))) return false;
      if (trigSel.size && !triggersOf(it.text || '').some((t) => trigSel.has(t))) return false;
      return true;
    });
  }, [searched, bucketSel, tagSel, trigSel]);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>) => (k: string) =>
    set((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const clearAll = () => {
    setBucketSel(new Set());
    setTagSel(new Set());
    setTrigSel(new Set());
  };

  return (
    <LoadoutProvider>
    <AppShell>
      <div className="grid h-full grid-cols-[280px_minmax(0,1fr)] gap-3">
        <div className="overflow-hidden">
          <LeftSidebar
            buckets={buckets}
            tags={tags}
            triggers={triggers}
            onToggleBucket={toggle(setBucketSel)}
            onToggleTag={toggle(setTagSel)}
            onToggleTrigger={toggle(setTrigSel)}
            onClear={clearAll}
          />
        </div>
        <div className="flex min-w-0 flex-col">
        <div className={headerBar}>
          <input
            className="w-full rounded-md border border-border bg-black/50 px-3 py-1 text-sm outline-none"
            placeholder="Search items, effects, tags..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="h-[calc(100%-42px)] overflow-auto">
          {error && (
            <div className="m-2 rounded border border-primary bg-black p-3 text-sm text-primary">{error}</div>
          )}
          <div className={gridWrap}>
            {filtered.map((it: any) => (
              <ItemCard
                key={it.key || it.slug}
                name={it.name}
                slug={it.slug}
                keyPath={it.key}
                tags={it.tags || []}
                text={it.text}
                trigger={it.trigger}
                stats={it.stats}
                onAdd={() => {}}
                onInfo={() => {}}
              />
            ))}
          </div>
        </div>
        </div>
      </div>
    </AppShell>
    </LoadoutProvider>
  );
}

