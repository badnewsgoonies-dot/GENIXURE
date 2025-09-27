export type SimInput = any; // placeholder until we wire proper types
export type SimResult = any;

export function simulate(input: SimInput): SimResult {
  // @ts-expect-error global engine until we ESM-ify it
  return window.HeICSim?.simulate ? window.HeICSim.simulate(input) : null;
}

