import type { Pos, Facing } from './types';

export const manhattan = (a: Pos, b: Pos) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export const chebyshev = (a: Pos, b: Pos) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export const neighbors4 = (p: Pos): Pos[] => [
  { x: p.x,     y: p.y - 1 },  // N
  { x: p.x + 1, y: p.y     },  // E
  { x: p.x,     y: p.y + 1 },  // S
  { x: p.x - 1, y: p.y     },  // W
];

export const neighbors8 = (p: Pos): Pos[] => {
  const out: Pos[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (dx !== 0 || dy !== 0) out.push({ x: p.x + dx, y: p.y + dy });
  return out;
};

export const inBounds = (p: Pos, grid: { width: number; height: number }) =>
  p.x >= 0 && p.y >= 0 && p.x < grid.width && p.y < grid.height;

export const facingFrom = (from: Pos, to: Pos): Facing => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'E' : 'W';
  return dy > 0 ? 'S' : 'N';
};

export const facingToVec = (f: Facing): Pos => {
  switch (f) {
    case 'N': return { x:  0, y: -1 };
    case 'E': return { x:  1, y:  0 };
    case 'S': return { x:  0, y:  1 };
    case 'W': return { x: -1, y:  0 };
  }
};
