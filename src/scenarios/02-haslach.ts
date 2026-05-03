import type { Scenario, Unit, Decision } from '../engine/types';

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

const decision: Decision = {
  id: 'haslach-pre',
  promptMd:
    'Werneck has cut off Dupont\'s 6,000 men with three times their number. Dupont, vastly outnumbered, intends to attack rather than be enveloped.\n\n**Reinforce by sending a battalion of light infantry forward at the cost of leaving the rearguard thinner — or hold them back?**\n\n*Note: troops sent forward here will not be available later. Troops kept in reserve will rejoin Mortier\'s column at Krems.*',
  options: [
    {
      label: 'Send the light infantry forward',
      patch: { unitsAdded: [
        { id: 'fr-light-reinforcement', name: 'Light Bn (reinforcement)',
          side: 'french', type: 'light-infantry', position: { x: 1, y: 4 },
          facing: 'E', formation: 'line', strength: 3, morale: 2 },
      ] },
      // Downstream: Mortier's column at Krems is thinner. fr-1 (Light Bn) starts
      // at strength 3 and morale 1 (the troops are tired and battered).
      downstreamPatches: {
        krems: {
          unitOverrides: [
            { id: 'fr-fr-1', strength: 3, morale: 1 },
          ],
        },
      },
    },
    {
      label: 'Hold the rearguard intact',
      patch: { unitOverrides: [
        { id: 'fr-dupont', morale: 3 },   // tougher Dupont
      ] },
      // Downstream: Mortier gets the fresh Light Bn fully rested.
      downstreamPatches: {
        krems: {
          unitOverrides: [
            { id: 'fr-fr-1', morale: 3 },  // veteran light infantry, ready
          ],
        },
      },
    },
  ],
};

export const haslach: Scenario = {
  id: 'haslach',
  title: 'Haslach-Jungingen — 11 October 1805',
  briefingMd: '02-haslach-briefing',
  grid: { width: 9, height: 9 },
  tiles: [
    { pos: { x: 4, y: 4 }, terrain: 'town' },
    { pos: { x: 5, y: 4 }, terrain: 'town' },
    { pos: { x: 0, y: 8 }, terrain: 'river' },
    { pos: { x: 1, y: 8 }, terrain: 'river' },
    { pos: { x: 2, y: 8 }, terrain: 'bridge' },
    { pos: { x: 3, y: 8 }, terrain: 'river' },
  ],
  units: [
    u('french',   'dupont',    'Dupont',         'line-infantry', 2, 4, 3),
    u('french',   'fr-1',      'French Inf.',    'line-infantry', 2, 3, 2),
    u('french',   'fr-2',      'French Inf.',    'line-infantry', 2, 5, 2),
    u('french',   'fr-arty',   'Battery',        'foot-artillery', 1, 4, 2),
    u('austrian', 'werneck',   'Werneck',        'line-infantry', 7, 4, 2),
    u('austrian', 'au-1',      'Austrian Inf.',  'line-infantry', 7, 3, 1),
    u('austrian', 'au-2',      'Austrian Inf.',  'line-infantry', 7, 5, 1),
    u('austrian', 'au-cav',    'Austrian Hussars','light-cavalry', 8, 4, 2),
  ],
  victory: [
    { for: 'french', kind: 'survive-turns', args: { turns: 8 } },
    { for: 'austrian', kind: 'eliminate-unit', args: { unitId: 'fr-dupont' } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'aggressive', triggers: [] },
  preBattleDecision: decision,
  postBattleDispatch: '02-haslach-postbattle',
  tacticalHint:
    'Desperate holdout. Werneck WILL come at you. You don\'t need to kill anyone — just keep Dupont alive for 8 turns. Form line for the firefight, square if cavalry threatens. Hold the centre with the battery; let the Austrians break themselves on it.',
};
