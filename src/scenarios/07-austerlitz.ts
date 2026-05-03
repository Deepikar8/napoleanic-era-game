import type { Scenario, Unit, Tile } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E',
  formation: 'line',
  strength: 4, morale,
});

const co = (
  id: string, name: string, side: 'austrian' | 'russian', type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'austrian' ? 'au' : 'ru'}-${id}`, name, side, type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

const tiles: Tile[] = [
  // Pratzen Heights — central ridge
  { pos: { x: 5, y: 5 }, terrain: 'hill' },
  { pos: { x: 6, y: 5 }, terrain: 'hill' },
  { pos: { x: 7, y: 5 }, terrain: 'hill' },
  { pos: { x: 5, y: 6 }, terrain: 'hill' },
  { pos: { x: 6, y: 6 }, terrain: 'hill' },
  { pos: { x: 7, y: 6 }, terrain: 'hill' },
  // Goldbach Stream (south) — partial river with a bridge
  { pos: { x: 4, y: 10 }, terrain: 'river' },
  { pos: { x: 5, y: 10 }, terrain: 'river' },
  { pos: { x: 6, y: 10 }, terrain: 'bridge' },
  { pos: { x: 7, y: 10 }, terrain: 'river' },
  { pos: { x: 8, y: 10 }, terrain: 'river' },
  // Forests on flanks
  { pos: { x: 0, y: 4 }, terrain: 'forest' },
  { pos: { x: 0, y: 5 }, terrain: 'forest' },
  { pos: { x: 11, y: 6 }, terrain: 'forest' },
  { pos: { x: 11, y: 7 }, terrain: 'forest' },
  // Telnitz village (south)
  { pos: { x: 5, y: 11 }, terrain: 'town' },
  { pos: { x: 6, y: 11 }, terrain: 'town' },
];

export const austerlitz: Scenario = {
  id: 'austerlitz',
  title: 'Austerlitz — 2 December 1805',
  briefingMd: '07-austerlitz-briefing',
  grid: { width: 12, height: 12 },
  tiles,
  units: [
    // French — Soult's IV Corps facing the heights from the west
    fr('soult-vandamme', 'Vandamme (St-Hilaire)', 'line-infantry', 3, 5, 3),
    fr('soult-stcyr',    'St-Cyr',                'line-infantry', 3, 6, 3),
    fr('soult-legrand',  'Legrand',               'light-infantry', 3, 7, 2),
    fr('lannes-suchet',  'Suchet (V Corps)',      'line-infantry', 3, 3, 3),
    fr('murat-cav',      'Murat (Cavalry)',       'heavy-cavalry', 2, 4, 3),
    fr('davout-friant',  'Friant (III Corps)',    'line-infantry', 3, 9, 2),
    fr('soult-arty',     'IV Corps Artillery',    'foot-artillery', 2, 6, 2),
    fr('napoleon',       'Napoleon',              'light-cavalry', 2, 5, 3),
    // Coalition — Allied centre on the heights, Russian guard reserve, Buxhowden in south
    co('buxhowden',  'Buxhowden',  'russian',  'line-infantry', 8, 9, 1),
    co('langeron',   'Langeron',   'russian',  'line-infantry', 7, 8, 1),
    co('przybyszewski','Przybyszewski','russian','line-infantry', 6, 8, 1),
    co('kollowrath', 'Kollowrath', 'austrian', 'line-infantry', 6, 6, 1),
    co('miloradovich','Miloradovich','russian','light-infantry', 7, 6, 2),
    co('liechtenstein','Liechtenstein','austrian','heavy-cavalry', 9, 5, 2),
    co('imperial-guard','Imperial Guard','russian','grenadier', 9, 6, 3),
    co('austrian-arty','Austrian Artillery','austrian','foot-artillery', 9, 7, 2),
  ],
  victory: [
    // Primary path — take the Pratzen Heights and HOLD until turn 8.
    // Doesn't fire as a one-shot capture; French must occupy the tile when
    // the turn-8 check runs, which forces a staged "take then defend" play.
    { for: 'french', kind: 'hold-tile-for-turns', args: { pos: { x: 6, y: 5 }, turns: 8 } },
    // Alternative path — shatter the Russian army outright.
    { for: 'french', kind: 'reduce-side-strength', args: { side: 'russian', threshold: 6 } },
    // Coalition wins by surviving the full 12 turns.
    { for: 'austrian', kind: 'survive-turns', args: { turns: 12 } },
    { for: 'russian', kind: 'survive-turns', args: { turns: 12 } },
  ],
  turnLimit: 12,
  // Aggressive: the Coalition will advance toward your line and counter-attack
  // the Pratzen Heights when you take them. Defensive would have them sit still,
  // contradicting the scenario's central premise.
  ai: { generalRule: 'aggressive', triggers: [] },
  postBattleDispatch: '07-austerlitz-postbattle',
  tacticalHint:
    'Bait and counterstroke. The Pratzen Heights (6,5) are everything — take them, and have someone standing there at turn 9 (after Coalition\'s turn 8) to win. WARNING: when you set foot on the heights, the Russian Imperial Guard cavalry charges from reserve. They\'re elite (★★★) and they hit hard. Bring infantry to form square on the heights AS SOON as you take them — line/column will be cut down. Alternative: grind Russian strength below 6 if you can\'t hold.',
  scenarioTriggers: [
    {
      id: 'russian-guard-charge',
      // Fires the moment a French unit stands on the Pratzen heights.
      when: { kind: 'whenSideHasUnitOnTile', side: 'french', pos: { x: 6, y: 5 } },
      patch: {
        unitsAdded: [
          {
            id: 'ru-guard-cavalry',
            name: 'Imperial Guard Cavalry',
            side: 'russian',
            type: 'heavy-cavalry',
            position: { x: 8, y: 5 },     // arrives east of the heights
            facing: 'W',
            formation: 'line',
            strength: 4,
            morale: 3,                    // elite
          },
        ],
      },
      flavour: 'The Russian Imperial Guard cavalry charges from reserve!',
    },
  ],
};
