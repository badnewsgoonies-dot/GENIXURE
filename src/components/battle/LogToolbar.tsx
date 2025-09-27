export default function LogToolbar({
  hideNoise,
  setHideNoise,
}: {
  hideNoise: boolean;
  setHideNoise: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-black/70 px-3 py-2">
      <div className="flex items-center gap-2">
        <label className="inline-flex select-none items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="accent-primary"
            checked={hideNoise}
            onChange={(e) => setHideNoise(e.target.checked)}
          />
          Hide noise
        </label>

        <div className="ml-3 flex items-center overflow-hidden rounded-md border border-border">
          <button className="px-2 py-1 hover:bg-white/5">{'<<'}</button>
          <button className="border-l border-border px-2 py-1 hover:bg-white/5">{'<'}</button>
          <button className="border-l border-border px-2 py-1 hover:bg-white/5">{'>'}</button>
          <button className="border-l border-border px-2 py-1 hover:bg-white/5">{'>>'}</button>
        </div>

        <div className="ml-3 flex items-center gap-2 text-xs text-muted">
          <span>Turn</span>
          <span className="rounded border border-border px-2 py-0.5 text-text">1 / 5</span>
          <span>•</span>
          <span>Speed</span>
          <span className="rounded border border-border px-2 py-0.5 text-text">1x</span>
        </div>
      </div>

      <button className="rounded-md border border-emerald-500 bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30">
        START BATTLE
      </button>
    </div>
  );
}

