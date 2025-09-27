import type { HeicItem } from '../../lib/data';

export default function ItemGrid({ items }: { items: HeicItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="grid place-items-center p-10 text-muted">
        <div>No items match your search.</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
      {items.map(it => (
        <div key={it.key} className="rounded-xl border border-border bg-surface p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">{it.name}</h3>
            <span className="rounded border border-border px-2 py-0.5 text-xs text-muted">{it.bucket}</span>
          </div>
          {it.effect ? (
            <p className="text-xs text-muted">{it.effect}</p>
          ) : (
            <p className="text-xs text-muted">No effect text</p>
          )}
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-xs text-muted">
            <div><span className="text-text">{it.stats?.attack ?? 0}</span><div>ATK</div></div>
            <div><span className="text-text">{it.stats?.armor ?? 0}</span><div>ARM</div></div>
            <div><span className="text-text">{it.stats?.health ?? 0}</span><div>HP</div></div>
            <div><span className="text-text">{it.stats?.speed ?? 0}</span><div>SPD</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

