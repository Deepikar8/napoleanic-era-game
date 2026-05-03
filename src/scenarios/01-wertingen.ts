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

export const wertingen: Scenario = {
  id: 'wertingen',
  title: 'Wertingen — 8 October 1805',
  briefingMd: '01-wertingen-briefing',
  grid: { width: 8, height: 8 },
  tiles: [
    { pos: { x: 3, y: 3 }, terrain: 'forest' },
    { pos: { x: 4, y: 3 }, terrain: 'forest' },
    { pos: { x: 3, y: 4 }, terrain: 'forest' },
    { pos: { x: 0, y: 6 }, terrain: 'town' },
    { pos: { x: 1, y: 6 }, terrain: 'town' },
  ],
  units: [
    u('french',   'murat',     'Murat',          'heavy-cavalry', 1, 1, 3),
    u('french',   'lasalle',   'Lasalle',        'light-cavalry', 1, 3, 2),
    u('french',   'klein',     'Klein',          'light-cavalry', 1, 5, 2),
    u('french',   'oudinot',   'Oudinot',        'line-infantry', 0, 4, 3),
    u('austrian', 'auffenberg','Auffenberg',     'line-infantry', 6, 4, 1),
    u('austrian', 'spangen',   'Spangen',        'line-infantry', 6, 5, 1),
    u('austrian', 'au-cav',    'Austrian Hussars','light-cavalry', 7, 3, 1),
    u('austrian', 'au-arty',   'Austrian Battery','foot-artillery', 7, 6, 2),
  ],
  victory: [
    { for: 'french', kind: 'reduce-side-strength', args: { side: 'austrian', threshold: 6 } },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 8 } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '01-wertingen-postbattle',
};
