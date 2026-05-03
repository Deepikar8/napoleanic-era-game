import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'russian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'ru'}-${id}`,
  name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const krems: Scenario = {
  id: 'krems',
  title: 'Krems / Dürnstein — 11 November 1805',
  briefingMd: '05-krems-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    // Danube along the bottom
    ...Array.from({ length: 10 }, (_, x) => ({
      pos: { x, y: 7 } as const, terrain: 'river' as const,
    })),
    { pos: { x: 5, y: 7 }, terrain: 'bridge' },
    // Hills around Dürnstein
    { pos: { x: 3, y: 3 }, terrain: 'hill' },
    { pos: { x: 4, y: 3 }, terrain: 'hill' },
    { pos: { x: 5, y: 3 }, terrain: 'hill' },
    { pos: { x: 6, y: 3 }, terrain: 'hill' },
    // Krems town
    { pos: { x: 8, y: 5 }, terrain: 'town' },
    { pos: { x: 9, y: 5 }, terrain: 'town' },
    // Forest narrow defile
    { pos: { x: 1, y: 4 }, terrain: 'forest' },
    { pos: { x: 2, y: 4 }, terrain: 'forest' },
    { pos: { x: 1, y: 5 }, terrain: 'forest' },
  ],
  units: [
    u('french',   'mortier',  'Mortier',     'line-infantry', 5, 5, 3),
    u('french',   'gazan',    'Gazan',       'line-infantry', 4, 5, 2),
    u('french',   'fr-1',     'French Inf.', 'light-infantry', 6, 5, 2),
    u('french',   'fr-arty',  'Battery',     'foot-artillery', 5, 6, 2),
    u('russian',  'kutuzov',  'Kutuzov',     'line-infantry', 5, 1, 3),
    u('russian',  'ru-1',     'Russian Inf.','line-infantry', 4, 1, 2),
    u('russian',  'ru-2',     'Russian Inf.','line-infantry', 6, 1, 2),
    u('russian',  'ru-3',     'Russian Inf.','line-infantry', 4, 2, 2),
    u('russian',  'ru-4',     'Russian Inf.','line-infantry', 6, 2, 2),
    u('russian',  'ru-cav',   'Russian Cav.','light-cavalry', 7, 1, 2),
  ],
  victory: [
    { for: 'french', kind: 'survive-turns', args: { turns: 8 } },
    { for: 'russian', kind: 'eliminate-unit', args: { unitId: 'fr-mortier' } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'aggressive', triggers: [] },
  postBattleDispatch: '05-krems-postbattle',
};
