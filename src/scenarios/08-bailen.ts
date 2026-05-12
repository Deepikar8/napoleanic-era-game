import type { Scenario, Unit } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E', formation: 'line',
  strength: 4, morale,
});

const sp = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `sp-${id}`, name, side: 'spanish', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

export const bailen: Scenario = {
  id: 'bailen',
  campaignId: 'peninsular-war-1808',
  title: 'Bailen — 19 July 1808',
  briefingMd: '08-bailen-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    { pos: { x: 2, y: 3 }, terrain: 'road' },
    { pos: { x: 3, y: 3 }, terrain: 'road' },
    { pos: { x: 4, y: 3 }, terrain: 'road' },
    { pos: { x: 5, y: 3 }, terrain: 'road' },
    { pos: { x: 6, y: 3 }, terrain: 'road' },
    { pos: { x: 7, y: 3 }, terrain: 'road' },
    { pos: { x: 1, y: 2 }, terrain: 'hill' },
    { pos: { x: 1, y: 4 }, terrain: 'hill' },
    { pos: { x: 7, y: 2 }, terrain: 'hill' },
    { pos: { x: 7, y: 4 }, terrain: 'hill' },
    { pos: { x: 8, y: 3 }, terrain: 'town' },
  ],
  units: [
    fr('dupont', 'Dupont', 'line-infantry', 3, 3, 2),
    fr('vedel', 'Vedel', 'line-infantry', 2, 2, 2),
    fr('barbou', 'Barbou', 'line-infantry', 2, 4, 2),
    fr('cav', 'French Dragoons', 'light-cavalry', 1, 3, 2),
    fr('guns', 'French Battery', 'foot-artillery', 3, 4, 2),
    sp('reding', 'Reding', 'line-infantry', 7, 3, 2),
    sp('coupigny', 'Coupigny', 'line-infantry', 7, 2, 2),
    sp('jones', 'Spanish Line', 'line-infantry', 7, 4, 1),
    sp('cazadores', 'Cazadores', 'light-infantry', 8, 2, 2),
    sp('guns', 'Spanish Guns', 'foot-artillery', 8, 4, 2),
  ],
  victory: [
    {
      for: 'french',
      kind: 'all-of',
      label: 'Break through the Bailen road',
      args: {
        conditions: [
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 8, y: 3 } } },
          { for: 'french', kind: 'reduce-side-strength', args: { side: 'spanish', threshold: 8 } },
        ],
      },
    },
    { for: 'spanish', kind: 'survive-turns', args: { turns: 8 } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '08-bailen-postbattle',
  tacticalHint:
    'Overextension lesson. Dupont must break east along the road before the Spanish line hardens. Keep units in command and avoid trapped retreats: a blocked broken unit will rout.',
  lesson: {
    principle: 'Overextended armies lose options before they lose strength.',
    before:
      'The French column is isolated and must keep its road open. Bailen teaches that tactical quality cannot rescue a force whose retreat and supply line are being squeezed.',
    during:
      'Win by keeping the French together, breaking the Spanish line, and occupying Bailen. Scattered attacks will leave units out of command and vulnerable to rout.',
    after:
      'Bailen showed Europe that French forces could be trapped and forced to surrender. The strategic lesson is not that Spain beat France man-for-man, but that isolation can turn a strong army brittle.',
  },
};
