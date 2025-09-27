import { useState } from 'react';
import BattleContextToggles from '../components/controls/BattleContextToggles';
import { useSim } from '../state/SimContext';
import { simulate } from '../lib/sim';

export default function SimulationPage() {
  const [result, setResult] = useState<any>(null);
  const { flags } = useSim();
  const run = () => {
    try {
      // Minimal shell: call global engine with two tiny fighters
      // This will work only when heic_sim.js is available (it is included in index.html)
      // @ts-expect-error global
      const res = window.HeICSim?.simulate ? window.HeICSim.simulate(
        { name:'Player', stats:{ hp:10, atk:0, armor:0, speed:0 } },
        { name:'Opponent', stats:{ hp:10, atk:0, armor:0, speed:0 } },
        { maxTurns: 1, context: flags }
      ) : null;
      setResult(res);
    } catch (e: any) {
      setResult({ error: e?.message || String(e) });
    }
  };

  return (
    <div className="space-y-3 p-3">
      <BattleContextToggles />
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">Simulation</h2>
        <button onClick={run} className="rounded-md border border-primary bg-black px-3 py-2 text-sm text-primary hover:bg-primary/10">Run sample duel</button>
      </div>
      <pre className="min-h-[160px] rounded border border-border bg-black p-3 text-xs text-muted">
{JSON.stringify(result ?? { info: 'Click Run sample duel' }, null, 2)}
      </pre>
    </div>
  );
}
