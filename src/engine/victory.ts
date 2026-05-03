import type { GameState, VictoryCondition, VictoryStatus, Side, Pos } from './types';
import { posEq } from './types';

const totalStrength = (state: GameState, side: Side) =>
  state.units.filter(u => u.side === side).reduce((s, u) => s + u.strength, 0);

const condMet = (state: GameState, c: VictoryCondition): { met: boolean; reason: string } => {
  switch (c.kind) {
    case 'eliminate-unit': {
      const id = c.args.unitId as string;
      return { met: !state.units.some(u => u.id === id), reason: `eliminated ${id}` };
    }
    case 'reduce-side-strength': {
      const side = c.args.side as Side;
      const threshold = c.args.threshold as number;
      return {
        met: totalStrength(state, side) < threshold,
        reason: `${side} reduced below ${threshold}`,
      };
    }
    case 'survive-turns': {
      const turns = c.args.turns as number;
      return { met: state.turn >= turns, reason: `survived to turn ${turns}` };
    }
    case 'capture-tile': {
      const pos = c.args.pos as Pos;
      return {
        met: state.units.some(u => u.side === c.for && posEq(u.position, pos)),
        reason: `captured (${pos.x},${pos.y})`,
      };
    }
    case 'hold-tile-for-turns': {
      const pos = c.args.pos as Pos;
      const turns = c.args.turns as number;
      const standing = state.units.some(u => u.side === c.for && posEq(u.position, pos));
      return { met: standing && state.turn >= turns, reason: `held tile for ${turns} turns` };
    }
  }
};

export function checkVictory(state: GameState, conds: VictoryCondition[]): VictoryStatus {
  for (const c of conds) {
    const { met, reason } = condMet(state, c);
    if (met) return { kind: 'decided', victor: c.for, reason };
  }
  return { kind: 'in-progress' };
}
