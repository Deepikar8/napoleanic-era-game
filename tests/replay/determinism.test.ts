import { describe, it, expect } from 'vitest';
import { wertingen } from '../../src/scenarios/01-wertingen';
import { beginBattle, endTurn, moveUnit, attack } from '../../src/engine';
import { replayUpTo } from '../../src/engine/replay';
import type { Scenario, Unit } from '../../src/engine/types';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

describe('replay determinism', () => {
  it('same script always produces same final state and log', () => {
    const run = () => {
      let s = beginBattle(wertingen);
      // French turn: move Lasalle one step east
      s = moveUnit(s, 'fr-lasalle', { x: 2, y: 3 },
        { tiles: wertingen.tiles, grid: wertingen.grid }).state;
      s = endTurn(s).state;       // -> austrian
      s = endTurn(s).state;       // -> french turn 2
      // French turn 2: move Lasalle into contact with au-cav-equivalent if reachable
      // (Use a stable, in-range target.)
      const target = { x: 3, y: 3 };  // forest — reachable
      s = moveUnit(s, 'fr-lasalle', target,
        { tiles: wertingen.tiles, grid: wertingen.grid }).state;
      return s;
    };
    const a = run(); const b = run();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('replays cohesion changes from combat events', () => {
    const scenario: Scenario = {
      id: 'cohesion-replay', title: 'Cohesion replay', briefingMd: 't',
      grid: { width: 4, height: 4 }, tiles: [],
      units: [
        u({ id: 'fr1', side: 'french', position: { x: 0, y: 0 }, strength: 4, morale: 3 }),
        u({ id: 'au1', side: 'austrian', position: { x: 1, y: 0 }, strength: 1, morale: 1 }),
      ],
      victory: [{ for: 'french', kind: 'eliminate-unit', args: { unitId: 'au1' } }],
      ai: { generalRule: 'defensive', triggers: [] },
    };
    let s = beginBattle(scenario);
    s = attack(s, 'fr1', 'au1').state;

    const replayed = replayUpTo(scenario, [], s.log, s.log.length - 1);
    expect(replayed.units.find(u => u.id === 'fr1')?.cohesion)
      .toBe(s.units.find(u => u.id === 'fr1')?.cohesion);
  });
});
