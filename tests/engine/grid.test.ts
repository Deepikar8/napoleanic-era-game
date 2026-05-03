import { describe, it, expect } from 'vitest';
import { manhattan, chebyshev, neighbors4, neighbors8, inBounds, facingFrom } from '../../src/engine/grid';

describe('grid helpers', () => {
  it('manhattan distance', () => {
    expect(manhattan({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('chebyshev distance', () => {
    expect(chebyshev({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4);
  });

  it('neighbors4 returns 4 orthogonal neighbours', () => {
    const r = neighbors4({ x: 2, y: 2 });
    expect(r).toEqual([
      { x: 2, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 2 },
    ]);
  });

  it('neighbors8 returns 8 surrounding cells', () => {
    expect(neighbors8({ x: 2, y: 2 })).toHaveLength(8);
  });

  it('inBounds respects grid extents', () => {
    expect(inBounds({ x: 0, y: 0 }, { width: 3, height: 3 })).toBe(true);
    expect(inBounds({ x: -1, y: 0 }, { width: 3, height: 3 })).toBe(false);
    expect(inBounds({ x: 3, y: 0 }, { width: 3, height: 3 })).toBe(false);
  });

  it('facingFrom yields direction vector', () => {
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe('E');
    expect(facingFrom({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe('N');
    expect(facingFrom({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe('W');
    expect(facingFrom({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe('S');
  });
});
