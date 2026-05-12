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

export const somosierra: Scenario = {
  id: 'somosierra',
  campaignId: 'peninsular-war-1808',
  title: 'Somosierra — 30 November 1808',
  briefingMd: '09-somosierra-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    ...Array.from({ length: 10 }, (_, x) => ({ pos: { x, y: 3 } as const, terrain: 'road' as const })),
    ...Array.from({ length: 10 }, (_, x) => ({ pos: { x, y: 2 } as const, terrain: 'hill' as const })),
    ...Array.from({ length: 10 }, (_, x) => ({ pos: { x, y: 4 } as const, terrain: 'hill' as const })),
    { pos: { x: 8, y: 3 }, terrain: 'town' },
  ],
  units: [
    fr('polish-lancers', 'Polish Lancers', 'light-cavalry', 1, 3, 3),
    fr('guard-cav', 'Guard Cavalry', 'heavy-cavalry', 0, 3, 3),
    fr('lapisse', 'Lapisse', 'line-infantry', 1, 2, 2),
    fr('ruffin', 'Ruffin', 'line-infantry', 1, 4, 2),
    fr('guns', 'French Battery', 'foot-artillery', 0, 4, 2),
    sp('san-juan', 'San Juan', 'line-infantry', 7, 3, 2),
    sp('battery-1', 'Pass Battery I', 'foot-artillery', 5, 3, 2),
    sp('battery-2', 'Pass Battery II', 'foot-artillery', 6, 2, 2),
    sp('battery-3', 'Pass Battery III', 'foot-artillery', 6, 4, 2),
    sp('militia', 'Spanish Militia', 'line-infantry', 8, 3, 1),
  ],
  victory: [
    {
      for: 'french',
      kind: 'all-of',
      label: 'Open the Madrid road',
      args: {
        conditions: [
          { for: 'french', kind: 'capture-tile', args: { pos: { x: 8, y: 3 } } },
          { for: 'french', kind: 'eliminate-unit', args: { unitId: 'sp-battery-1' } },
        ],
      },
    },
    { for: 'spanish', kind: 'survive-turns', args: { turns: 7 } },
  ],
  turnLimit: 7,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '09-somosierra-postbattle',
  tacticalHint:
    'Shock action on a road. The pass is narrow and the guns control the approach. Use cavalry speed to break the first battery, then bring infantry up before the charge outruns command support.',
  lesson: {
    principle: 'Tempo can solve a defensive problem before it becomes an attritional one.',
    before:
      'Somosierra asks whether speed can turn a mountain defense into a road-opening blow. The French need the Madrid road now, not after a careful siege of every gun position.',
    during:
      'Use cavalry shock to hit the batteries, but keep enough follow-up infantry close that the spearhead does not become isolated.',
    after:
      'The famous charge worked because it compressed time. The strategic lesson is that tempo can shatter a blocking force, but only when the attacker accepts risk and follows through immediately.',
  },
};
