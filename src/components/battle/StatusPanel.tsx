import React from 'react';

type Stat = { key: string; value: number; label?: string };

type TopIcon =
  | { key: string; name: string; count?: number }
  | { key: string; className: string; count?: number };

type Props = {
  side: 'player' | 'enemy';
  stats: Stat[];
  topIcons: TopIcon[];
  sprite?: React.ReactNode;
  accent?: 'green' | 'red';
  renderIcon?: (name: string) => React.ReactNode;
  badgeClassName?: string;
};

const frameColor = {
  green: 'ring-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  red: 'ring-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
};

export default function StatusPanel({
  side,
  stats,
  topIcons,
  sprite,
  accent = 'green',
  renderIcon,
  badgeClassName = 'relative inline-flex items-center gap-1',
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      {/* Top status row: non-wrapping, even spacing via gap */}
      <div className="mb-3 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-4">
          {topIcons.map((icon) => (
            <div key={icon.key} className={badgeClassName}>
              {'name' in icon && renderIcon ? (
                <span className="inline-block">{renderIcon(icon.name)}</span>
              ) : (
                <span className={`inline-block ${(icon as any).className}`} />
              )}
              {typeof icon.count === 'number' && (
                <span className="text-xs text-muted">{icon.count}</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted">Current Status</div>
      </div>

      {/* Body: [vertical stat pills] [sprite] [right slot] */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        {/* Left: vertical stat pills */}
        <div className="flex flex-col gap-2">
          {stats.map((s) => (
            <div
              key={s.key}
              className="flex min-w-[42px] items-center justify-center rounded-lg border border-border bg-black/60 px-2 py-1 text-sm font-semibold"
              aria-label={s.label ?? s.key}
              title={s.label ?? s.key}
            >
              <span>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Center: sprite frame */}
        <div
          className={`relative grid aspect-square place-items-center rounded-xl ring-2 ${frameColor[accent]} bg-black/40`}
        >
          <div className="absolute inset-0 rounded-xl border border-border/60" />
          <div className="p-3">{sprite ?? <div className="h-24 w-24" />}</div>
        </div>

        {/* Right: reserved slot (kept for symmetry / future buffs) */}
        <div className="h-[88px] w-[120px] rounded-lg border border-border/50 bg-black/20" />
      </div>
    </div>
  );
}

