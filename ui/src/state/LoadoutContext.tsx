import React, { createContext, useContext, useMemo, useState } from 'react';

export type Side = 'player' | 'opponent';
export type LoadoutItem = { key: string; slug: string; name: string; rarity?: string };

type Ctx = {
  activeSide: Side;
  setActiveSide: (s: Side) => void;
  capacity: number;
  player: LoadoutItem[];
  opponent: LoadoutItem[];
  add: (item: LoadoutItem, side?: Side) => void;
  remove: (key: string, side?: Side) => void;
  clear: (side?: Side) => void;
};

const LoadoutContext = createContext<Ctx | null>(null);

export function LoadoutProvider({ children }: { children: React.ReactNode }) {
  const [activeSide, setActiveSide] = useState<Side>('player');
  const [player, setPlayer] = useState<LoadoutItem[]>([]);
  const [opponent, setOpponent] = useState<LoadoutItem[]>([]);
  const capacity = 12;

  const add = (item: LoadoutItem, side?: Side) => {
    const s = side || activeSide;
    const list = s === 'player' ? player : opponent;
    if (list.find((x) => x.key === item.key)) return; // dedupe by key
    if (list.length >= capacity) return;
    const next = [...list, item];
    (s === 'player' ? setPlayer : setOpponent)(next);
  };
  const remove = (key: string, side?: Side) => {
    const s = side || activeSide;
    const list = s === 'player' ? player : opponent;
    const next = list.filter((x) => x.key !== key);
    (s === 'player' ? setPlayer : setOpponent)(next);
  };
  const clear = (side?: Side) => {
    const s = side || activeSide;
    (s === 'player' ? setPlayer : setOpponent)([]);
  };

  const value = useMemo(
    () => ({ activeSide, setActiveSide, capacity, player, opponent, add, remove, clear }),
    [activeSide, player, opponent]
  );
  return <LoadoutContext.Provider value={value}>{children}</LoadoutContext.Provider>;
}

export const useLoadout = () => {
  const ctx = useContext(LoadoutContext);
  if (!ctx) throw new Error('useLoadout must be used within LoadoutProvider');
  return ctx;
};

