import React from 'react';
import { panel, ringNeon, badge } from '../../theme/legacyTheme';

export type ItemCardProps = {
  name: string;
  slug: string;
  tags: string[];
  trigger?: string;
  text?: string;
  stats?: { ATK?: number; ARM?: number; HP?: number; SPD?: number };
  onAdd?: () => void;
  onInfo?: () => void;
};

export default function ItemCard({
  name,
  slug,
  tags,
  trigger,
  text,
  stats = {},
  onAdd,
  onInfo,
}: ItemCardProps) {
  return (
    <div className={`${panel} ${ringNeon.red} p-2`}>
      {/* Title row */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-white/10" aria-label={slug} />
          <div className="truncate text-sm font-semibold">{name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onInfo} className={`${badge}`}>i</button>
          <button onClick={onAdd} className={`${badge}`}>+</nbutton>
        </div>
      </div>

      {/* Trigger + text */}
      <div className="mb-2 space-x-2 text-xs leading-snug">
        {trigger && (
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">{trigger}</span>
        )}
        {text && <span className="text-muted">{text}</span>}
      </div>

      {/* Footer: stats + tags */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Object.entries(stats).map(([k, v]) => (
            <span key={k} className={`${badge}`}>
              {k}:{v}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-muted">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

