import { describe, it, expect } from 'vitest';
import type { Unit, Scenario } from '../../src/engine/types';
import { moveUnit, attack, endTurn, beginBattle, changeFormation } from '../../src/engine/turn';

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

  it('changeFormation changes formation and sets hasActed', () => {
    const state = beginBattle(trivialScenario);
    const r = changeFormation(state, 'fr1', 'square');
    const unit = r.state.units.find(u => u.id === 'fr1')!;
    expect(unit.formation).toBe('square');
    expect(unit.hasActed).toBe(true);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'formation-changed', unitId: 'fr1' }));
    expect(() => changeFormation(r.state, 'fr1', 'column')).toThrow(/Already acted/);
  });

  describe('coalition (austrian + russian) handover', () => {
    const coalitionScenario: Scenario = {
      id: 'co', title: 'Co', briefingMd: 'co',
      grid: { width: 10, height: 10 }, tiles: [],
      units: [
        u({ id: 'fr1', side: 'french',  position: { x: 1, y: 1 } }),
        u({ id: 'au1', side: 'austrian', position: { x: 5, y: 1 } }),
        u({ id: 'ru1', side: 'russian',  position: { x: 5, y: 5 } }),
      ],
      victory: [
        { for: 'french',  kind: 'eliminate-unit', args: { unitId: 'au1' } },
        { for: 'austrian', kind: 'survive-turns', args: { turns: 5 } },
        { for: 'russian',  kind: 'survive-turns', args: { turns: 5 } },
      ],
      ai: { generalRule: 'defensive', triggers: [] },
    };

    it('endTurn from french routes to austrian (first coalition side)', () => {
      const state = beginBattle(coalitionScenario);
      const after = endTurn(state).state;
      expect(after.currentSide).toBe('austrian');
      expect(after.turn).toBe(1);
    });

    it('during coalition turn, both austrian and russian units may move and attack', () => {
      let s = beginBattle(coalitionScenario);
      s = endTurn(s).state;
      expect(s.currentSide).toBe('austrian');
      // austrian unit moves
      s = moveUnit(s, 'au1', { x: 4, y: 1 }).state;
      expect(s.units.find(u => u.id === 'au1')!.position).toEqual({ x: 4, y: 1 });
      // russian unit moves on the same turn — should NOT throw
      s = moveUnit(s, 'ru1', { x: 5, y: 4 }).state;
      expect(s.units.find(u => u.id === 'ru1')!.position).toEqual({ x: 5, y: 4 });
    });

    it('coalition cannot attack its own partner', () => {
      const adj: Scenario = {
        ...coalitionScenario,
        units: [
          u({ id: 'fr1', side: 'french',   position: { x: 0, y: 0 } }),
          u({ id: 'au1', side: 'austrian', position: { x: 4, y: 4 } }),
          u({ id: 'ru1', side: 'russian',  position: { x: 5, y: 4 } }),
        ],
      };
      let s = beginBattle(adj);
      s = endTurn(s).state;
      expect(() => attack(s, 'au1', 'ru1')).toThrow(/friendly/);
    });

    it('coalition flags reset at the start of their next turn (full cycle)', () => {
      let s = beginBattle(coalitionScenario);
      s = endTurn(s).state;                                    // -> coalition T1
      s = moveUnit(s, 'au1', { x: 4, y: 1 }).state;
      s = moveUnit(s, 'ru1', { x: 5, y: 4 }).state;
      expect(s.units.find(u => u.id === 'au1')!.hasMoved).toBe(true);
      s = endTurn(s).state;                                    // -> french T2
      s = endTurn(s).state;                                    // -> coalition T2 (reset point)
      expect(s.currentSide).toBe('austrian');
      expect(s.turn).toBe(2);
      expect(s.units.find(u => u.id === 'au1')!.hasMoved).toBeFalsy();
      expect(s.units.find(u => u.id === 'ru1')!.hasMoved).toBeFalsy();
    });

    it('french cannot move during coalition turn', () => {
      let s = beginBattle(coalitionScenario);
      s = endTurn(s).state;  // coalition turn
      expect(() => moveUnit(s, 'fr1', { x: 1, y: 2 })).toThrow(/not your unit/);
    });
  });
});
