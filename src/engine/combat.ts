import type { Unit, Tile, BattleEvent } from './types';
import { posEq } from './types';
import { chebyshev } from './grid';
import { isArtilleryType } from './attack-range';

type AttackResult = 'attacker-broken' | 'attacker-repulsed' | 'exchange' | 'defender-retreats' | 'defender-broken';

const isCavalry = (t: Unit['type']) => t === 'light-cavalry' || t === 'heavy-cavalry';
const isInfantry = (t: Unit['type']) =>
  t === 'line-infantry' || t === 'light-infantry' || t === 'grenadier';
const isArtillery = isArtilleryType;

const terrainAt = (p: Unit['position'], tiles: Tile[]) =>
  tiles.find(t => posEq(t.pos, p))?.terrain ?? 'plain';

const scoreFor = (
  unit: Unit,
  opp: Unit,
  allUnits: Unit[],
  tiles: Tile[],
  isAttacker: boolean,
): number => {
  let s = unit.strength;
  s += unit.morale;

  if (!isAttacker) {
    const ter = terrainAt(unit.position, tiles);
    if (ter === 'hill' || ter === 'forest' || ter === 'town') s += 1;
  }

  if (unit.formation === 'square' && isCavalry(opp.type)) s += 2;
  if (unit.formation === 'square' && isArtillery(opp.type)) s -= 2;
  if (unit.formation === 'column' && isInfantry(opp.type)) s -= 1;
  if (unit.formation === 'line' && isInfantry(opp.type)) s += 1;

  if (isAttacker) {
    const friendsAdj = allUnits.filter(o =>
      o.side === unit.side && o.id !== unit.id &&
      chebyshev(o.position, opp.position) === 1,
    );
    if (friendsAdj.length > 0) s += 1;
  }

  if (isAttacker && isCavalry(unit.type) && isInfantry(opp.type) && opp.formation !== 'square') {
    s += 1;
  }

  return s;
};

export function resolveAttack(
  attacker: Unit,
  defender: Unit,
  allUnits: Unit[],
  tiles: Tile[],
): { updatedUnits: Unit[]; events: BattleEvent[] } {
  const events: BattleEvent[] = [];

  if (!defender.moraleRevealed) {
    events.push({ kind: 'morale-revealed', unitId: defender.id, morale: defender.morale });
  }

  const aScore = scoreFor(attacker, defender, allUnits, tiles, true);
  const dScore = scoreFor(defender, attacker, allUnits, tiles, false);
  const gap = aScore - dScore;

  let result: AttackResult;
  let attackerLoss = 0;
  let defenderLoss = 0;

  if (gap <= -2)      { result = 'attacker-broken';   attackerLoss = 2; }
  else if (gap === -1) { result = 'attacker-repulsed'; attackerLoss = 1; }
  else if (gap <= 1)  { result = 'exchange';          attackerLoss = 1; defenderLoss = 1; }
  else if (gap === 2) { result = 'defender-retreats'; attackerLoss = 0; defenderLoss = 0; }
  else                { result = 'defender-broken';   defenderLoss = 2; }
  if (isArtillery(attacker.type)) attackerLoss = 0;

  events.push({
    kind: 'attack-resolved',
    attackerId: attacker.id, defenderId: defender.id,
    result, attackerLoss, defenderLoss,
    attackerScore: aScore, defenderScore: dScore,
  });

  const eliminatedIds = new Set<string>();
  const updatedUnits = allUnits
    .map(u => {
      if (u.id === attacker.id) {
        return { ...u, strength: Math.max(0, u.strength - attackerLoss) as Unit['strength'] };
      }
      if (u.id === defender.id) {
        return { ...u, strength: Math.max(0, u.strength - defenderLoss) as Unit['strength'], moraleRevealed: true };
      }
      return u;
    })
    .filter(u => {
      if ((u.strength as number) === 0) { // 0 is valid post-loss; not in Strength union
        eliminatedIds.add(u.id);
        return false;
      }
      return true;
    });

  for (const id of eliminatedIds) {
    events.push({ kind: 'unit-eliminated', unitId: id });
  }

  return { updatedUnits, events };
}
