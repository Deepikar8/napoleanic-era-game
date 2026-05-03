import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'russian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'ru'}-${id}`, name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const schongrabern: Scenario = {
  id: 'schongrabern',
  title: 'Schöngrabern — 16 November 1805',
  briefingMd: '06-schongrabern-briefing',
  grid: { width: 10, height: 10 },
  tiles: [
    { pos: { x: 5, y: 4 }, terrain: 'hill' },
    { pos: { x: 6, y: 4 }, terrain: 'hill' },
    { pos: { x: 5, y: 5 }, terrain: 'hill' },
    { pos: { x: 6, y: 5 }, terrain: 'hill' },
    { pos: { x: 0, y: 0 }, terrain: 'forest' },
    { pos: { x: 0, y: 9 }, terrain: 'forest' },
    { pos: { x: 9, y: 0 }, terrain: 'forest' },
    { pos: { x: 9, y: 9 }, terrain: 'forest' },
  ],
  units: [
    u('french',  'murat',    'Murat',       'heavy-cavalry', 1, 4, 3),
    u('french',  'oudinot',  'Oudinot',     'grenadier',     1, 5, 3),
    u('french',  'soult-1',  'Soult Inf.',  'line-infantry', 1, 6, 2),
    u('french',  'soult-2',  'Soult Inf.',  'line-infantry', 1, 3, 2),
    u('french',  'fr-arty',  'French Btty', 'foot-artillery', 0, 5, 2),
    u('russian', 'bagration','Bagration',  'line-infantry', 6, 5, 3),
    u('russian', 'ru-1',     'Pavlov',     'line-infantry', 6, 4, 2),
    u('russian', 'ru-2',     'Doctorov',   'line-infantry', 6, 6, 2),
    u('russian', 'ru-cav',   'Cossacks',   'light-cavalry', 7, 5, 2),
    u('russian', 'ru-arty',  'Russian Btty','foot-artillery', 7, 7, 2),
  ],
  victory: [
    { for: 'french', kind: 'eliminate-unit', args: { unitId: 'ru-bagration' } },
    { for: 'russian', kind: 'survive-turns', args: { turns: 10 } },
  ],
  turnLimit: 10,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '06-schongrabern-postbattle',
};
