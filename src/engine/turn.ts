import type {
  GameState, Unit, Scenario, BattleEvent, Pos, Side, Formation, Tile,
} from './types';
import { posEq } from './types';
import { chebyshev } from './grid';
import { legalMoves } from './movement';
import { resolveAttack } from './combat';
import { applyPatch } from './patch';
import { COALITION, isOnActiveSide, sameTeam } from './sides';

function nextSide(current: Side, units: Unit[]): Side {
  if (current === 'french') {
    for (const s of COALITION) {
      if (units.some(u => u.side === s)) return s;
    }
    return 'french';
  }
  return 'french';
}

// Both coalition sides act together in one combined turn.
const canAct = isOnActiveSide;
const areSameTeam = sameTeam;

export function beginBattle(
  scenario: Scenario,
  takenDecisions: GameState['decisionsTaken'] = [],
): GameState {
  let s = scenario;
  if (s.preBattleDecision) {
    const taken = takenDecisions.find(d => d.decisionId === s.preBattleDecision!.id);
    if (taken) {
      s = applyPatch(s, s.preBattleDecision.options[taken.optionIndex].patch);
    }
  }
  return {
    schemaVersion: 1,
    campaignId: 'ulm-austerlitz-1805',
    scenarioIndex: 0,
    scenarioId: s.id,
    units: s.units.map(u => ({ ...u })),
    currentSide: 'french',
    turn: 1,
    phase: 'orders',
    selectedUnitId: null,
    log: [{ kind: 'turn-started', turn: 1, side: 'french' }],
    decisionsTaken: takenDecisions,
    outcomes: [],
    pendingDecisionId: null,
  };
}

export function applyDecisionToScenario(
  scenario: Scenario,
  state: GameState,
  optionIndex: number,
): { scenario: Scenario; state: GameState } {
  const decision = scenario.preBattleDecision;
  if (!decision) return { scenario, state };
  if (state.decisionsTaken.some(d => d.decisionId === decision.id)) {
    return { scenario, state };
  }
  const opt = decision.options[optionIndex];
  if (!opt) throw new Error(`Decision option ${optionIndex} out of range`);
  const patched = applyPatch(scenario, opt.patch);
  const newState: GameState = {
    ...state,
    decisionsTaken: [...state.decisionsTaken, { decisionId: decision.id, optionIndex }],
  };
  return { scenario: patched, state: newState };
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
  if (!canAct(unit.side, state.currentSide)) throw new Error(`${unitId} is not your unit this turn`);
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
  if (!canAct(a.side, state.currentSide)) throw new Error(`${attackerId} is not your unit`);
  if (areSameTeam(a.side, d.side)) throw new Error(`Cannot attack a friendly unit`);
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
  if (!canAct(unit.side, state.currentSide)) throw new Error(`Not your unit`);
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
  const isNewRound = ns === 'french';
  const newTurn = isNewRound ? state.turn + 1 : state.turn;
  const cleared = state.units.map(u => {
    const reset = ns === 'french' ? u.side === 'french' : COALITION.includes(u.side);
    return reset ? { ...u, hasMoved: false as const, hasActed: false as const } : u;
  });
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

export { checkVictory } from './victory';
