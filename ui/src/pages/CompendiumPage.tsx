import React, { useMemo, useState } from 'react';
import AppShell from '../components/shell/AppShell';
import ItemCard from '../components/cards/ItemCard';
import { gridWrap, headerBar } from '../theme/legacyTheme';
import { LoadoutProvider } from '../state/LoadoutContext';
import useCompendium from '../data/useCompendium';

export default function CompendiumPage() {
  const { items, error } = useCompendium();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(
      (i: any) =>
        i.name.toLowerCase().includes(s) ||
        i.slug.toLowerCase().includes(s) ||
        (Array.isArray(i.tags) && i.tags.some((t: string) => t.toLowerCase().includes(s)))
    );
  }, [items, q]);

  return (
    <LoadoutProvider>
    <AppShell>
      <div className="flex h-full flex-col">
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
    </AppShell>
    </LoadoutProvider>
  );
}

