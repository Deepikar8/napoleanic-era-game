import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageBackend, newRunId, isValidGameState, isValidSavedRun } from '../../src/state/save';
import type { GameState } from '../../src/engine/types';
import { wertingen } from '../../src/scenarios/01-wertingen';
import { beginBattle, moveUnit, endTurn } from '../../src/engine';

const sampleState = (): GameState => ({
  schemaVersion: 1, campaignId: 'ulm-austerlitz-1805',
  scenarioIndex: 0, scenarioId: 'austerlitz',
  units: [], currentSide: 'french', turn: 1, phase: 'orders',
  selectedUnitId: null, log: [], decisionsTaken: [], outcomes: [],
  pendingDecisionId: null,
  pendingPatches: {}, triggersFired: [],
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

  it('rejects malformed states beyond just the schemaVersion', () => {
    const valid = sampleState();
    expect(isValidGameState(valid)).toBe(true);
    expect(isValidGameState({ ...valid, currentSide: 'martian' })).toBe(false);
    expect(isValidGameState({ ...valid, turn: 0 })).toBe(false);
    expect(isValidGameState({ ...valid, scenarioId: 42 })).toBe(false);
    expect(isValidGameState({ ...valid, units: 'not-an-array' })).toBe(false);
    expect(isValidGameState({ ...valid, units: [{ id: 'broken' /* missing fields */ }] })).toBe(false);
    expect(isValidGameState({ ...valid, campaignId: 'wrong' })).toBe(false);
    expect(isValidGameState(null)).toBe(false);
    expect(isValidGameState('json string')).toBe(false);
  });

  it('localStorageBackend.load rejects user-edited corrupted saves', () => {
    // Simulate a kid (or attacker) editing the save by hand.
    localStorage.setItem('napoleonic-save-bad2', JSON.stringify({
      runId: 'bad2', savedAt: 1,
      state: { ...sampleState(), currentSide: 'martian' },  // invalid side
    }));
    expect(localStorageBackend.load('bad2')).toBeNull();
    expect(localStorageBackend.list()).toHaveLength(0);
  });

  it('isValidSavedRun checks the wrapping fields too', () => {
    const goodState = sampleState();
    expect(isValidSavedRun({ runId: 'ok', savedAt: 100, state: goodState })).toBe(true);
    expect(isValidSavedRun({ runId: 5, savedAt: 100, state: goodState })).toBe(false);
    expect(isValidSavedRun({ runId: 'ok', savedAt: 'now', state: goodState })).toBe(false);
    expect(isValidSavedRun({ runId: 'ok', savedAt: 100, state: null })).toBe(false);
  });

  it('rejects pendingPatches with non-array values (would crash beginBattle iteration)', () => {
    const valid = sampleState();
    // Hand-edited save: pendingPatches.krems is a number, not an array.
    expect(isValidGameState({ ...valid, pendingPatches: { krems: 123 } })).toBe(false);
    // Array of non-objects also rejected.
    expect(isValidGameState({ ...valid, pendingPatches: { krems: ['nope'] } })).toBe(false);
    // Valid shape passes.
    expect(isValidGameState({
      ...valid,
      pendingPatches: { krems: [{ unitOverrides: [{ id: 'fr1', morale: 1 }] }] },
    })).toBe(true);
  });

  it('rejects triggersFired containing non-strings', () => {
    const valid = sampleState();
    expect(isValidGameState({ ...valid, triggersFired: ['ok', 42] })).toBe(false);
    expect(isValidGameState({ ...valid, triggersFired: 'not-an-array' })).toBe(false);
    expect(isValidGameState({ ...valid, triggersFired: ['ok', 'also-ok'] })).toBe(true);
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

  it('migrates older saved units without cohesion to neutral cohesion', () => {
    const legacyState = {
      ...sampleState(),
      units: [{
        id: 'fr1',
        side: 'french',
        type: 'line-infantry',
        position: { x: 0, y: 0 },
        facing: 'N',
        formation: 'line',
        strength: 4,
        morale: 2,
      }],
    };
    localStorage.setItem('napoleonic-save-legacy-cohesion', JSON.stringify({
      runId: 'legacy-cohesion',
      savedAt: 1,
      state: legacyState,
    }));

    const loaded = localStorageBackend.load('legacy-cohesion');
    expect(loaded?.state.units[0].cohesion).toBe(0);
  });

  it('loads older states without scenario playerSide data', () => {
    const state = sampleState();
    expect(state.currentSide).toBe('french');
    expect(isValidGameState(state)).toBe(true);
  });
});
