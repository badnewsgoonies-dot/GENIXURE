import React, { useMemo } from 'react';
import { panel, ringNeon, badge, iconBtn } from '../../theme/legacyTheme';
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
  rarity?: string;
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

function chipsFrom(text?: string, explicit?: string): string[] {
  const chips: string[] = [];
  if (explicit) chips.push(explicit);
  const t = (text || '').toLowerCase();
  if (/battle\s*start/.test(t)) chips.push('Start');
  if (/turn\s*start/.test(t)) chips.push('Turn');
  if (/turn\s*end/.test(t)) chips.push('Turn End');
  if (/on\s*hit/.test(t)) chips.push('On Hit');
  if (/wound/.test(t)) chips.push('Wounded');
  if (/exposed/.test(t)) chips.push('Exposed');
  if (/countdown/.test(t)) chips.push('Countdown');
  if (/symphony/.test(t)) chips.push('Symphony');
  return Array.from(new Set(chips));
}

export default function ItemCard({
  name,
  slug,
  keyPath,
  tags,
  trigger,
  text,
  stats = {},
  rarity,
  onAdd,
  onInfo,
}: ItemCardProps) {
  const { add } = useLoadout();
  const chips = useMemo(() => chipsFrom(text, trigger), [text, trigger]);
  return (
    <div className={`${panel} ${ringByRarity(rarity)} p-0`}>      
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <Sprite slug={slug} keyPath={keyPath} size={20} />
          <div className="truncate text-[13px] font-semibold leading-4">{name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button title="Edit" className={iconBtn}>✎</button>
          <button title="More" className={iconBtn}>⋯</button>
          <button title="Info" onClick={onInfo} className={iconBtn}>i</button>
          <button title="Add" onClick={onAdd || (()=> add({ key: keyPath || slug, slug, name }))} className={iconBtn}>+</button>
        </div>
      </div>
      <div className="-mt-0.5 truncate px-2 text-[10px] leading-4 text-muted">{keyPath || slug}</div>

      {/* Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 px-2 pb-1 pt-0.5">
          {chips.map((c) => (
            <span key={c} className="rounded bg-amber-500/10 px-1.5 py-[1px] text-[10px] leading-4 text-amber-300">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Effect text */}
      {text && (
        <div className="mx-2 mb-2 rounded-md bg-black/60 px-2 py-1 text-[12px] leading-[1.2] text-neutral-300">
          {text}
        </div>
      )}

      {/* Footer: stats + tags */}
      <div className="flex items-center justify-between border-t border-border/60 px-2 py-1">
        <div className="flex flex-wrap items-center gap-1">
          <StatPill icon="/assets/attack.png" label="ATK" value={stats.ATK ?? 0} />
          <StatPill icon="/assets/armor.png" label="ARM" value={stats.ARM ?? 0} />
          <StatPill icon="/assets/health.png" label="HP" value={stats.HP ?? 0} />
          <StatPill icon="/assets/speed.png" label="SPD" value={stats.SPD ?? 0} />
        </div>
        <div className="flex items-center gap-1">
          {tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded bg-black/40 px-1.5 py-[2px] text-[10px] leading-4 text-muted">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: number }) {
  const dim = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-[1px] text-[10px] leading-4 ${
        dim ? 'opacity-60' : ''
      }`}
    >
      <img src={icon} alt={label} className="h-3 w-3" style={{ imageRendering: 'pixelated' }} />
      <span>
        {label}:{value}
      </span>
    </span>
  );
}
