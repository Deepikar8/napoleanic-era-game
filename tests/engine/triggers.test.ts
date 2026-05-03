import { describe, it, expect } from 'vitest';
import type { Scenario, Unit, ScenarioTrigger } from '../../src/engine/types';
import { beginBattle } from '../../src/engine/turn';
import { applyScenarioTriggers } from '../../src/engine/triggers';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

const guardCharge: ScenarioTrigger = {
  id: 'guard-charge',
  when: { kind: 'whenSideHasUnitOnTile', side: 'french', pos: { x: 6, y: 5 } },
  patch: {
    unitsAdded: [
      u({ id: 'ru-guard', side: 'russian', position: { x: 8, y: 5 }, type: 'heavy-cavalry', morale: 3 }),
    ],
  },
  flavour: 'The Imperial Guard charges!',
};

const baseScenario: Scenario = {
  id: 'trigger-test', title: 'T', briefingMd: 't',
  grid: { width: 12, height: 12 }, tiles: [],
  units: [
    u({ id: 'fr1', side: 'french', position: { x: 0, y: 0 } }),
    u({ id: 'au1', side: 'austrian', position: { x: 11, y: 11 } }),
  ],
  victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 5 } }],
  ai: { generalRule: 'defensive', triggers: [] },
  scenarioTriggers: [guardCharge],
};

describe('scenario triggers', () => {
  it('does not fire when condition is unmet', () => {
    const state = beginBattle(baseScenario);
    const r = applyScenarioTriggers(state, baseScenario);
    expect(r.events).toHaveLength(0);
    expect(r.state.units.find(u => u.id === 'ru-guard')).toBeUndefined();
  });

  it('fires when a French unit reaches the trigger tile', () => {
    let state = beginBattle(baseScenario);
    // Manually plant fr1 on the trigger tile.
    state = {
      ...state,
      units: state.units.map(u => u.id === 'fr1' ? { ...u, position: { x: 6, y: 5 } } : u),
    };
    const r = applyScenarioTriggers(state, baseScenario);
    expect(r.events).toHaveLength(1);
    expect(r.events[0].kind).toBe('trigger-fired');
    expect(r.state.units.find(u => u.id === 'ru-guard')).toBeTruthy();
    expect(r.state.units.find(u => u.id === 'ru-guard')!.morale).toBe(3);
    expect(r.state.triggersFired).toContain('guard-charge');
  });

  it('does not double-fire on subsequent calls', () => {
    let state = beginBattle(baseScenario);
    state = {
      ...state,
      units: state.units.map(u => u.id === 'fr1' ? { ...u, position: { x: 6, y: 5 } } : u),
    };
    const first = applyScenarioTriggers(state, baseScenario);
    const second = applyScenarioTriggers(first.state, baseScenario);
    expect(first.events).toHaveLength(1);
    expect(second.events).toHaveLength(0);
    expect(second.state.units.filter(u => u.id === 'ru-guard')).toHaveLength(1);
  });

  it('whenTurn condition fires when state.turn >= threshold', () => {
    const turnTrig: ScenarioTrigger = {
      id: 't',
      when: { kind: 'whenTurn', turn: 3 },
      patch: { unitsAdded: [u({ id: 'reinforce', side: 'french', position: { x: 1, y: 1 } })] },
    };
    const scn: Scenario = { ...baseScenario, scenarioTriggers: [turnTrig] };
    let state = beginBattle(scn);
    let r = applyScenarioTriggers(state, scn);
    expect(r.events).toHaveLength(0);              // turn 1, not yet
    state = { ...state, turn: 3 };
    r = applyScenarioTriggers(state, scn);
    expect(r.events).toHaveLength(1);              // fires at turn 3
  });

  it('whenSideStrengthBelow fires when total drops past threshold', () => {
    const trig: ScenarioTrigger = {
      id: 's',
      when: { kind: 'whenSideStrengthBelow', side: 'austrian', threshold: 3 },
      patch: { unitsAdded: [u({ id: 'reinforce', side: 'french', position: { x: 1, y: 1 } })] },
    };
    const scn: Scenario = { ...baseScenario, scenarioTriggers: [trig] };
    let state = beginBattle(scn);
    let r = applyScenarioTriggers(state, scn);
    expect(r.events).toHaveLength(0);              // austrian still has 4
    state = {
      ...state,
      units: state.units.map(u => u.id === 'au1' ? { ...u, strength: 2 } : u),
    };
    r = applyScenarioTriggers(state, scn);
    expect(r.events).toHaveLength(1);
  });
});

describe('cross-battle decision consequences (downstream patches)', () => {
  it('beginBattle applies pendingPatches for the matching scenario id', () => {
    const scn: Scenario = {
      id: 'krems', title: 'Krems', briefingMd: 't',
      grid: { width: 5, height: 5 }, tiles: [],
      units: [u({ id: 'fr-fr-1', side: 'french', morale: 2 })],
      victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 5 } }],
      ai: { generalRule: 'defensive', triggers: [] },
    };
    // Simulate the kid having taken the "send light infantry forward" choice
    // earlier — pending patch lowers fr-fr-1's morale at Krems.
    const pending = {
      krems: [{ unitOverrides: [{ id: 'fr-fr-1', morale: 1 as const }] }],
    };
    const state = beginBattle(scn, [], pending);
    expect(state.units.find(u => u.id === 'fr-fr-1')!.morale).toBe(1);
    // The consumed entry is stripped so it doesn't reapply on a re-run.
    expect(state.pendingPatches.krems).toBeUndefined();
  });

  it('beginBattle preserves entries for OTHER scenario ids', () => {
    const scn: Scenario = {
      id: 'krems', title: 'Krems', briefingMd: 't',
      grid: { width: 5, height: 5 }, tiles: [],
      units: [u({ id: 'fr-fr-1', side: 'french' })],
      victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 5 } }],
      ai: { generalRule: 'defensive', triggers: [] },
    };
    const pending = {
      krems: [{ unitOverrides: [{ id: 'fr-fr-1', morale: 1 as const }] }],
      austerlitz: [{ unitOverrides: [{ id: 'fr-soult-vandamme', morale: 2 as const }] }],
    };
    const state = beginBattle(scn, [], pending);
    expect(state.pendingPatches.austerlitz).toBeTruthy();
    expect(state.pendingPatches.austerlitz!.length).toBe(1);
  });
});
