import { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="grid h-full w-full grid-cols-1 bg-background md:grid-cols-[300px_minmax(0,1fr)_300px]">
      <Sidebar side="left" open={leftOpen} onToggle={() => setLeftOpen(v => !v)} />
      <main className="min-h-0 min-w-0 border-x border-border bg-surface">{children}</main>
      <Sidebar side="right" open={rightOpen} onToggle={() => setRightOpen(v => !v)} />
    </div>
  );
}

