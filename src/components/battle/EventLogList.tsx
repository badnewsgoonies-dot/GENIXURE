import { useMemo } from 'react';
import type { BattleEvent, Side } from '../../types/battle';

export type NoiseLevel = 'all' | 'no-noise';
export type SideFilter = 'all' | 'outgoing' | 'incoming';

function bulletColor(e: BattleEvent) {
  switch (e.kind) {
    case 'attack': return 'bg-green-500';
    case 'heal':   return 'bg-emerald-400';
    case 'buff':   return 'bg-sky-400';
    case 'debuff': return 'bg-amber-400';
    case 'turn':   return 'bg-pink-500';
    default:       return 'bg-zinc-500';
  }
}

function isNoise(e: BattleEvent) {
  // tune this as you like
  return e.kind === 'info';
}

export default function EventLogList({
  title,
  events,
  className,
  showHeader = true,
  hideNoise = false,
  sideScope,     // if set, render only events relevant to that side
  sideFilter = 'all',
}: {
  title?: string;
  events: BattleEvent[];
  className?: string;
  showHeader?: boolean;
  hideNoise?: boolean;
  sideScope?: Side;                 // 'player' | 'enemy' | undefined (master log)
  sideFilter?: SideFilter;          // 'all' | 'outgoing' | 'incoming'
}) {
  const filtered = useMemo(() => {
    let list = events;
    if (hideNoise) list = list.filter(e => !isNoise(e));
    if (sideScope) {
      // Events involving that side: actor === side OR target === side
      list = list.filter(e => e.actor === sideScope || e.target === sideScope);
      if (sideFilter === 'outgoing') list = list.filter(e => e.actor === sideScope);
      if (sideFilter === 'incoming') list = list.filter(e => e.target === sideScope);
    }
    return list;
  }, [events, hideNoise, sideScope, sideFilter]);

  return (
    <div className={`rounded-lg border border-border bg-black/60 ${className ?? ''}`}>
      {showHeader && (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold tracking-wide">{title ?? 'EVENT LOG'}</h3>
          <div className="text-xs text-muted">
            {filtered.length} events
          </div>
        </div>
      )}

      <div className="max-h-[280px] overflow-auto p-2">
        {filtered.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted">No events</div>
        )}

        <ul className="space-y-1">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="group flex items-start gap-2 rounded-md px-2 py-1 hover:bg-white/5"
            >
              <span className={`mt-1 h-2 w-2 rounded ${bulletColor(e)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>Turn {e.turn}</span>
                  <span>•</span>
                  <span>T{e.t}</span>
                  {e.actor && (
                    <>
                      <span>•</span>
                      <span className={`${e.actor === 'player' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {e.actor.toUpperCase()}
                      </span>
                    </>
                  )}
                </div>
                <div className="truncate text-sm">
                  {e.text}
                  {typeof e.dmg === 'number' && (
                    <span className="ml-2 text-emerald-300">{e.dmg > 0 ? `+${e.dmg}` : e.dmg}</span>
                  )}
                  {typeof e.armor === 'number' && (
                    <span className="ml-2 text-sky-300">{e.armor > 0 ? `+${e.armor} armor` : `${e.armor} armor`}</span>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-muted">[{e.actor?.[0] ?? '-'}:{e.target?.[0] ?? '-'}]</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

