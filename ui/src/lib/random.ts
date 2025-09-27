import type { HeicItem } from './data';

function pick<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

export type RandomBuild = { weapon?: HeicItem; items: HeicItem[] };

export function randomBuild(all: HeicItem[], opts?: { itemCount?: number }): RandomBuild {
  const itemCount = Math.max(1, opts?.itemCount ?? 12);
  const weapons = all.filter((i) => i.bucket === 'weapons');
  const items = all.filter((i) => i.bucket === 'items');
  const resultItems: HeicItem[] = [];
  const pool = [...items];
  while (resultItems.length < Math.min(itemCount, pool.length)) {
    const it = pick(pool)!;
    resultItems.push(it);
    const idx = pool.indexOf(it);
    if (idx >= 0) pool.splice(idx, 1);
  }
  return { weapon: pick(weapons), items: resultItems };
}

