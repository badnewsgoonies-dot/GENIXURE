import { useMemo, useState } from 'react';
import EventLogList, { SideFilter } from '../components/battle/EventLogList';
import LogToolbar from '../components/battle/LogToolbar';
import SideLogHeader from '../components/battle/SideLogHeader';
import StatusPanel from '../components/battle/StatusPanel';
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
          <StatusPanel
            side="player"
            accent="green"
            topIcons={[
              { key: 'freeze', className: 'h-4 w-4 rounded bg-sky-400' },
              { key: 'shock', className: 'h-4 w-4 rounded bg-indigo-400' },
              { key: 'sun', className: 'h-4 w-4 rounded bg-amber-300' },
              { key: 'fire', className: 'h-4 w-4 rounded bg-orange-500' },
              { key: 'water', className: 'h-4 w-4 rounded bg-cyan-400' },
              { key: 'storm', className: 'h-4 w-4 rounded bg-violet-400' },
              { key: 'lifeblood', className: 'h-4 w-4 rounded bg-rose-300' },
              { key: 'wind', className: 'h-4 w-4 rounded bg-emerald-300' },
            ]}
            stats={[
              { key: 'hp', value: 25, label: 'HP' },
              { key: 'arm', value: 0, label: 'Armor' },
              { key: 'atk', value: 0, label: 'Attack' },
              { key: 'spd', value: 0, label: 'Speed' },
            ]}
            sprite={<div className="h-24 w-24 rounded bg-emerald-900/30" />}
          />

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
          <StatusPanel
            side="enemy"
            accent="red"
            topIcons={[
              { key: 'freeze', className: 'h-4 w-4 rounded bg-sky-400' },
              { key: 'shock', className: 'h-4 w-4 rounded bg-indigo-400' },
              { key: 'sun', className: 'h-4 w-4 rounded bg-amber-300' },
              { key: 'fire', className: 'h-4 w-4 rounded bg-orange-500' },
              { key: 'water', className: 'h-4 w-4 rounded bg-cyan-400' },
              { key: 'storm', className: 'h-4 w-4 rounded bg-violet-400' },
              { key: 'lifeblood', className: 'h-4 w-4 rounded bg-rose-300' },
              { key: 'wind', className: 'h-4 w-4 rounded bg-emerald-300' },
            ]}
            stats={[
              { key: 'hp', value: 25, label: 'HP' },
              { key: 'arm', value: 0, label: 'Armor' },
              { key: 'atk', value: 0, label: 'Attack' },
              { key: 'spd', value: 0, label: 'Speed' },
            ]}
            sprite={<div className="h-24 w-24 rounded bg-rose-900/30" />}
          />

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
