import { describe, it, expect } from 'vitest';
import { wertingen } from '../../src/scenarios/01-wertingen';
import { beginBattle, moveUnit, endTurn, attack } from '../../src/engine';
import { replayUpTo } from '../../src/engine/replay';
import type { Scenario } from '../../src/engine/types';

describe('replay rebuild', () => {
  it('matches engine state at every step of a Wertingen sequence', () => {
    const ctx = { tiles: wertingen.tiles, grid: wertingen.grid };
    let s = beginBattle(wertingen);
    const snapshots = [s];

    s = moveUnit(s, 'fr-lasalle', { x: 2, y: 3 }, ctx).state;  snapshots.push(s);
    s = endTurn(s).state;                                       snapshots.push(s);
    s = endTurn(s).state;                                       snapshots.push(s);
    s = moveUnit(s, 'fr-lasalle', { x: 3, y: 3 }, ctx).state;   snapshots.push(s);

    const finalEvents = s.log;

    for (let k = 0; k < snapshots.length; k++) {
      const expected = snapshots[k];
      const idx = expected.log.length - 1;
      const rebuilt = replayUpTo(wertingen, expected.decisionsTaken, finalEvents, idx);

      expect(rebuilt.currentSide).toBe(expected.currentSide);
      expect(rebuilt.turn).toBe(expected.turn);
      expect(rebuilt.units.length).toBe(expected.units.length);
      for (const u of expected.units) {
        const r = rebuilt.units.find(x => x.id === u.id)!;
        expect(r.position).toEqual(u.position);
        expect(r.strength).toBe(u.strength);
        expect(r.formation).toBe(u.formation);
        expect(r.facing).toBe(u.facing);
        expect(!!r.hasMoved).toBe(!!u.hasMoved);
        expect(!!r.hasActed).toBe(!!u.hasActed);
      }
    }
  });

  it('handles attack-resolved events (strength + hasActed mutations)', () => {
    const tiny: Scenario = {
      id: 'tiny',
      title: 'Tiny',
      briefingMd: 'tiny',
      grid: { width: 4, height: 4 },
      tiles: [],
      units: [
        { id: 'fr-a', side: 'french',  type: 'line-infantry',
          position: { x: 1, y: 1 }, facing: 'E', formation: 'line',
          strength: 4, morale: 2 },
        { id: 'au-b', side: 'austrian', type: 'line-infantry',
          position: { x: 2, y: 1 }, facing: 'W', formation: 'line',
          strength: 4, morale: 2 },
      ],
      victory: [
        { for: 'french',   kind: 'eliminate-unit', args: { unitId: 'au-b' } },
        { for: 'austrian', kind: 'survive-turns',  args: { turns: 5 } },
      ],
      ai: { generalRule: 'defensive', triggers: [] },
    };

    let s = beginBattle(tiny);
    s = attack(s, 'fr-a', 'au-b').state;

    const idx = s.log.length - 1;
    const rebuilt = replayUpTo(tiny, s.decisionsTaken, s.log, idx);

    expect(rebuilt.units.length).toBe(s.units.length);
    for (const u of s.units) {
      const r = rebuilt.units.find(x => x.id === u.id);
      expect(r).toBeTruthy();
      expect(r!.position).toEqual(u.position);
      expect(r!.strength).toBe(u.strength);
      expect(!!r!.hasActed).toBe(!!u.hasActed);
    }
  });
});
