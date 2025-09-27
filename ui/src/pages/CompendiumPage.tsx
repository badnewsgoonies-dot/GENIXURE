import { useEffect, useState } from 'react';
import ItemGrid from '../components/compendium/ItemGrid';
import SearchBar from '../components/compendium/SearchBar';
import { loadItems, type HeicItem } from '../lib/data';

export default function CompendiumPage() {
  const [items, setItems] = useState<HeicItem[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems()
      .then(setItems)
      .catch((e) => setError(e?.message || 'Failed to load'));
  }, []);

  const filtered = items.filter(it => `${it.name} ${it.effect ?? ''} ${(it.tags ?? []).join(' ')}`
    .toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-3 p-3">
      <SearchBar value={q} onChange={setQ} placeholder="Search items, effects, tags…" />
      {error ? (
        <div className="rounded border border-primary bg-black p-4 text-primary">{error}</div>
      ) : (
        <ItemGrid items={filtered} />
      )}
    </div>
  );
}

