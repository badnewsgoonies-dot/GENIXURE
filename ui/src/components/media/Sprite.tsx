import React, { useMemo, useState } from 'react';

export default function Sprite({ slug, keyPath, size = 24 }: { slug?: string; keyPath?: string; size?: number }) {
  const candidates = useMemo(() => {
    const s = slug || '';
    const k = keyPath || '';
    const arr: string[] = [];
    if (k) arr.push(`/${k}/icon.png`);
    if (s) arr.push(`/items/${s}/icon.png`, `/weapons/${s}/icon.png`, `/${s}/icon.png`);
    arr.push('/assets/placeholder.png');
    return arr;
  }, [slug, keyPath]);
  const [idx, setIdx] = useState(0);
  const src = candidates[Math.min(idx, candidates.length - 1)];
  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      onError={() => setIdx((i) => Math.min(i + 1, candidates.length - 1))}
      alt={slug || keyPath || 'icon'}
      className="rounded"
    />
  );
}

