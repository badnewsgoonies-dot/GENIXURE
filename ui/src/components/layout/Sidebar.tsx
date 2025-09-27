type Props = { side: 'left' | 'right'; open: boolean; onToggle: () => void };

export default function Sidebar({ side, open, onToggle }: Props) {
  const sideBorder = side === 'left' ? 'md:border-r' : 'md:border-l';
  return (
    <aside
      className={`hidden h-full border-border bg-surface ${sideBorder} ${open ? 'md:block' : 'md:hidden'}`}
      aria-label={`${side} panel`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border p-3">
        <h2 className="text-sm font-semibold text-text">{side === 'left' ? 'Player' : 'Opponent'}</h2>
        <button
          onClick={onToggle}
          className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:border-primary hover:text-text"
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm text-muted">{side} controls…</p>
      </div>
    </aside>
  );
}

