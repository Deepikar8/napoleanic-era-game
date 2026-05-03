import type {
  GameState, Unit, Scenario, BattleEvent, Pos, Side, Formation, Tile,
} from './types';
import { posEq } from './types';
import { chebyshev } from './grid';
import { legalMoves } from './movement';
import { resolveAttack } from './combat';
import { checkVictory } from './victory';

const sideOrder: Side[] = ['french', 'austrian', 'russian'];

function nextSide(current: Side, units: Unit[]): Side {
  const start = sideOrder.indexOf(current);
  for (let i = 1; i <= sideOrder.length; i++) {
    const cand = sideOrder[(start + i) % sideOrder.length];
    if (units.some(u => u.side === cand)) return cand;
  }
  return current;
}

export function beginBattle(scenario: Scenario): GameState {
  return {
    schemaVersion: 1,
    campaignId: 'ulm-austerlitz-1805',
    scenarioIndex: 0,
    scenarioId: scenario.id,
    units: scenario.units.map(u => ({ ...u })),
    currentSide: 'french',
    turn: 1,
    phase: 'orders',
    selectedUnitId: null,
    log: [{ kind: 'turn-started', turn: 1, side: 'french' }],
    decisionsTaken: [],
    outcomes: [],
    pendingDecisionId: null,
  };
}

function facingFromMove(from: Pos, to: Pos, fallback: Unit['facing']): Unit['facing'] {
  if (to.x > from.x) return 'E';
  if (to.x < from.x) return 'W';
  if (to.y > from.y) return 'S';
  if (to.y < from.y) return 'N';
  return fallback;
}

export function moveUnit(
  state: GameState,
  unitId: string,
  to: Pos,
  ctx?: { tiles: Tile[]; grid: { width: number; height: number } },
): { state: GameState; events: BattleEvent[] } {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) throw new Error(`Unit ${unitId} not found`);
  if (unit.side !== state.currentSide) throw new Error(`${unitId} is not your unit this turn`);
  if (unit.hasMoved) throw new Error(`${unitId} already moved this turn`);

  if (ctx) {
    const moves = legalMoves(unit, state.units, { grid: ctx.grid, tiles: ctx.tiles });
    if (!moves.some(m => posEq(m, to))) throw new Error(`Illegal move target`);
  } else {
    if (chebyshev(unit.position, to) > 4) throw new Error(`Illegal move target`);
    if (state.units.some(o => o.id !== unitId && posEq(o.position, to))) {
      throw new Error(`Illegal move target`);
    }
  }

  const updated: Unit[] = state.units.map(u =>
    u.id === unitId
      ? { ...u, position: to, hasMoved: true, facing: facingFromMove(unit.position, to, unit.facing) }
      : u,
  );
  const events: BattleEvent[] = [{
    kind: 'unit-moved', unitId, from: unit.position, to, cost: 1,
  }];
  return {
    state: { ...state, units: updated, log: [...state.log, ...events] },
    events,
  };
}

export function attack(
  state: GameState,
  attackerId: string,
  defenderId: string,
): { state: GameState; events: BattleEvent[] } {
  const a = state.units.find(u => u.id === attackerId);
  const d = state.units.find(u => u.id === defenderId);
  if (!a) throw new Error(`Attacker ${attackerId} not found`);
  if (!d) throw new Error(`Defender ${defenderId} not found`);
  if (a.side !== state.currentSide) throw new Error(`${attackerId} is not your unit`);
  if (a.side === d.side) throw new Error(`Cannot attack a friendly unit`);
  if (a.hasActed) throw new Error(`${attackerId} already acted this turn`);
  if (chebyshev(a.position, d.position) !== 1) throw new Error(`Units not adjacent`);

  const { updatedUnits, events: combatEvents } = resolveAttack(a, d, state.units, []);
  const finalUnits = updatedUnits.map(u =>
    u.id === attackerId ? { ...u, hasActed: true } : u,
  );

  return {
    state: { ...state, units: finalUnits, log: [...state.log, ...combatEvents] },
    events: combatEvents,
  };
}

export function changeFormation(
  state: GameState, unitId: string, to: Formation,
): { state: GameState; events: BattleEvent[] } {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) throw new Error(`Unit ${unitId} not found`);
  if (unit.side !== state.currentSide) throw new Error(`Not your unit`);
  if (unit.hasActed) throw new Error(`Already acted this turn`);
  if (unit.formation === to) return { state, events: [] };

  const events: BattleEvent[] = [{
    kind: 'formation-changed', unitId, from: unit.formation, to,
  }];
  const updated = state.units.map(u =>
    u.id === unitId ? { ...u, formation: to, hasActed: true } : u,
  );
  return {
    state: { ...state, units: updated, log: [...state.log, ...events] },
    events,
  };
}

export function endTurn(state: GameState): { state: GameState; events: BattleEvent[] } {
  const events: BattleEvent[] = [{ kind: 'turn-ended', turn: state.turn, side: state.currentSide }];
  const ns = nextSide(state.currentSide, state.units);
  const isNewRound = sideOrder.indexOf(ns) <= sideOrder.indexOf(state.currentSide);
  const newTurn = isNewRound ? state.turn + 1 : state.turn;
  const cleared = state.units.map(u =>
    u.side === ns ? { ...u, hasMoved: false as const, hasActed: false as const } : u,
  );
  events.push({ kind: 'turn-started', turn: newTurn, side: ns });
  return {
    state: {
      ...state,
      units: cleared,
      currentSide: ns,
      turn: newTurn,
      phase: 'orders',
      selectedUnitId: null,
      log: [...state.log, ...events],
    },
    events,
  };
}

export { checkVictory };
