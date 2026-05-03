import { describe, it, expect } from 'vitest';
import type { Scenario, ScenarioPatch } from '../../src/engine/types';
import { applyPatch } from '../../src/engine/patch';

const baseScenario = (): Scenario => ({
  id: 't', title: 'T', briefingMd: 't',
  grid: { width: 5, height: 5 }, tiles: [],
  units: [
    { id: 'u1', side: 'french', type: 'line-infantry',
      position: { x: 0, y: 0 }, facing: 'E', formation: 'line',
      strength: 4, morale: 2 },
  ],
  victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 5 } }],
  ai: { generalRule: 'defensive', triggers: [] },
});

describe('scenario patch', () => {
  it('adds units', () => {
    const p: ScenarioPatch = {
      unitsAdded: [{
        id: 'u2', side: 'french', type: 'light-cavalry',
        position: { x: 1, y: 0 }, facing: 'E', formation: 'line',
        strength: 4, morale: 2,
      }],
    };
    expect(applyPatch(baseScenario(), p).units).toHaveLength(2);
  });

  it('removes units by id', () => {
    const p: ScenarioPatch = { unitsRemovedByIds: ['u1'] };
    expect(applyPatch(baseScenario(), p).units).toHaveLength(0);
  });

  it('overrides unit fields', () => {
    const p: ScenarioPatch = { unitOverrides: [{ id: 'u1', strength: 2 }] };
    expect(applyPatch(baseScenario(), p).units[0].strength).toBe(2);
  });

  it('overrides victory conditions', () => {
    const p: ScenarioPatch = {
      victoryOverride: [{ for: 'french', kind: 'survive-turns', args: { turns: 99 } }],
    };
    expect(applyPatch(baseScenario(), p).victory[0].args.turns).toBe(99);
  });

  it('returns identical scenario when patch is empty', () => {
    expect(applyPatch(baseScenario(), {})).toEqual(baseScenario());
  });
});
