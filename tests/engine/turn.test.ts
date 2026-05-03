import { describe, it, expect } from 'vitest';
import type { Unit, Scenario } from '../../src/engine/types';
import { moveUnit, attack, endTurn, beginBattle } from '../../src/engine/turn';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

const trivialScenario: Scenario = {
  id: 'test', title: 'Test', briefingMd: 'test',
  grid: { width: 10, height: 10 }, tiles: [],
  units: [
    u({ id: 'fr1', side: 'french', position: { x: 1, y: 1 } }),
    u({ id: 'au1', side: 'austrian', position: { x: 2, y: 1 } }),
  ],
  victory: [{ for: 'french', kind: 'eliminate-unit', args: { unitId: 'au1' } }],
  ai: { generalRule: 'defensive', triggers: [] },
};

describe('turn manager', () => {
  it('beginBattle initialises GameState from scenario', () => {
    const state = beginBattle(trivialScenario);
    expect(state.units).toHaveLength(2);
    expect(state.turn).toBe(1);
    expect(state.currentSide).toBe('french');
    expect(state.phase).toBe('orders');
  });

  it('moveUnit moves and emits unit-moved event', () => {
    const state = beginBattle(trivialScenario);
    const r = moveUnit(state, 'fr1', { x: 1, y: 2 });
    expect(r.state.units.find(u => u.id === 'fr1')!.position).toEqual({ x: 1, y: 2 });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'unit-moved', unitId: 'fr1' }));
  });

  it('moveUnit rejects illegal target', () => {
    const state = beginBattle(trivialScenario);
    expect(() => moveUnit(state, 'fr1', { x: 9, y: 9 })).toThrow();
  });

  it('moveUnit rejects opponent unit', () => {
    const state = beginBattle(trivialScenario);
    expect(() => moveUnit(state, 'au1', { x: 0, y: 0 })).toThrow(/not your unit/);
  });

  it('moveUnit refuses double-move in one turn', () => {
    const state = beginBattle(trivialScenario);
    const after = moveUnit(state, 'fr1', { x: 1, y: 2 }).state;
    expect(() => moveUnit(after, 'fr1', { x: 1, y: 3 })).toThrow(/already moved/);
  });

  it('attack adjacency required', () => {
    const state = beginBattle(trivialScenario);
    // fr1 (1,1) is adjacent to au1 (2,1) — legal
    const r = attack(state, 'fr1', 'au1');
    expect(r.events.some(e => e.kind === 'attack-resolved')).toBe(true);
  });

  it('attack non-adjacent throws', () => {
    const farScenario: Scenario = {
      ...trivialScenario,
      units: [
        u({ id: 'fr1', side: 'french', position: { x: 0, y: 0 } }),
        u({ id: 'au1', side: 'austrian', position: { x: 5, y: 5 } }),
      ],
    };
    const state = beginBattle(farScenario);
    expect(() => attack(state, 'fr1', 'au1')).toThrow(/not adjacent/);
  });

  it('endTurn advances turn and switches side', () => {
    const state = beginBattle(trivialScenario);
    const after1 = endTurn(state).state;
    expect(after1.currentSide).toBe('austrian');
    expect(after1.turn).toBe(1);  // same turn, different side
    const after2 = endTurn(after1).state;
    expect(after2.currentSide).toBe('french');
    expect(after2.turn).toBe(2);  // both sides moved → next turn
  });

  it('endTurn resets per-turn flags', () => {
    const state = beginBattle(trivialScenario);
    const moved = moveUnit(state, 'fr1', { x: 1, y: 2 }).state;
    expect(moved.units.find(u => u.id === 'fr1')!.hasMoved).toBe(true);
    const turn2 = endTurn(endTurn(moved).state).state;
    expect(turn2.units.find(u => u.id === 'fr1')!.hasMoved).toBeFalsy();
  });
});
