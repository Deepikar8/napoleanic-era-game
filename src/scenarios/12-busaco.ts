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

export const busaco: Scenario = {
  id: 'busaco',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Busaco — 27 September 1810',
  briefingMd: '12-busaco-briefing',
  grid: { width: 11, height: 9 },
  tiles: [
    ...Array.from({ length: 7 }, (_, y) => ({ pos: { x: 7, y: y + 1 } as const, terrain: 'hill' as const })),
    ...Array.from({ length: 5 }, (_, y) => ({ pos: { x: 8, y: y + 2 } as const, terrain: 'hill' as const })),
    { pos: { x: 6, y: 2 }, terrain: 'forest' },
    { pos: { x: 6, y: 6 }, terrain: 'forest' },
    { pos: { x: 4, y: 4 }, terrain: 'road' },
    { pos: { x: 5, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
    { pos: { x: 7, y: 4 }, terrain: 'road' },
    { pos: { x: 8, y: 4 }, terrain: 'road' },
  ],
  units: [
    fr('reynier', 'Reynier', 'line-infantry', 2, 3, 2),
    fr('ney', 'Ney', 'line-infantry', 2, 5, 2),
    fr('merle', 'Merle Column', 'line-infantry', 3, 2, 2),
    fr('loison', 'Loison Column', 'line-infantry', 3, 6, 2),
    fr('guns', 'French Battery', 'foot-artillery', 3, 4, 2),
    br('picton', 'Picton', 'line-infantry', 7, 3, 3),
    br('craufurd', 'Light Division', 'light-infantry', 8, 2, 3),
    br('hill', 'Hill', 'line-infantry', 7, 5, 2),
    pt('pack', 'Pack Portuguese', 'line-infantry', 8, 6, 2),
    br('guns', 'Ridge Battery', 'foot-artillery', 8, 4, 2),
  ],
  victory: [
    {
      for: 'british',
      kind: 'all-of',
      label: 'Hold the Busaco ridge',
      args: {
        conditions: [
          { for: 'british', kind: 'hold-tile-for-turns', args: { pos: { x: 7, y: 4 }, turns: 8 } },
          { for: 'british', kind: 'reduce-side-strength', args: { side: 'french', threshold: 9 } },
        ],
      },
    },
    { for: 'french', kind: 'capture-tile', label: 'Force the ridge road', args: { pos: { x: 8, y: 4 } } },
  ],
  turnLimit: 9,
  ai: { generalRule: 'aggressive', triggers: [] },
  postBattleDispatch: '12-busaco-postbattle',
  tacticalHint:
    'Defense in depth. Hold the ridge long enough to punish the assault, but do not scatter your line chasing broken columns.',
  lesson: {
    principle: 'A tactical victory can serve a larger operational withdrawal.',
    before:
      'Busaco is not about annihilating Massena. It is about making the French pay for the ridge before the army withdraws behind the Lines of Torres Vedras.',
    during:
      'Keep the ridge units mutually supporting. Let French columns climb into artillery and infantry fire, then use command-supported attacks to finish weakened units.',
    after:
      'The lesson is operational patience. A battle can be won because it preserves the army and buys time, not because it ends the war in one afternoon.',
  },
};
