import React, { PropsWithChildren } from 'react';
import LeftSidebar from './LeftSidebar';
import RightTray from './RightTray';

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto grid h-[calc(100vh-56px)] max-w-[1600px] grid-cols-[280px_minmax(0,1fr)_320px] gap-3 p-3">
      <aside className="overflow-hidden">
        <LeftSidebar />
      </aside>
      <main className="overflow-hidden">{children}</main>
      <aside className="overflow-hidden">
        <RightTray />
      </aside>
    </div>
  );
}

