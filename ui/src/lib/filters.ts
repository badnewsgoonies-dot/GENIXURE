export type CanonicalTrigger = 'battleStart' | 'turnStart' | 'hit' | 'wounded' | 'exposed' | 'passive' | string;

export function normalizeTrigger(t: any): CanonicalTrigger {
  switch (t) {
    case 'battle_start':
    case 'battleStart':
      return 'battleStart';
    case 'turn_start':
    case 'turnStart':
      return 'turnStart';
    case 'onHit':
    case 'hit':
      return 'hit';
    case 'onWounded':
    case 'wounded':
      return 'wounded';
    case 'onExposed':
    case 'exposed':
      return 'exposed';
    case 'passive':
      return 'passive';
    default:
      return typeof t === 'string' ? t : '';
  }
}

export function inferBuckets(items: { bucket?: string }[]) {
  const counts: Record<string, number> = { all: items.length };
  for (const it of items) {
    const b = it.bucket || 'items';
    counts[b] = (counts[b] || 0) + 1;
  }
  return counts;
}

export function collectTags(items: { tags?: string[] }[]) {
  const map: Record<string, number> = {};
  for (const it of items) {
    for (const tag of it.tags || []) {
      map[tag] = (map[tag] || 0) + 1;
    }
  }
  return map;
}

export function collectTriggers(items: { effects?: any[] }[]) {
  const map: Record<string, number> = {};
  for (const it of items) {
    for (const fx of it.effects || []) {
      const k = normalizeTrigger(fx?.trigger);
      if (!k) continue;
      map[k] = (map[k] || 0) + 1;
    }
  }
  return map;
}

export function filterItems(
  items: any[],
  opts: {
    q?: string;
    buckets?: Set<string>;
    tags?: Set<string>;
    triggers?: Set<string>;
    sets?: Set<string>;
    setSlugMap?: Map<string, string[]>; // setKey -> required slugs
  }
) {
  const { q, buckets, tags, triggers, sets, setSlugMap } = opts;
  const qLower = (q || '').toLowerCase();
  return items.filter((it) => {
    if (qLower) {
      const text = `${it.name} ${it.effect || ''} ${(it.tags || []).join(' ')}`.toLowerCase();
      if (!text.includes(qLower)) return false;
    }
    if (buckets && buckets.size > 0 && !buckets.has('all')) {
      if (!buckets.has(it.bucket || 'items')) return false;
    }
    if (tags && tags.size > 0) {
      const has = (it.tags || []).some((t: string) => tags.has(t));
      if (!has) return false;
    }
    if (triggers && triggers.size > 0) {
      const has = (it.effects || []).some((fx: any) => triggers.has(normalizeTrigger(fx?.trigger)));
      if (!has) return false;
    }
    if (sets && sets.size > 0 && setSlugMap && setSlugMap.size > 0) {
      const allowedSlugs = new Set<string>();
      sets.forEach((k) => (setSlugMap.get(k) || []).forEach((s) => allowedSlugs.add(s)));
      if (!allowedSlugs.has(it.key)) return false;
    }
    return true;
  });
}

