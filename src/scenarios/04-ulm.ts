import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'austrian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'au'}-${id}`,
  name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const ulm: Scenario = {
  id: 'ulm',
  title: 'The Surrender at Ulm — 17 October 1805',
  briefingMd: '04-ulm-briefing',
  grid: { width: 10, height: 10 },
  tiles: [
    // Ulm — town tiles in a 2×2 block
    { pos: { x: 4, y: 4 }, terrain: 'town' },
    { pos: { x: 5, y: 4 }, terrain: 'town' },
    { pos: { x: 4, y: 5 }, terrain: 'town' },
    { pos: { x: 5, y: 5 }, terrain: 'town' },
    // Roads radiating out — flavour
    { pos: { x: 3, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
    { pos: { x: 4, y: 3 }, terrain: 'road' },
    { pos: { x: 4, y: 6 }, terrain: 'road' },
  ],
  units: [
    u('french',   'soult',  'Soult',       'line-infantry', 1, 4, 3),
    u('french',   'lannes', 'Lannes',      'line-infantry', 1, 5, 3),
    u('french',   'murat',  'Murat',       'heavy-cavalry', 1, 6, 3),
    u('french',   'ney',    'Ney',         'line-infantry', 8, 4, 3),
    u('french',   'davout', 'Davout',      'line-infantry', 8, 5, 3),
    u('austrian', 'mack',   'Mack',        'line-infantry', 4, 4, 1),
    u('austrian', 'au-1',   'Austrian Inf.','line-infantry', 5, 5, 1),
  ],
  victory: [
    // Capture the southern road tile to seal the encirclement.
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 6 } } },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 6 } },
  ],
  turnLimit: 6,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '04-ulm-postbattle',
};
