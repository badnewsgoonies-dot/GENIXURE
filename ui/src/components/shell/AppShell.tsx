import React, { PropsWithChildren } from 'react';

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto min-h-[calc(100vh-56px)] max-w-[1600px] p-3">{children}</div>
  );
}
