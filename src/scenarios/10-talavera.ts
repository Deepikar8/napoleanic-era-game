import type { Scenario, Unit } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E', formation: 'line',
  strength: 4, morale,
});

const br = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `br-${id}`, name, side: 'british', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

export const talavera: Scenario = {
  id: 'talavera',
  campaignId: 'peninsular-war-1808',
  title: 'Talavera — 27-28 July 1809',
  briefingMd: '10-talavera-briefing',
  grid: { width: 11, height: 9 },
  tiles: [
    { pos: { x: 7, y: 2 }, terrain: 'hill' },
    { pos: { x: 8, y: 2 }, terrain: 'hill' },
    { pos: { x: 7, y: 3 }, terrain: 'hill' },
    { pos: { x: 8, y: 3 }, terrain: 'hill' },
    { pos: { x: 8, y: 5 }, terrain: 'town' },
    { pos: { x: 8, y: 6 }, terrain: 'town' },
    { pos: { x: 5, y: 0 }, terrain: 'forest' },
    { pos: { x: 5, y: 8 }, terrain: 'forest' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
    { pos: { x: 7, y: 4 }, terrain: 'road' },
    { pos: { x: 8, y: 4 }, terrain: 'road' },
  ],
  units: [
    fr('victor', 'Victor', 'line-infantry', 2, 3, 2),
    fr('lapisse', 'Lapisse', 'line-infantry', 2, 2, 2),
    fr('sebastiani', 'Sebastiani', 'line-infantry', 2, 5, 2),
    fr('cav', 'Latour-Maubourg', 'heavy-cavalry', 1, 4, 2),
    fr('guns', 'French Grand Battery', 'foot-artillery', 2, 4, 2),
    br('wellesley', 'Wellesley', 'line-infantry', 8, 4, 3),
    br('hill', 'Hill', 'line-infantry', 8, 2, 3),
    br('sherbrooke', 'Sherbrooke', 'line-infantry', 8, 5, 2),
    br('light', 'Light Brigade', 'light-infantry', 7, 3, 2),
    br('guns', 'Allied Guns', 'foot-artillery', 9, 4, 2),
  ],
  victory: [
    {
      for: 'french',
      kind: 'all-of',
      label: 'Break the allied ridge',
      args: {
        conditions: [
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 8, y: 2 } } },
          { for: 'french', kind: 'reduce-side-strength', args: { side: 'british', threshold: 8 } },
        ],
      },
    },
    { for: 'british', kind: 'survive-turns', args: { turns: 9 } },
  ],
  turnLimit: 9,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '10-talavera-postbattle',
  tacticalHint:
    'Prepared defense. The ridge and town make frontal attacks expensive. Use artillery and command-supported attacks to create one breach; charging everywhere will feed cohesion losses into a rout.',
  lesson: {
    principle: 'Terrain lets a smaller army trade space for killing power.',
    before:
      'Talavera teaches the cost of attacking a steady coalition line. The French have strength, but the British position turns that strength into repeated uphill assaults.',
    during:
      'Do not attack the whole line. Prepare one point with artillery, keep attackers in command, and exploit only when cohesion starts to drop.',
    after:
      'The lesson is defensive leverage. A prepared ridge does not need to destroy the attacker immediately; it only needs to make every French attack cost more than the strategic prize is worth.',
  },
};
