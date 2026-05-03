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
    // True encirclement: occupy ALL FOUR roads out of Ulm. Mack can't surrender
    // until every escape line is sealed.
    {
      for: 'french', kind: 'all-of',
      label: 'Encircle Ulm — close all 4 roads',
      args: {
        conditions: [
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 3, y: 4 } } },
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 6, y: 4 } } },
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 3 } } },
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 6 } } },
        ],
      },
    },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 6 } },
  ],
  turnLimit: 6,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '04-ulm-postbattle',
  tacticalHint:
    'True encirclement, not a sprint. Mack won\'t attack — he\'s already negotiating. To win you need to occupy ALL FOUR road tiles around Ulm (3,4), (6,4), (4,3), and (4,6) by turn 6. That\'s 4 separate units in 4 separate places, which is why you have 5 commanders. Cavalry are fastest — Murat\'s heavy is your reliable pin. Square formation is wasted here. Spread out and march.',
};
