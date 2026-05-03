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

export const elchingen: Scenario = {
  id: 'elchingen',
  title: 'Elchingen — 14 October 1805',
  briefingMd: '03-elchingen-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    // Danube splits the map; one bridge in the middle.
    ...Array.from({ length: 10 }, (_, x) => ({
      pos: { x, y: 3 } as const,
      terrain: x === 5 ? ('bridge' as const) : ('river' as const),
    })),
    { pos: { x: 5, y: 4 }, terrain: 'town' },   // village of Elchingen
    { pos: { x: 6, y: 4 }, terrain: 'hill' },
    { pos: { x: 4, y: 4 }, terrain: 'hill' },
  ],
  units: [
    u('french',   'ney',     'Ney',         'line-infantry', 4, 0, 3),
    u('french',   'loison',  'Loison',      'line-infantry', 5, 0, 2),
    u('french',   'malher',  'Malher',      'light-infantry', 5, 1, 2),
    u('french',   'fr-cav',  'French Cav.', 'light-cavalry', 6, 0, 2),
    u('french',   'fr-arty', 'Battery',     'foot-artillery', 4, 1, 2),
    u('austrian', 'riesch',  'Riesch',      'line-infantry', 5, 5, 2),
    u('austrian', 'au-1',    'Austrian Inf.','line-infantry', 4, 5, 2),
    u('austrian', 'au-2',    'Austrian Inf.','line-infantry', 6, 5, 2),
    u('austrian', 'au-arty', 'Austrian Btty','foot-artillery', 5, 6, 2),
  ],
  victory: [
    // Take the village AND silence the Austrian battery. Just sprinting a
    // cavalryman into the town wins nothing if the guns are still firing
    // from the heights.
    {
      for: 'french', kind: 'all-of',
      label: 'Take Elchingen + silence the battery',
      args: {
        conditions: [
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 5, y: 4 } } },
          { for: 'french', kind: 'eliminate-unit', args: { unitId: 'au-au-arty' } },
        ],
      },
    },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 8 } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '03-elchingen-postbattle',
  tacticalHint:
    'Bridge assault — TWO objectives. The Austrian battery on the heights will hammer your approach, so you must (a) take the village (5,4) AND (b) eliminate the Austrian artillery. Sprint the cavalry across the bridge in column, switch infantry to line on the south bank for the firefight, and concentrate force on the battery — adjacent friendlies give +1 attack.',
};
