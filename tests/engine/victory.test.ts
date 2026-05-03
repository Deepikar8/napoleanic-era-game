import { describe, it, expect } from 'vitest';
import type { GameState, VictoryCondition, Unit } from '../../src/engine/types';
import { checkVictory } from '../../src/engine/victory';

const baseState = (over: Partial<GameState> = {}): GameState => ({
  schemaVersion: 1, campaignId: 'ulm-austerlitz-1805',
  scenarioIndex: 0, scenarioId: 'test',
  units: [], currentSide: 'french', turn: 1, phase: 'orders',
  selectedUnitId: null, log: [], decisionsTaken: [], outcomes: [],
  pendingDecisionId: null, ...over,
});

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

describe('victory', () => {
  it('eliminate-unit: victory when target gone', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'eliminate-unit', args: { unitId: 'mack' },
    }];
    expect(checkVictory(baseState({ units: [u({ id: 'a', side: 'french' })] }), conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
    expect(checkVictory(baseState({ units: [u({ id: 'mack', side: 'austrian' })] }), conds))
      .toEqual({ kind: 'in-progress' });
  });

  it('reduce-side-strength below threshold', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'reduce-side-strength',
      args: { side: 'austrian', threshold: 3 },
    }];
    const stillAlive = baseState({ units: [u({ id: 'au1', side: 'austrian', strength: 4 })] });
    expect(checkVictory(stillAlive, conds)).toEqual({ kind: 'in-progress' });
    const reduced = baseState({ units: [u({ id: 'au1', side: 'austrian', strength: 2 })] });
    expect(checkVictory(reduced, conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
  });

  it('survive-turns fires only after the threshold turn is completed (not reached)', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'survive-turns', args: { turns: 5 },
    }];
    // Mid-turn-5 — both sides may still have actions. NOT a win yet.
    expect(checkVictory(baseState({ turn: 5 }), conds)).toEqual({ kind: 'in-progress' });
    // Turn 6 starts only after both sides finished turn 5. NOW a win.
    expect(checkVictory(baseState({ turn: 6 }), conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
    expect(checkVictory(baseState({ turn: 4 }), conds)).toEqual({ kind: 'in-progress' });
  });

  it('capture-tile when a friendly unit stands on it', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 4 } },
    }];
    const empty = baseState({ units: [u({ id: 'fr1', side: 'french', position: { x: 0, y: 0 } })] });
    expect(checkVictory(empty, conds)).toEqual({ kind: 'in-progress' });
    const onIt = baseState({ units: [u({ id: 'fr1', side: 'french', position: { x: 4, y: 4 } })] });
    expect(checkVictory(onIt, conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
  });

  it('all-of requires every sub-condition before firing', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'all-of',
      label: 'Two roads',
      args: {
        conditions: [
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 1, y: 1 } } },
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 2, y: 2 } } },
        ],
      },
    }];

    const noneOnRoads = baseState({
      units: [u({ id: 'fr1', side: 'french', position: { x: 0, y: 0 } })],
    });
    expect(checkVictory(noneOnRoads, conds)).toEqual({ kind: 'in-progress' });

    const onlyOne = baseState({
      units: [u({ id: 'fr1', side: 'french', position: { x: 1, y: 1 } })],
    });
    expect(checkVictory(onlyOne, conds)).toEqual({ kind: 'in-progress' });

    const bothCovered = baseState({
      units: [
        u({ id: 'fr1', side: 'french', position: { x: 1, y: 1 } }),
        u({ id: 'fr2', side: 'french', position: { x: 2, y: 2 } }),
      ],
    });
    expect(checkVictory(bothCovered, conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
  });

  it('summarizeVictory shows progress count for all-of (e.g., 2/4)', async () => {
    const { summarizeVictory } = await import('../../src/engine/victory');
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'all-of',
      label: 'Encircle',
      args: {
        conditions: [
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 1, y: 1 } } },
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 2, y: 2 } } },
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 3, y: 3 } } },
        ],
      },
    }];
    const oneCovered = baseState({
      units: [u({ id: 'fr1', side: 'french', position: { x: 1, y: 1 } })],
    });
    const summary = summarizeVictory(oneCovered, conds);
    expect(summary[0].label).toBe('Encircle (1/3)');
    expect(summary[0].met).toBe(false);
  });
});
