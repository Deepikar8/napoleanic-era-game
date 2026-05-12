import type {
  Cohesion, GameState, Scenario, BattleEvent, Unit, Pos, Strength,
} from './types';
import { beginBattle } from './turn';
import { COALITION } from './sides';
import { applyPatchToState } from './triggers';

const facingFromMove = (from: Pos, to: Pos, fallback: Unit['facing']): Unit['facing'] => {
  if (to.x > from.x) return 'E';
  if (to.x < from.x) return 'W';
  if (to.y > from.y) return 'S';
  if (to.y < from.y) return 'N';
  return fallback;
};

const clampStrength = (s: number): Strength =>
  (s < 1 ? 1 : s > 4 ? 4 : s) as Strength;

const clampCohesion = (s: number): Cohesion =>
  (s < -2 ? -2 : s > 2 ? 2 : s) as Cohesion;

function applyEvent(state: GameState, e: BattleEvent): GameState {
  switch (e.kind) {
    case 'turn-started': {
      const ns = e.side;
      const cleared = state.units.map(u => {
        const reset = ns === 'french' ? u.side === 'french' : COALITION.includes(u.side);
        return reset ? { ...u, hasMoved: false, hasActed: false } : u;
      });
      return { ...state, units: cleared, currentSide: ns, turn: e.turn };
    }
    case 'turn-ended':
      return state;
    case 'unit-moved':
      return {
        ...state,
        units: state.units.map(u => u.id === e.unitId
          ? { ...u, position: e.to, hasMoved: true, facing: facingFromMove(e.from, e.to, u.facing) }
          : u),
      };
    case 'formation-changed':
      return {
        ...state,
        units: state.units.map(u => u.id === e.unitId
          ? { ...u, formation: e.to, hasActed: true } : u),
      };
    case 'attack-resolved':
      return {
        ...state,
        units: state.units.map(u => {
          if (u.id === e.attackerId) {
            return { ...u, strength: clampStrength(u.strength - e.attackerLoss), hasActed: true };
          }
          if (u.id === e.defenderId) {
            return { ...u, strength: clampStrength(u.strength - e.defenderLoss) };
          }
          return u;
        }),
      };
    case 'morale-revealed':
      return {
        ...state,
        units: state.units.map(u => u.id === e.unitId ? { ...u, moraleRevealed: true } : u),
      };
    case 'cohesion-changed':
      return {
        ...state,
        units: state.units.map(u => u.id === e.unitId
          ? { ...u, cohesion: clampCohesion(e.to) } : u),
      };
    case 'unit-eliminated':
      return { ...state, units: state.units.filter(u => u.id !== e.unitId) };
    case 'unit-routed':
      return { ...state, units: state.units.filter(u => u.id !== e.unitId) };
    case 'unit-retreated':
      return {
        ...state,
        units: state.units.map(u => u.id === e.unitId ? { ...u, position: e.to } : u),
      };
    case 'trigger-fired': {
      const patched = applyPatchToState(state, e.patch);
      return { ...patched, triggersFired: [...state.triggersFired, e.triggerId] };
    }
    case 'victory':
      return state;
  }
}

/** Re-derive pendingPatches from a list of taken decisions, by looking up
 *  each decision's chosen option in its owning scenario and collecting that
 *  option's downstream patches. Without this, a replay of (e.g.) Krems after
 *  a Haslach decision would reconstruct from baseline unit stats — missing
 *  the downstream effect the player actually fought against.
 *  Returns an empty object when allScenarios is not provided (engine stays
 *  decoupled from the campaign list for callers that don't need this). */
function derivePendingPatches(
  decisions: GameState['decisionsTaken'],
  allScenarios: Scenario[] | undefined,
): GameState['pendingPatches'] {
  const out: GameState['pendingPatches'] = {};
  if (!allScenarios) return out;
  for (const taken of decisions) {
    const owning = allScenarios.find(sc => sc.preBattleDecision?.id === taken.decisionId);
    const opt = owning?.preBattleDecision?.options[taken.optionIndex];
    if (!opt?.downstreamPatches) continue;
    for (const [sid, patch] of Object.entries(opt.downstreamPatches)) {
      (out[sid] ??= []).push(patch);
    }
  }
  return out;
}

export function replayUpTo(
  scenario: Scenario,
  decisions: GameState['decisionsTaken'],
  events: BattleEvent[],
  upToIndex: number,
  allScenarios?: Scenario[],
): GameState {
  // Re-derive cross-battle decision consequences. Without this, a replay
  // of a later scenario (e.g. Krems after a Haslach decision) would start
  // from baseline unit stats — missing patches that were applied during
  // live play.
  const pendingPatches = derivePendingPatches(decisions, allScenarios);
  let s = beginBattle(scenario, decisions, pendingPatches);
  // beginBattle's state already encodes events[0] (the first turn-started).
  // Reapply events 1..upToIndex.
  const last = Math.min(upToIndex, events.length - 1);
  for (let i = 1; i <= last; i++) {
    s = applyEvent(s, events[i]);
  }
  // Preserve the log up to this point so consumers (battle log, replay log)
  // see the events that have happened so far. applyEvent intentionally doesn't
  // mutate log to keep the per-event mutation pure.
  return { ...s, log: events.slice(0, Math.max(0, last + 1)) };
}

export function eventUnitIds(e: BattleEvent): string[] {
  switch (e.kind) {
    case 'unit-moved':
    case 'formation-changed':
    case 'morale-revealed':
    case 'cohesion-changed':
    case 'unit-eliminated':
    case 'unit-routed':
    case 'unit-retreated':
      return [e.unitId];
    case 'attack-resolved':
      return [e.attackerId, e.defenderId];
    case 'trigger-fired':
      return e.patch.unitsAdded?.map(u => u.id) ?? [];
    default:
      return [];
  }
}
