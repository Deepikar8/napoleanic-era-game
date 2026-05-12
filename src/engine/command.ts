import type { Unit } from './types';
import { chebyshev } from './grid';
import { sameTeam } from './sides';

export const COMMAND_RADIUS = 2;

export const isInCommand = (unit: Unit, allUnits: Unit[]): boolean =>
  allUnits.some(other =>
    other.id !== unit.id &&
    sameTeam(other.side, unit.side) &&
    chebyshev(other.position, unit.position) <= COMMAND_RADIUS,
  );
