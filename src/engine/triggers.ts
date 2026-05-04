// Scenario triggers — patches applied to LIVE game state when a condition is
// met during play. Distinct from AiScript.triggers (which only emit AI actions)
// and from preBattleDecision patches (which apply before the battle starts).

import type {
  GameState, Scenario, BattleEvent, ScenarioTrigger,
  ScenarioPatch, Unit,
} from './types';
import { posEq } from './types';

const conditionMet = (cond: ScenarioTrigger['when'], state: GameState): boolean => {
  switch (cond.kind) {
    case 'whenTurn':
      return state.turn >= cond.turn;
    case 'whenSideStrengthBelow': {
      const total = state.units
        .filter(u => u.side === cond.side)
        .reduce((s, u) => s + u.strength, 0);
      return total < cond.threshold;
    }
    case 'whenSideHasUnitOnTile':
      return state.units.some(u => u.side === cond.side && posEq(u.position, cond.pos));
  }
};

/** Apply a scenario patch's unit effects to a live GameState. Mid-battle
 *  triggers can add, remove, or override units. tilesOverridden /
 *  victoryOverride / turnLimitOverride don't apply at runtime — they're
 *  scenario-data concerns.
 *
 *  Tile occupancy is checked before adding new units: if a unit-add would
 *  land on a position another unit already holds, that one is skipped (with
 *  a console warning) rather than silently stacking two units at the same
 *  square, which would break the engine's one-unit-per-tile invariant. */
export function applyPatchToState(state: GameState, p: ScenarioPatch): GameState {
  let units = state.units;
  if (p.unitsRemovedByIds?.length) {
    units = units.filter(u => !p.unitsRemovedByIds!.includes(u.id));
  }
  if (p.unitOverrides?.length) {
    units = units.map(u => {
      const ov = p.unitOverrides!.find(o => o.id === u.id);
      return ov ? { ...u, ...ov } as Unit : u;
    });
  }
  if (p.unitsAdded?.length) {
    const occupied = new Set(units.map(u => `${u.position.x},${u.position.y}`));
    const addable: Unit[] = [];
    for (const incoming of p.unitsAdded) {
      const key = `${incoming.position.x},${incoming.position.y}`;
      if (occupied.has(key)) {
        console.warn(
          `[scenario-trigger] dropped unit-add for ${incoming.id}: tile (${incoming.position.x},${incoming.position.y}) is already occupied`,
        );
        continue;
      }
      addable.push(incoming);
      occupied.add(key);  // protect against two added units claiming the same tile
    }
    units = [...units, ...addable];
  }
  return { ...state, units };
}

/** Evaluate every not-yet-fired trigger; for those whose condition is now
 *  met, apply the patch to the live state and emit a 'trigger-fired' event.
 *  The event carries the patch so replayUpTo can faithfully reconstruct. */
export function applyScenarioTriggers(
  state: GameState, scenario: Scenario,
): { state: GameState; events: BattleEvent[] } {
  if (!scenario.scenarioTriggers || scenario.scenarioTriggers.length === 0) {
    return { state, events: [] };
  }
  let s = state;
  const newEvents: BattleEvent[] = [];

  for (const t of scenario.scenarioTriggers) {
    if (s.triggersFired.includes(t.id)) continue;
    if (!conditionMet(t.when, s)) continue;

    s = applyPatchToState(s, t.patch);
    const ev: BattleEvent = t.flavour !== undefined
      ? { kind: 'trigger-fired', triggerId: t.id, patch: t.patch, flavour: t.flavour }
      : { kind: 'trigger-fired', triggerId: t.id, patch: t.patch };
    newEvents.push(ev);
    s = {
      ...s,
      log: [...s.log, ev],
      triggersFired: [...s.triggersFired, t.id],
    };
  }

  return { state: s, events: newEvents };
}
