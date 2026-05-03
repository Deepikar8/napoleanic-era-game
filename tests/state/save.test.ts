import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageBackend, newRunId } from '../../src/state/save';
import type { GameState } from '../../src/engine/types';
import { wertingen } from '../../src/scenarios/01-wertingen';
import { beginBattle, moveUnit, endTurn } from '../../src/engine';

const sampleState = (): GameState => ({
  schemaVersion: 1, campaignId: 'ulm-austerlitz-1805',
  scenarioIndex: 0, scenarioId: 'austerlitz',
  units: [], currentSide: 'french', turn: 1, phase: 'orders',
  selectedUnitId: null, log: [], decisionsTaken: [], outcomes: [],
  pendingDecisionId: null,
});

describe('save backend', () => {
  beforeEach(() => localStorage.clear());

  it('roundtrips a saved run', () => {
    const id = newRunId();
    localStorageBackend.save({ runId: id, savedAt: 1, state: sampleState() });
    const loaded = localStorageBackend.load(id);
    expect(loaded?.state.scenarioId).toBe('austerlitz');
  });

  it('keeps only the 3 newest runs', () => {
    for (let i = 0; i < 5; i++) {
      localStorageBackend.save({ runId: `r${i}`, savedAt: i, state: sampleState() });
    }
    expect(localStorageBackend.list()).toHaveLength(3);
    expect(localStorageBackend.list().map(r => r.runId)).toEqual(['r4', 'r3', 'r2']);
  });

  it('rejects mismatched schemaVersion when loading', () => {
    localStorage.setItem('napoleonic-save-bad', JSON.stringify({
      runId: 'bad', savedAt: 1, state: { ...sampleState(), schemaVersion: 99 },
    }));
    expect(localStorageBackend.load('bad')).toBeNull();
    expect(localStorageBackend.list()).toHaveLength(0);
  });

  it('preserves a real played-out state through save and load', () => {
    // Build a non-trivial Wertingen state: a move and a turn-end.
    const ctx = { tiles: wertingen.tiles, grid: wertingen.grid };
    let s = beginBattle(wertingen);
    s = moveUnit(s, 'fr-lasalle', { x: 2, y: 3 }, ctx).state;
    s = endTurn(s).state;

    const id = newRunId();
    localStorageBackend.save({ runId: id, savedAt: 100, state: s });
    const loaded = localStorageBackend.load(id);
    expect(loaded).not.toBeNull();
    expect(loaded!.state).toEqual(s);

    // Spot-check load preserves nested structures
    const lasalle = loaded!.state.units.find(u => u.id === 'fr-lasalle')!;
    expect(lasalle.position).toEqual({ x: 2, y: 3 });
    expect(loaded!.state.log.length).toBe(s.log.length);
    expect(loaded!.state.currentSide).toBe(s.currentSide);
    expect(loaded!.state.turn).toBe(s.turn);
  });
});
