// Single source of truth for coalition / side / team membership.
// Imported by engine, AI, replay, and UI — replaces ad-hoc copies.

import type { Side, Unit } from './types';

export const COALITION: readonly Side[] = ['austrian', 'russian'] as const;

/** Are both sides on the same team? Coalition partners count as one team. */
export const sameTeam = (a: Side, b: Side): boolean =>
  (a === 'french' && b === 'french') ||
  (COALITION.includes(a) && COALITION.includes(b));

/** Is this side allowed to act when `currentSide` holds the turn?
 *  Coalition turns let either austrian or russian act. */
export const isOnActiveSide = (side: Side, currentSide: Side): boolean =>
  currentSide === 'french' ? side === 'french' : COALITION.includes(side);

/** Convenience: can this unit act this turn (ignoring per-unit hasMoved/hasActed)? */
export const canActUnit = (u: Unit, currentSide: Side): boolean =>
  isOnActiveSide(u.side, currentSide);
