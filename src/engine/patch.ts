import type { Scenario, ScenarioPatch, Unit } from './types';

export function applyPatch(s: Scenario, p: ScenarioPatch): Scenario {
  let units = [...s.units];
  if (p.unitsRemovedByIds?.length) {
    units = units.filter(u => !p.unitsRemovedByIds!.includes(u.id));
  }
  if (p.unitOverrides?.length) {
    units = units.map(u => {
      const ov = p.unitOverrides!.find(o => o.id === u.id);
      return ov ? { ...u, ...ov } as Unit : u;
    });
  }
  if (p.unitsAdded?.length) {
    units = [...units, ...p.unitsAdded];
  }

  let tiles = s.tiles;
  if (p.tilesOverridden?.length) {
    const overrideKeys = new Set(p.tilesOverridden.map(t => `${t.pos.x},${t.pos.y}`));
    const filtered = s.tiles.filter(t => !overrideKeys.has(`${t.pos.x},${t.pos.y}`));
    tiles = [...filtered, ...p.tilesOverridden];
  }

  const out: Scenario = {
    ...s,
    units,
    tiles,
    victory: p.victoryOverride ?? s.victory,
  };
  const tl = p.turnLimitOverride ?? s.turnLimit;
  if (tl !== undefined) out.turnLimit = tl;
  else delete out.turnLimit;
  return out;
}
