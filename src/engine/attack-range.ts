import type { Unit, UnitType } from './types';
import { chebyshev } from './grid';

export const ARTILLERY_ATTACK_RANGE = 3;

export const isArtilleryType = (type: UnitType): boolean =>
  type === 'foot-artillery' || type === 'horse-artillery';

export function attackRangeFor(unit: Pick<Unit, 'type'>): number {
  return isArtilleryType(unit.type) ? ARTILLERY_ATTACK_RANGE : 1;
}

export function canAttackUnit(attacker: Unit, defender: Unit): boolean {
  const distance = chebyshev(attacker.position, defender.position);
  return distance >= 1 && distance <= attackRangeFor(attacker);
}
