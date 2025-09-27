import { useMemo, useState } from 'react';
import EventLogList, { SideFilter } from '../components/battle/EventLogList';
import LogToolbar from '../components/battle/LogToolbar';
import SideLogHeader from '../components/battle/SideLogHeader';
import type { BattleEvent } from '../types/battle';

// TEMP: sample events to visualize layout.
const sampleEvents: BattleEvent[] = [
  { id: 't1', turn: 1, t: 1, kind: 'turn',   actor: 'player', text: '-- Turn 1 -- Player' },
  { id: 'a1', turn: 1, t: 2, kind: 'attack', actor: 'player', target: 'enemy', text: 'Player hits Opponent for 11', dmg: 11 },
  { id: 'h1', turn: 1, t: 3, kind: 'heal',   actor: 'player', target: 'player', text: 'Player restores 0 health' },
  { id: 'b1', turn: 1, t: 4, kind: 'buff',   actor: 'player', target: 'player', text: 'Player gains 5 armor', armor: 5 },
  { id: 't2', turn: 1, t: 5, kind: 'turn',   actor: 'enemy', text: '-- Turn 1 -- Opponent' },
  { id: 'a2', turn: 1, t: 6, kind: 'attack', actor: 'enemy', target: 'player', text: 'Opponent hits Player for 9', dmg: 9 },
  { id: 'i1', turn: 1, t: 7, kind: 'info',   actor: 'enemy', text: 'Noise: calculation detail' },
];

export default function SimulationPage() {
  const [hideNoise, setHideNoise] = useState(false);
  const [playerScope, setPlayerScope] = useState<SideFilter>('all');
  const [enemyScope, setEnemyScope] = useState<SideFilter>('all');

  // in real app this would be the sim output
  const events = useMemo(() => sampleEvents, []);

  return (
    <div className="space-y-3 p-3">
      {/* Toolbar */}
      <LogToolbar hideNoise={hideNoise} setHideNoise={setHideNoise} />

      {/* Master source log */}
      <EventLogList
        title="EVENT LOG"
        events={events}
        hideNoise={hideNoise}
        className="border-emerald-900/60 bg-emerald-900/10"
      />

      {/* Two columns: status + scoped logs */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* LEFT = Player */}
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="mb-2 text-sm font-semibold">Current Status</div>
            <div className="grid grid-cols-6 gap-2 text-xs text-muted">
              <div className="rounded border border-border p-2">HP 25</div>
              <div className="rounded border border-border p-2">ARM 0</div>
              <div className="rounded border border-border p-2">ATK 0</div>
              <div className="rounded border border-border p-2">SPD 0</div>
              <div className="rounded border border-border p-2">…</div>
              <div className="rounded border border-border p-2">…</div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-black/60">
            <SideLogHeader side="player" sideFilter={playerScope} setSideFilter={setPlayerScope} />
            <EventLogList
              events={events}
              showHeader={false}
              hideNoise={hideNoise}
              sideScope="player"
              sideFilter={playerScope}
              className="border-emerald-800/50 bg-emerald-900/5"
            />
          </div>
        </div>

        {/* RIGHT = Enemy */}
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="mb-2 text-sm font-semibold">Current Status</div>
            <div className="grid grid-cols-6 gap-2 text-xs text-muted">
              <div className="rounded border border-border p-2">HP 25</div>
              <div className="rounded border border-border p-2">ARM 0</div>
              <div className="rounded border border-border p-2">ATK 0</div>
              <div className="rounded border border-border p-2">SPD 0</div>
              <div className="rounded border border-border p-2">…</div>
              <div className="rounded border border-border p-2">…</div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-black/60">
            <SideLogHeader side="enemy" sideFilter={enemyScope} setSideFilter={setEnemyScope} />
            <EventLogList
              events={events}
              showHeader={false}
              hideNoise={hideNoise}
              sideScope="enemy"
              sideFilter={enemyScope}
              className="border-rose-800/50 bg-rose-900/5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

