import type { Unit, Tile } from './types';
import { posEq } from './types';
import { chebyshev } from './grid';
import { isArtilleryType } from './attack-range';
import { sameTeam } from './sides';
import { isInCommand } from './command';

const isCavalry = (t: Unit['type']) => t === 'light-cavalry' || t === 'heavy-cavalry';
const isInfantry = (t: Unit['type']) => t === 'line-infantry' || t === 'light-infantry' || t === 'grenadier';
const isArtillery = isArtilleryType;

const terrainAt = (p: Unit['position'], tiles: Tile[]) =>
  tiles.find(t => posEq(t.pos, p))?.terrain ?? 'plain';

const supportBonusFor = (unit: Unit, allUnits: Unit[]): number =>
  allUnits.some(o =>
    o.id !== unit.id &&
    sameTeam(o.side, unit.side) &&
    chebyshev(o.position, unit.position) === 1,
  ) ? 1 : 0;

export interface CombatPreview {
  attackerScore: number;
  defenderScore: number;          // includes defender's morale even if unrevealed
  defenderRevealed: boolean;
  predictedResult: string;        // e.g. "+2 → defender retreats"
}

export function previewAttack(
  attacker: Unit, defender: Unit, allUnits: Unit[], tiles: Tile[],
): CombatPreview {
  const score = (u: Unit, opp: Unit, isAttacker: boolean): number => {
    let s = u.strength + u.morale;
    s += u.cohesion ?? 0;
    s += supportBonusFor(u, allUnits);
    if (!isInCommand(u, allUnits)) s -= 1;
    if (!isAttacker) {
      const ter = terrainAt(u.position, tiles);
      if (ter === 'hill' || ter === 'forest' || ter === 'town') s += 1;
    }
    if (u.formation === 'square' && isCavalry(opp.type)) s += 2;
    if (u.formation === 'square' && isArtillery(opp.type)) s -= 2;
    if (u.formation === 'column' && isInfantry(opp.type)) s -= 1;
    if (u.formation === 'line' && isInfantry(opp.type)) s += 1;
    if (isAttacker) {
      const friends = allUnits.filter(o => o.side === u.side && o.id !== u.id &&
        chebyshev(o.position, opp.position) === 1);
      if (friends.length > 0) s += 1;
      if (isCavalry(u.type) && isInfantry(opp.type) && opp.formation !== 'square') s += 1;
    }
    return s;
  };
  const a = score(attacker, defender, true);
  const d = score(defender, attacker, false);
  const gap = a - d;
  let predicted = 'exchange';
  if (gap <= -2) predicted = 'attacker breaks';
  else if (gap === -1) predicted = 'attacker repulsed';
  else if (gap <= 1)   predicted = 'exchange';
  else if (gap === 2)  predicted = 'defender retreats';
  else                 predicted = 'defender broken';

  return {
    attackerScore: a,
    defenderScore: d,
    defenderRevealed: !!defender.moraleRevealed,
    predictedResult: `${gap >= 0 ? '+' : ''}${gap} → ${predicted}`,
  };
}
