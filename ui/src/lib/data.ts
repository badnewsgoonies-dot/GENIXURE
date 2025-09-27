export type HeicStats = { armor?: number; attack?: number; health?: number; speed?: number };
export type HeicItem = {
  key: string;
  name: string;
  slug?: string;
  bucket?: 'items' | 'weapons' | 'sets' | 'upgrades' | string;
  stats?: HeicStats;
  tags?: string[];
  effects?: any[];
  effect?: string;
  rarity?: string;
  tier?: string;
  [extra: string]: any;
};

const base = (path: string) => `${import.meta.env.BASE_URL?.replace(/\/?$/, '/') ?? '/'}${path.replace(/^\//, '')}`;

export async function loadItems(): Promise<HeicItem[]> {
  const fromGlobal = (globalThis as any).HEIC_DETAILS as Record<string, any> | undefined;
  let raw: Record<string, any> | undefined = fromGlobal;

  if (!raw) {
    try {
      const r = await fetch(base('compiled_details.json'), { cache: 'no-store' });
      if (r.ok) raw = await r.json();
    } catch {}
  }

  if (!raw) {
    try {
      const r = await fetch(base('details.json'), { cache: 'no-store' });
      if (r.ok) raw = await r.json();
      try {
        const ro = await fetch(base('stats_overrides.json'), { cache: 'no-store' });
        if (ro.ok && raw) {
          const overrides = await ro.json();
          for (const [k, statObj] of Object.entries(overrides || {})) {
            if (raw[k]) raw[k].stats = { ...(raw[k].stats || {}), ...(statObj as object) };
          }
        }
      } catch {}
    } catch {}
  }

  if (!raw || Object.keys(raw).length === 0) return [];

  const items: HeicItem[] = Object.entries(raw).map(([key, item]) => {
    const bucket = inferBucket(key);
    const slug = item?.slug ?? key.split('/').pop();
    return {
      key,
      name: item?.name ?? 'Unknown',
      slug,
      bucket: item?.bucket ?? bucket,
      stats: {
        armor: item?.stats?.armor ?? 0,
        attack: item?.stats?.attack ?? 0,
        health: item?.stats?.health ?? 0,
        speed: item?.stats?.speed ?? 0,
      },
      tags: Array.isArray(item?.tags) ? item.tags : [],
      effects: Array.isArray(item?.effects) ? item.effects : [],
      effect: item?.effect ?? '',
      rarity: item?.rarity ?? 'Common',
      tier: item?.tier ?? 'base',
      ...item,
    } as HeicItem;
  });

  return items;
}

function inferBucket(key: string) {
  if (key.startsWith('items/')) return 'items';
  if (key.startsWith('weapons/')) return 'weapons';
  if (key.startsWith('sets/')) return 'sets';
  if (key.startsWith('upgrades/')) return 'upgrades';
  return 'items';
}

