import type { Scenario, Unit, Tile } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E',
  formation: 'line',
  strength: 4, morale,
});

const co = (
  id: string, name: string, side: 'austrian' | 'russian', type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'austrian' ? 'au' : 'ru'}-${id}`, name, side, type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

const tiles: Tile[] = [
  // Pratzen Heights — central ridge
  { pos: { x: 5, y: 5 }, terrain: 'hill' },
  { pos: { x: 6, y: 5 }, terrain: 'hill' },
  { pos: { x: 7, y: 5 }, terrain: 'hill' },
  { pos: { x: 5, y: 6 }, terrain: 'hill' },
  { pos: { x: 6, y: 6 }, terrain: 'hill' },
  { pos: { x: 7, y: 6 }, terrain: 'hill' },
  // Goldbach Stream (south) — partial river with a bridge
  { pos: { x: 4, y: 10 }, terrain: 'river' },
  { pos: { x: 5, y: 10 }, terrain: 'river' },
  { pos: { x: 6, y: 10 }, terrain: 'bridge' },
  { pos: { x: 7, y: 10 }, terrain: 'river' },
  { pos: { x: 8, y: 10 }, terrain: 'river' },
  // Forests on flanks
  { pos: { x: 0, y: 4 }, terrain: 'forest' },
  { pos: { x: 0, y: 5 }, terrain: 'forest' },
  { pos: { x: 11, y: 6 }, terrain: 'forest' },
  { pos: { x: 11, y: 7 }, terrain: 'forest' },
  // Telnitz village (south)
  { pos: { x: 5, y: 11 }, terrain: 'town' },
  { pos: { x: 6, y: 11 }, terrain: 'town' },
];

export const austerlitz: Scenario = {
  id: 'austerlitz',
  title: 'Austerlitz — 2 December 1805',
  briefingMd: '07-austerlitz-briefing',
  grid: { width: 12, height: 12 },
  tiles,
  units: [
    // French — Soult's IV Corps facing the heights from the west
    fr('soult-vandamme', 'Vandamme (St-Hilaire)', 'line-infantry', 3, 5, 3),
    fr('soult-stcyr',    'St-Cyr',                'line-infantry', 3, 6, 3),
    fr('soult-legrand',  'Legrand',               'light-infantry', 3, 7, 2),
    fr('lannes-suchet',  'Suchet (V Corps)',      'line-infantry', 3, 3, 3),
    fr('murat-cav',      'Murat (Cavalry)',       'heavy-cavalry', 2, 4, 3),
    fr('davout-friant',  'Friant (III Corps)',    'line-infantry', 3, 9, 2),
    fr('soult-arty',     'IV Corps Artillery',    'foot-artillery', 2, 6, 2),
    fr('napoleon',       'Napoleon',              'light-cavalry', 2, 5, 3),
    // Coalition — Allied centre on the heights, Russian guard reserve, Buxhowden in south
    co('buxhowden',  'Buxhowden',  'russian',  'line-infantry', 8, 9, 1),
    co('langeron',   'Langeron',   'russian',  'line-infantry', 7, 8, 1),
    co('przybyszewski','Przybyszewski','russian','line-infantry', 6, 8, 1),
    co('kollowrath', 'Kollowrath', 'austrian', 'line-infantry', 6, 6, 1),
    co('miloradovich','Miloradovich','russian','light-infantry', 7, 6, 2),
    co('liechtenstein','Liechtenstein','austrian','heavy-cavalry', 9, 5, 2),
    co('imperial-guard','Imperial Guard','russian','grenadier', 9, 6, 3),
    co('austrian-arty','Austrian Artillery','austrian','foot-artillery', 9, 7, 2),
  ],
  victory: [
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 6, y: 5 } } },
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 7, y: 5 } } },
    { for: 'french', kind: 'reduce-side-strength', args: { side: 'russian', threshold: 8 } },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 12 } },
    { for: 'russian', kind: 'survive-turns', args: { turns: 12 } },
  ],
  turnLimit: 12,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '07-austerlitz-postbattle',
};
