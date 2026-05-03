import type { Pos, Unit, Scenario, TerrainKind } from './types';
import { posEq, posKey } from './types';
import { inBounds, neighbors4 } from './grid';

export const moveBudget = (u: Unit): number => {
  const base =
    u.type === 'line-infantry' || u.type === 'light-infantry' || u.type === 'grenadier' ? 2 :
    u.type === 'light-cavalry' || u.type === 'heavy-cavalry' ? 4 :
    1;                                                  // foot/horse artillery
  return base + (u.formation === 'column' ? 1 : 0);
};

export const terrainCost = (t: TerrainKind): number => {
  switch (t) {
    case 'plain':  return 1;
    case 'road':   return 1;
    case 'bridge': return 1;
    case 'forest': return 2;
    case 'hill':   return 2;
    case 'marsh':  return 3;
    case 'town':   return Infinity;
    case 'river':  return Infinity;
  }
};

const tileTerrain = (p: Pos, scenario: Pick<Scenario, 'tiles'>): TerrainKind => {
  const t = scenario.tiles.find(t => posEq(t.pos, p));
  return t?.terrain ?? 'plain';
};

/** BFS / Dijkstra over reachable tiles within a unit's move budget. */
export const legalMoves = (
  unit: Unit,
  allUnits: Unit[],
  scenario: Pick<Scenario, 'grid' | 'tiles'>,
): Pos[] => {
  const occupied = new Set(
    allUnits.filter(o => o.id !== unit.id).map(o => posKey(o.position))
  );
  const budget = moveBudget(unit);
  const dist = new Map<string, number>();
  dist.set(posKey(unit.position), 0);
  const frontier: Pos[] = [unit.position];

  while (frontier.length > 0) {
    const cur = frontier.shift()!;
    const curDist = dist.get(posKey(cur))!;
    for (const n of neighbors4(cur)) {
      if (!inBounds(n, scenario.grid)) continue;
      if (occupied.has(posKey(n))) continue;
      const cost = terrainCost(tileTerrain(n, scenario));
      if (!isFinite(cost)) continue;
      const newDist = curDist + cost;
      if (newDist > budget) continue;
      const prev = dist.get(posKey(n));
      if (prev === undefined || newDist < prev) {
        dist.set(posKey(n), newDist);
        frontier.push(n);
      }
    }
  }

  dist.delete(posKey(unit.position));
  const out: Pos[] = [];
  for (const k of dist.keys()) {
    const [x, y] = k.split(',').map(Number);
    out.push({ x, y });
  }
  return out;
};
