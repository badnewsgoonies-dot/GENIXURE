import { useEffect, useState } from 'react';
import ItemGrid from '../components/compendium/ItemGrid';
import SearchBar from '../components/compendium/SearchBar';
import { loadItems, type HeicItem } from '../lib/data';
import FacetPanel from '../components/compendium/FacetPanel';
import { filterItems as applyFilters } from '../lib/filters';
import { Dialog } from '../components/primitives/Dialog';
import { randomBuild } from '../lib/random';

export default function CompendiumPage() {
  const [items, setItems] = useState<HeicItem[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems()
      .then(setItems)
      .catch((e) => setError(e?.message || 'Failed to load'));
  }, []);

  // Facet state (Phase 2)
  const [buckets, setBuckets] = useState<Set<string>>(new Set(['all']));
  const [tagSet, setTagSet] = useState<Set<string>>(new Set());
  const [triggerSet, setTriggerSet] = useState<Set<string>>(new Set());
  const [setKeys, setSetKeys] = useState<Set<string>>(new Set());
  const [randomOpen, setRandomOpen] = useState(false);
  const [randomOutput, setRandomOutput] = useState<any>(null);

  // Load set definitions from global if present
  const setDefs = ((): { key: string; name: string; reqs?: any[] }[] => {
    const g: any = (globalThis as any).HeICSets || (globalThis as any).HEIC_SETS || (globalThis as any).HeIC_SETS;
    if (g && Array.isArray(g.definitions)) return g.definitions as any[];
    return [];
  })();
  const setSlugMap = new Map<string, string[]>();
  setDefs.forEach((d) => {
    const arr: string[] = [];
    (d.reqs || []).forEach((r: any) => { if (r.kind === 'slugs') arr.push(...(r.all || [])); });
    setSlugMap.set(d.key, arr);
  });

  const filtered = applyFilters(items, {
    q,
    buckets,
    tags: tagSet,
    triggers: triggerSet,
    sets: setKeys,
    setSlugMap,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)]">
      <FacetPanel
        items={items}
        buckets={buckets}
        onToggleBucket={(b) => setBuckets((prev) => { const n = new Set(prev); if (b==='all'){ n.clear(); n.add('all'); } else { if (n.has('all')) n.delete('all'); n.has(b) ? n.delete(b) : n.add(b); if (n.size===0) n.add('all'); } return n; })}
        tags={tagSet}
        onToggleTag={(t) => setTagSet((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })}
        triggers={triggerSet}
        onToggleTrigger={(t) => setTriggerSet((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; })}
        sets={setKeys}
        onToggleSet={(s) => setSetKeys((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; })}
        setDefs={setDefs}
        onRandomize={() => { const rb = randomBuild(items); setRandomOutput(rb); setRandomOpen(true); }}
      />

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <SearchBar value={q} onChange={setQ} placeholder="Search items, effects, tags…" />
          <div className="hidden items-center gap-2 md:flex">
            <button className="rounded-md border border-primary bg-black px-3 py-2 text-sm text-primary hover:bg-primary/10" onClick={() => setQ('')}>Clear</button>
          </div>
        </div>
        {error ? (
          <div className="rounded border border-primary bg-black p-4 text-primary">{error}</div>
        ) : (
          <ItemGrid items={filtered} />
        )}
      </div>
      <Dialog open={randomOpen} title="Random Build" onClose={() => setRandomOpen(false)}>
        <pre className="max-h-[60vh] overflow-auto text-xs text-muted">{JSON.stringify(randomOutput, null, 2)}</pre>
      </Dialog>
    </div>
  );
}
