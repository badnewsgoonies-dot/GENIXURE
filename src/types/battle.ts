export type Side = 'player' | 'enemy';

export type EventKind =
  | 'attack'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'turn'
  | 'info';

export type BattleEvent = {
  id: string;
  turn: number;
  t: number; // timeline tick/frame
  kind: EventKind;
  actor: Side; // who performed the action (if applicable)
  target?: Side; // who was targeted/affected
  text: string; // human-readable
  dmg?: number; // +/- hp delta
  armor?: number; // +/- armor delta
  meta?: Record<string, any>;
};

