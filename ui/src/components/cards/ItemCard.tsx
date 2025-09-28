import React from 'react';
import { panel, ringNeon, badge } from '../../theme/legacyTheme';
import Sprite from '../media/Sprite';
import { useLoadout } from '../../state/LoadoutContext';

export type ItemCardProps = {
  name: string;
  slug: string;
  keyPath?: string;
  tags: string[];
  trigger?: string;
  text?: string;
  stats?: { ATK?: number; ARM?: number; HP?: number; SPD?: number };
  onAdd?: () => void;
  onInfo?: () => void;
};

function ringByRarity(r?: string) {
  const t = (r || '').toLowerCase();
  if (t.includes('myth')) return ringNeon.green;
  if (t.includes('hero') || t.includes('epic')) return ringNeon.violet;
  if (t.includes('rare')) return ringNeon.amber;
  return ringNeon.red;
}

export default function ItemCard({
  name,
  slug,
  keyPath,
  tags,
  trigger,
  text,
  stats = {},
  onAdd,
  onInfo,
}: ItemCardProps) {
  const { add } = useLoadout();
  return (
    <div className={`${panel} ${ringByRarity((stats as any)?.rarity)} p-2`}>
      {/* Title row */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprite slug={slug} keyPath={keyPath} size={24} />
          <div className="truncate text-sm font-semibold">{name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onInfo} className={`${badge}`}>i</button>
          <button onClick={onAdd || (()=> add({ key: slug, slug, name }))} className={`${badge}`}>+</button>
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
