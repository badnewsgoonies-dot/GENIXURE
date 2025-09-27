import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

export type BattleContextFlags = {
  isBossBattle: boolean;
  isFirstBattleOfRun: boolean;
  enableFirstTimeEffects: boolean;
};

const defaultFlags: BattleContextFlags = {
  isBossBattle: false,
  isFirstBattleOfRun: false,
  enableFirstTimeEffects: true,
};

const SimContext = createContext<{
  flags: BattleContextFlags;
  setFlags: (next: Partial<BattleContextFlags>) => void;
}>({ flags: defaultFlags, setFlags: () => {} });

export function SimProvider({ children }: PropsWithChildren<{}>) {
  const [flags, setFlagsState] = useState<BattleContextFlags>(defaultFlags);
  const setFlags = (next: Partial<BattleContextFlags>) =>
    setFlagsState((prev) => ({ ...prev, ...next }));
  return <SimContext.Provider value={{ flags, setFlags }}>{children}</SimContext.Provider>;
}

export const useSim = () => useContext(SimContext);

