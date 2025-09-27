import React from 'react';
import { panel, headerBar, outline, badge } from '../../theme/legacyTheme';
import { useLoadout } from '../../state/LoadoutContext';

export default function RightTray() {
  const { activeSide, setActiveSide, player, opponent, capacity, remove, clear } = useLoadout();
  return (
    <div className={`${panel} h-full p-2`}>
      <div className={headerBar}>
        <span className="text-xs uppercase tracking-wide text-muted">Loadout Tray</span>
        <div className="flex items-center gap-2">
          <button
            className={`${badge} ${activeSide === 'player' ? 'text-emerald-300 border-emerald-500' : ''}`}
            onClick={() => setActiveSide('player')}
          >
            Player
          </button>
          <button
            className={`${badge} ${activeSide === 'opponent' ? 'text-rose-300 border-rose-500' : ''}`}
            onClick={() => setActiveSide('opponent')}
          >
            Opponent
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Box title={`Player Items (${player.length}/${capacity})`} onClear={() => clear('player')}>
          {player.length === 0 ? (
            <Empty />
          ) : (
            player.map((it) => (
              <Slot key={it.key} label={it.name} onRemove={() => remove(it.key, 'player')} />
            ))
          )}
        </Box>
        <Box title={`Opponent Items (${opponent.length}/${capacity})`} onClear={() => clear('opponent')}>
          {opponent.length === 0 ? (
            <Empty />
          ) : (
            opponent.map((it) => (
              <Slot key={it.key} label={it.name} onRemove={() => remove(it.key, 'opponent')} />
            ))
          )}
        </Box>
      </div>
    </div>
  );
}

function Box({ title, children, onClear }: { title: string; children: React.ReactNode; onClear?: () => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted">{title}</div>
        {onClear && (
          <button onClick={onClear} className={`${badge}`}>Clear</button>
        )}
      </div>
      <div className={`${outline} min-h-[120px] space-y-1 p-1`}>{children}</div>
    </div>
  );
}

function Slot({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-black/50 px-2 py-1 text-xs">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button onClick={onRemove} className={`${badge}`}>×</button>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-md border border-border/40 bg-black/30 px-2 py-3 text-center text-[11px] text-muted">
      Empty
    </div>
  );
}
