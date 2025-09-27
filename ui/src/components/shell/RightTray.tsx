import React from 'react';
import { panel, headerBar, outline } from '../../theme/legacyTheme';

export default function RightTray() {
  return (
    <div className={`${panel} h-full p-2`}>
      <div className={headerBar}>
        <span className="text-xs uppercase tracking-wide text-muted">Loadout Tray</span>
      </div>

      <div className="space-y-2">
        <Box title="Player Items">
          <Slot label="Leather Whip" />
          <Slot label="Royal Helm" />
        </Box>
        <Box title="Opponent Items">
          <Slot label="Blackbriar Armor" />
        </Box>
      </div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-muted">{title}</div>
      <div className={`${outline} min-h-[120px] space-y-1 p-1`}>{children}</div>
    </div>
  );
}

function Slot({ label }: { label: string }) {
  return (
    <div className="truncate rounded-md border border-border/60 bg-black/50 px-2 py-1 text-xs">{label}</div>
  );
}

