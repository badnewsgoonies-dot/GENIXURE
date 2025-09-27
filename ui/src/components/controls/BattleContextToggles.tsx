import React from 'react';
import { useSim } from '../../state/SimContext';

export default function BattleContextToggles() {
  const { flags, setFlags } = useSim();
  const Row: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
    label,
    checked,
    onChange,
  }) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-emerald-500"
      />
      <span>{label}</span>
    </label>
  );
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-4">
        <Row label="Boss Battle" checked={flags.isBossBattle} onChange={(v) => setFlags({ isBossBattle: v })} />
        <Row
          label="First Battle of Run"
          checked={flags.isFirstBattleOfRun}
          onChange={(v) => setFlags({ isFirstBattleOfRun: v })}
        />
        <Row
          label="Enable First-time Effects"
          checked={flags.enableFirstTimeEffects}
          onChange={(v) => setFlags({ enableFirstTimeEffects: v })}
        />
      </div>
    </div>
  );
}

