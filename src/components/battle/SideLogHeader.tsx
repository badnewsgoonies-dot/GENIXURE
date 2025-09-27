import type { Side } from '../../types/battle';
import type { SideFilter } from './EventLogList';

export default function SideLogHeader({
  side,
  sideFilter,
  setSideFilter,
}: {
  side: Side;
  sideFilter: SideFilter;
  setSideFilter: (v: SideFilter) => void;
}) {
  const label = side === 'player' ? 'Player' : 'Opponent';
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <h3 className="text-sm font-semibold tracking-wide">
        {label} — Event Log
      </h3>
      <div className="flex items-center gap-1 text-xs">
        <button
          onClick={() => setSideFilter('all')}
          className={`rounded border px-2 py-1 ${sideFilter === 'all' ? 'border-primary text-text' : 'border-border text-muted hover:border-primary hover:text-text'}`}
        >
          All
        </button>
        <button
          onClick={() => setSideFilter('outgoing')}
          className={`rounded border px-2 py-1 ${sideFilter === 'outgoing' ? 'border-primary text-text' : 'border-border text-muted hover:border-primary hover:text-text'}`}
        >
          Outgoing
        </button>
        <button
          onClick={() => setSideFilter('incoming')}
          className={`rounded border px-2 py-1 ${sideFilter === 'incoming' ? 'border-primary text-text' : 'border-border text-muted hover:border-primary hover:text-text'}`}
        >
          Incoming
        </button>
      </div>
    </div>
  );
}

