import { describe, it, expect } from 'vitest';
import { wertingen } from '../../src/scenarios/01-wertingen';
import { beginBattle, endTurn, moveUnit } from '../../src/engine';

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
});
