import { describe, it, expect } from 'vitest';
import type { Scenario, Unit } from '../../src/engine/types';
import { legalMoves, terrainCost, moveBudget } from '../../src/engine/movement';

const u = (over: Partial<Unit> = {}): Unit => ({
  id: 'u1', side: 'french', type: 'line-infantry',
  position: { x: 5, y: 5 }, facing: 'N', formation: 'line',
  strength: 4, morale: 2, ...over,
});

const blank = (w = 10, h = 10): Pick<Scenario, 'grid' | 'tiles'> => ({
  grid: { width: w, height: h }, tiles: [],
});

describe('movement', () => {
  it('infantry move budget is 2; column gets +1', () => {
    expect(moveBudget(u({ type: 'line-infantry', formation: 'line' }))).toBe(2);
    expect(moveBudget(u({ type: 'line-infantry', formation: 'column' }))).toBe(3);
    expect(moveBudget(u({ type: 'light-cavalry', formation: 'line' }))).toBe(4);
    expect(moveBudget(u({ type: 'foot-artillery', formation: 'line' }))).toBe(1);
  });

  it('terrain costs match spec', () => {
    expect(terrainCost('plain')).toBe(1);
    expect(terrainCost('forest')).toBe(2);
    expect(terrainCost('hill')).toBe(2);
    expect(terrainCost('marsh')).toBe(3);
    expect(terrainCost('road')).toBe(1);
    expect(terrainCost('bridge')).toBe(1);
    expect(terrainCost('town')).toBe(1);
    expect(terrainCost('river')).toBe(Infinity);
  });

  it('infantry north of a bridge can step onto a town tile south of it', () => {
    // Reproduces the Elchingen bridge bug: river row at y=1 with a bridge at
    // (1,1), town immediately south at (1,2). Without the fix, infantry at
    // (1,0) cannot reach (1,2) because the only escape from the bridge is
    // through the town.
    const inf = u({ type: 'line-infantry', formation: 'column', position: { x: 1, y: 0 } });
    const scenario = {
      grid: { width: 3, height: 3 },
      tiles: [
        { pos: { x: 0, y: 1 }, terrain: 'river' as const },
        { pos: { x: 1, y: 1 }, terrain: 'bridge' as const },
        { pos: { x: 2, y: 1 }, terrain: 'river' as const },
        { pos: { x: 1, y: 2 }, terrain: 'town' as const },
      ],
    };
    const moves = legalMoves(inf, [inf], scenario);
    const reaches = (x: number, y: number) =>
      moves.some(m => m.x === x && m.y === y);
    expect(reaches(1, 1)).toBe(true);   // bridge
    expect(reaches(1, 2)).toBe(true);   // town beyond
  });

  it('legalMoves returns reachable tiles within budget on plain', () => {
    const unit = u({ position: { x: 0, y: 0 }, type: 'line-infantry' });
    const moves = legalMoves(unit, [unit], blank(10, 10));
    expect(moves).toEqual(expect.arrayContaining([
      { x: 1, y: 0 }, { x: 0, y: 1 },
      { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 },
    ]));
    expect(moves).not.toContainEqual({ x: 0, y: 0 });
  });

  it('legalMoves blocks occupied squares', () => {
    const a = u({ id: 'a', position: { x: 0, y: 0 } });
    const b = u({ id: 'b', position: { x: 1, y: 0 } });
    const moves = legalMoves(a, [a, b], blank(10, 10));
    expect(moves).not.toContainEqual({ x: 1, y: 0 });
  });

  it('legalMoves respects out-of-bounds', () => {
    const unit = u({ position: { x: 0, y: 0 } });
    const moves = legalMoves(unit, [unit], blank(2, 2));
    moves.forEach(m => {
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThan(2);
      expect(m.y).toBeLessThan(2);
    });
  });

  it('forest squares cost 2 to enter', () => {
    const unit = u({ position: { x: 0, y: 0 }, type: 'line-infantry' });
    const scenario = {
      grid: { width: 4, height: 1 },
      tiles: [{ pos: { x: 1, y: 0 }, terrain: 'forest' as const }],
    };
    const moves = legalMoves(unit, [unit], scenario);
    expect(moves).toContainEqual({ x: 1, y: 0 });
    expect(moves).not.toContainEqual({ x: 2, y: 0 });
  });
});
