import type { GameState, VictoryCondition, VictoryStatus, Side, Pos } from './types';
import { posEq } from './types';
import { COALITION } from './sides';

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
      // Fires only after BOTH sides have completed turn N (i.e., we're at the
      // start of turn N+1). Otherwise the surviving side could win by ending
      // their final turn before the opposing side gets its last action.
      return { met: state.turn > turns, reason: `survived to turn ${turns}` };
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
      // Fires only after the opposing side has had its turn N action — i.e.,
      // we're at the start of turn N+1 and the side still has a unit on the
      // tile after the counter-attack. Otherwise the holder could just step
      // on at the end of their turn N and win before being challenged.
      return { met: standing && state.turn > turns, reason: `held tile for ${turns} turns` };
    }
    case 'all-of': {
      const subs = c.args.conditions as VictoryCondition[];
      const results = subs.map(s => condMet(state, s));
      const allMet = results.every(r => r.met);
      const reason = allMet
        ? results.map(r => r.reason).join(' + ')
        : `${results.filter(r => r.met).length}/${subs.length} sub-conditions met`;
      return { met: allMet, reason };
    }
  }
};

export function checkVictory(state: GameState, conds: VictoryCondition[]): VictoryStatus {
  // Explicit scenario conditions take priority — a named goal like
  // 'eliminate Dupont' or 'capture the heights' should be the recorded reason.
  for (const c of conds) {
    const { met, reason } = condMet(state, c);
    if (met) return { kind: 'decided', victor: c.for, reason };
  }
  // Fallback: total elimination of one team. Without this, the game would
  // sit forever after the kid wipes out the entire opposing side mid-battle —
  // because no specific condition (eliminate-X, capture-Y, survive-N) had
  // fired yet.
  const frenchUnits = state.units.filter(u => u.side === 'french');
  const coalitionUnits = state.units.filter(u => (COALITION as readonly Side[]).includes(u.side));
  if (frenchUnits.length === 0 && coalitionUnits.length > 0) {
    return {
      kind: 'decided',
      victor: coalitionUnits[0].side,
      reason: 'French army destroyed',
    };
  }
  if (coalitionUnits.length === 0 && frenchUnits.length > 0) {
    return { kind: 'decided', victor: 'french', reason: 'Coalition army destroyed' };
  }
  return { kind: 'in-progress' };
}

export interface ConditionSummary {
  for: Side;
  label: string;
  met: boolean;
}

/** Human-readable per-condition progress for use in the battle UI. */
export function summarizeVictory(
  state: GameState,
  conds: VictoryCondition[],
): ConditionSummary[] {
  return conds.map(c => {
    const { met } = condMet(state, c);
    return { for: c.for, label: labelFor(state, c, met), met };
  });
}

function labelFor(state: GameState, c: VictoryCondition, met: boolean): string {
  // Custom label override applies to any kind. For all-of we still annotate
  // the progress count; for others we fall through to the generated suffix.
  if (c.kind === 'all-of') {
    const subs = c.args.conditions as VictoryCondition[];
    const metCount = subs.filter(s => condMet(state, s).met).length;
    const name = c.label ?? `Combined goal`;
    return met ? `${name} ✓` : `${name} (${metCount}/${subs.length})`;
  }
  if (c.label) {
    return met ? `${c.label} ✓` : c.label;
  }
  switch (c.kind) {
    case 'eliminate-unit': {
      const id = c.args.unitId as string;
      const unit = state.units.find(u => u.id === id);
      const name = unit?.name ?? id;
      return met ? `Eliminate ${name} ✓` : `Eliminate ${name}`;
    }
    case 'reduce-side-strength': {
      const side = c.args.side as Side;
      const threshold = c.args.threshold as number;
      const total = state.units.filter(u => u.side === side).reduce((s, u) => s + u.strength, 0);
      return met
        ? `Reduce ${side} to <${threshold} ✓`
        : `Reduce ${side} to <${threshold} (now ${total})`;
    }
    case 'survive-turns': {
      const turns = c.args.turns as number;
      return met
        ? `Survive to turn ${turns} ✓`
        : `Survive to turn ${turns} (turn ${state.turn}/${turns})`;
    }
    case 'capture-tile': {
      const pos = c.args.pos as { x: number; y: number };
      return met
        ? `Capture (${pos.x},${pos.y}) ✓`
        : `Capture (${pos.x},${pos.y})`;
    }
    case 'hold-tile-for-turns': {
      const pos = c.args.pos as { x: number; y: number };
      const turns = c.args.turns as number;
      return met
        ? `Hold (${pos.x},${pos.y}) ${turns} turns ✓`
        : `Hold (${pos.x},${pos.y}) until turn ${turns} (turn ${state.turn}/${turns})`;
    }
  }
}
