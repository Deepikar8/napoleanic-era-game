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

const pt = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `pt-${id}`, name, side: 'portuguese', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

export const salamanca: Scenario = {
  id: 'salamanca',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Salamanca — 22 July 1812',
  briefingMd: '13-salamanca-briefing',
  grid: { width: 11, height: 9 },
  tiles: [
    { pos: { x: 4, y: 2 }, terrain: 'hill' },
    { pos: { x: 5, y: 2 }, terrain: 'hill' },
    { pos: { x: 6, y: 3 }, terrain: 'hill' },
    { pos: { x: 8, y: 5 }, terrain: 'hill' },
    { pos: { x: 8, y: 6 }, terrain: 'hill' },
    { pos: { x: 5, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
    { pos: { x: 7, y: 4 }, terrain: 'road' },
    { pos: { x: 8, y: 4 }, terrain: 'road' },
    { pos: { x: 9, y: 4 }, terrain: 'road' },
  ],
  units: [
    fr('marmont', 'Marmont Center', 'line-infantry', 6, 4, 2),
    fr('thomieres', 'Thomieres', 'line-infantry', 8, 5, 2),
    fr('maucune', 'Maucune', 'line-infantry', 8, 3, 2),
    fr('cavalry', 'French Cavalry', 'light-cavalry', 9, 5, 2),
    fr('guns', 'French Guns', 'foot-artillery', 7, 4, 2),
    br('wellington', 'Wellington', 'line-infantry', 3, 4, 3),
    br('pakenham', 'Pakenham', 'line-infantry', 4, 5, 3),
    br('leith', 'Leith', 'line-infantry', 4, 3, 2),
    pt('bradford', 'Portuguese Brigade', 'line-infantry', 3, 5, 2),
    br('cavalry', 'Le Marchant', 'heavy-cavalry', 3, 6, 3),
    br('guns', 'Allied Guns', 'foot-artillery', 4, 4, 2),
  ],
  victory: [
    {
      for: 'british',
      kind: 'all-of',
      label: 'Exploit the stretched French wing',
      args: {
        conditions: [
          { for: 'british', kind: 'eliminate-unit', args: { unitId: 'fr-thomieres' } },
          { for: 'british', kind: 'reduce-side-strength', args: { side: 'french', threshold: 10 } },
        ],
      },
    },
    { for: 'french', kind: 'survive-turns', label: 'Recover the line', args: { turns: 8 } },
  ],
  turnLimit: 8,
  ai: {
    generalRule: 'defensive',
    triggers: [
      {
        whenTurn: 4,
        do: [
          { kind: 'move', unitId: 'fr-maucune', to: { x: 7, y: 3 } },
          { kind: 'change-formation', unitId: 'fr-thomieres', to: 'square' },
        ],
      },
    ],
  },
  postBattleDispatch: '13-salamanca-postbattle',
  tacticalHint:
    'Exploit overextension. Strike the exposed French wing fast, keep support close, and prevent the enemy from reforming a continuous line.',
  lesson: {
    principle: 'When an enemy stretches too far, concentration beats frontage.',
    before:
      'At Salamanca the French line has reached too far. The opportunity will not last: hit the exposed wing before the rest of the army can recover.',
    during:
      'Concentrate infantry, cavalry, and guns against Thomieres. Do not spread attacks across the whole line; break one wing and roll it up.',
    after:
      'The lesson is exploitation. A commander does not need equal strength everywhere if the enemy has created one decisive weakness.',
  },
};
