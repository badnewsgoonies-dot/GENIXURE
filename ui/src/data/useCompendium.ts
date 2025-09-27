import { useEffect, useMemo, useState } from 'react';

export type CompendiumItem = {
  name: string;
  slug: string;
  key: string;
  tags: string[];
  stats?: { ATK?: number; ARM?: number; HP?: number; SPD?: number };
  text?: string;
  trigger?: string;
};

export default function useCompendium() {
  const [raw, setRaw] = useState<Record<string, any> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch('/details.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setRaw)
      .catch((e) => setErr(e?.message || 'load failed'));
  }, []);

  const items: CompendiumItem[] = useMemo(() => {
    if (!raw) return [];
    const out: CompendiumItem[] = [];
    for (const [key, v] of Object.entries(raw)) {
      const slug = (v as any)?.slug ?? String(key).split('/').pop() ?? String(key);
      const statsIn = (v as any)?.stats || {};
      out.push({
        key,
        slug,
        name: (v as any)?.name || slug,
        tags: Array.isArray((v as any)?.tags) ? (v as any).tags : [],
        text: (v as any)?.effect || (v as any)?.desc || '',
        trigger: (v as any)?.trigger || undefined,
        stats: {
          ATK: statsIn.attack || 0,
          ARM: statsIn.armor || 0,
          HP: statsIn.health || 0,
          SPD: statsIn.speed || 0,
        },
      });
    }
    return out;
  }, [raw]);

  return { items, error: err };
}

