import { createContext, useContext, useId, useState } from 'react';

type Ctx = { value: string; setValue: (v: string) => void; id: string };
const TabsCtx = createContext<Ctx | null>(null);

export function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [value, setValue] = useState(defaultValue);
  const id = useId();
  return <TabsCtx.Provider value={{ value, setValue, id }}><div className={className}>{children}</div></TabsCtx.Provider>;
}

export function TabList({ children, ariaLabel }: { children: React.ReactNode; ariaLabel?: string }) {
  return <div role="tablist" aria-label={ariaLabel} className="mb-3 flex gap-2">{children}</div>;
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsCtx)!;
  const selected = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      aria-controls={`${ctx.id}-${value}`}
      onClick={() => ctx.setValue(value)}
      className={`rounded-lg border px-3 py-2 text-sm transition
        ${selected ? 'border-primary bg-black text-text' : 'border-border text-muted hover:border-primary hover:text-text'}`}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsCtx)!;
  const selected = ctx.value === value;
  return (
    <div id={`${ctx.id}-${value}`} role="tabpanel" hidden={!selected} className="min-h-[200px]">
      {selected && children}
    </div>
  );
}

