import type { Scenario, Unit } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E', formation: 'column',
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

const pt = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `pt-${id}`, name, side: 'portuguese', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

export const vimeiro: Scenario = {
  id: 'vimeiro',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Vimeiro — 21 August 1808',
  briefingMd: '11-vimeiro-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    { pos: { x: 6, y: 2 }, terrain: 'hill' },
    { pos: { x: 7, y: 2 }, terrain: 'hill' },
    { pos: { x: 6, y: 3 }, terrain: 'hill' },
    { pos: { x: 7, y: 3 }, terrain: 'hill' },
    { pos: { x: 7, y: 4 }, terrain: 'town' },
    { pos: { x: 8, y: 4 }, terrain: 'town' },
    { pos: { x: 3, y: 4 }, terrain: 'road' },
    { pos: { x: 4, y: 4 }, terrain: 'road' },
    { pos: { x: 5, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
  ],
  units: [
    fr('junot', 'Junot', 'line-infantry', 2, 3, 2),
    fr('laborde', 'Laborde Column', 'line-infantry', 2, 2, 2),
    fr('loison', 'Loison Column', 'line-infantry', 2, 5, 2),
    fr('dragoons', 'French Dragoons', 'heavy-cavalry', 1, 4, 2),
    fr('guns', 'French Battery', 'foot-artillery', 3, 4, 2),
    br('wellesley', 'Wellesley', 'line-infantry', 7, 3, 3),
    br('ferguson', 'Ferguson', 'line-infantry', 7, 2, 2),
    br('hill', 'Hill', 'line-infantry', 8, 4, 2),
    br('guns', 'British Guns', 'foot-artillery', 8, 3, 2),
    pt('line', 'Portuguese Line', 'line-infantry', 6, 5, 2),
  ],
  victory: [
    {
      for: 'british',
      kind: 'all-of',
      label: 'Hold Vimeiro ridge',
      args: {
        conditions: [
          { for: 'british', kind: 'hold-tile-for-turns', args: { pos: { x: 7, y: 3 }, turns: 7 } },
          { for: 'british', kind: 'reduce-side-strength', args: { side: 'french', threshold: 10 } },
        ],
      },
    },
    { for: 'french', kind: 'capture-tile', label: 'Take the ridge', args: { pos: { x: 7, y: 3 } } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'aggressive', triggers: [] },
  postBattleDispatch: '11-vimeiro-postbattle',
  tacticalHint:
    'Line against column. Keep infantry on the ridge, let French columns spend themselves uphill, then counterattack only when their cohesion drops.',
  lesson: {
    principle: 'A steady defensive line can turn an attacking column into a target.',
    before:
      'Vimeiro teaches the value of disciplined fire and position. The French must come forward; the Anglo-Portuguese line wins by making that advance expensive.',
    during:
      'Hold the ridge and town with mutually supporting units. Use artillery to soften columns before committing infantry attacks.',
    after:
      'The strategic lesson is restraint. A commander who already has the strong ground does not need to chase glory; the enemy attack can be defeated by forcing it through the wrong terrain.',
  },
};
