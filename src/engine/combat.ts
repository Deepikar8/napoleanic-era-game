import type { Cohesion, Unit, Tile, BattleEvent, Pos } from './types';
import { posEq } from './types';
import { chebyshev, facingFrom, inBounds, neighbors4 } from './grid';
import { terrainCost } from './movement';
import { isArtilleryType } from './attack-range';
import { sameTeam } from './sides';
import { isInCommand } from './command';

type AttackResult = 'attacker-broken' | 'attacker-repulsed' | 'exchange' | 'defender-retreats' | 'defender-broken';

const isCavalry = (t: Unit['type']) => t === 'light-cavalry' || t === 'heavy-cavalry';
const isInfantry = (t: Unit['type']) =>
  t === 'line-infantry' || t === 'light-infantry' || t === 'grenadier';
const isArtillery = isArtilleryType;

const terrainAt = (p: Unit['position'], tiles: Tile[]) =>
  tiles.find(t => posEq(t.pos, p))?.terrain ?? 'plain';

const clampCohesion = (value: number): Cohesion =>
  Math.max(-2, Math.min(2, value)) as Cohesion;

const cohesionOf = (unit: Unit): Cohesion => unit.cohesion ?? 0;

const supportBonusFor = (unit: Unit, allUnits: Unit[]): number =>
  allUnits.some(o =>
    o.id !== unit.id &&
    sameTeam(o.side, unit.side) &&
    chebyshev(o.position, unit.position) === 1,
  ) ? 1 : 0;

const scoreFor = (
  unit: Unit,
  opp: Unit,
  allUnits: Unit[],
  tiles: Tile[],
  isAttacker: boolean,
): number => {
  let s = unit.strength;
  s += unit.morale;
  s += cohesionOf(unit);
  s += supportBonusFor(unit, allUnits);
  if (!isInCommand(unit, allUnits)) s -= 1;

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
  grid?: { width: number; height: number },
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

  const cohesionDeltas = new Map<string, number>();
  const cohesionReasons = new Map<string, NonNullable<Extract<BattleEvent, { kind: 'cohesion-changed' }>['reason']>>();
  const addCohesionDelta = (
    unitId: string,
    delta: number,
    reason: NonNullable<Extract<BattleEvent, { kind: 'cohesion-changed' }>['reason']>,
  ) => {
    cohesionDeltas.set(unitId, (cohesionDeltas.get(unitId) ?? 0) + delta);
    cohesionReasons.set(unitId, reason);
  };

  if ((result === 'defender-retreats' || result === 'defender-broken') &&
      isInCommand(attacker, allUnits)) {
    addCohesionDelta(attacker.id, 1, 'won-attack');
  }
  if (result === 'attacker-repulsed' || result === 'attacker-broken') {
    addCohesionDelta(attacker.id, -1, 'took-damage');
    if (isInCommand(defender, allUnits)) addCohesionDelta(defender.id, 1, 'held-firm');
  }
  if (attackerLoss > 0) addCohesionDelta(attacker.id, -1, 'took-damage');
  if (defenderLoss > 0) addCohesionDelta(defender.id, -1, 'took-damage');

  events.push({
    kind: 'attack-resolved',
    attackerId: attacker.id, defenderId: defender.id,
    result, attackerLoss, defenderLoss,
    attackerScore: aScore, defenderScore: dScore,
  });

  const eliminatedIds = new Set<string>();
  let updatedUnits = allUnits
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

  for (const eliminatedId of eliminatedIds) {
    const eliminated = allUnits.find(u => u.id === eliminatedId);
    if (!eliminated) continue;
    for (const unit of allUnits) {
      if (
        unit.id !== eliminatedId &&
        sameTeam(unit.side, eliminated.side) &&
        chebyshev(unit.position, eliminated.position) === 1
      ) {
        addCohesionDelta(unit.id, -1, 'nearby-friendly-eliminated');
      }
    }
  }

  const retreatingId =
    result === 'defender-retreats' ? defender.id :
    (result === 'attacker-repulsed' || result === 'attacker-broken') ? attacker.id :
    null;
  const retreating = retreatingId ? updatedUnits.find(u => u.id === retreatingId) : null;

  const legalRetreat = (unit: Unit, threat: Unit): Pos | null => {
    if (!grid) return null;
    const occupied = new Set(updatedUnits
      .filter(other => other.id !== unit.id)
      .map(other => `${other.position.x},${other.position.y}`));
    const currentDistance = chebyshev(unit.position, threat.position);
    const candidates = neighbors4(unit.position)
      .filter(pos => inBounds(pos, grid))
      .filter(pos => !occupied.has(`${pos.x},${pos.y}`))
      .filter(pos => terrainCost(terrainAt(pos, tiles)) < Infinity)
      .filter(pos => chebyshev(pos, threat.position) > currentDistance);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, pos) =>
      chebyshev(pos, threat.position) > chebyshev(best, threat.position) ? pos : best,
    candidates[0]);
  };

  const routedIds = new Map<string, Extract<BattleEvent, { kind: 'unit-routed' }>['reason']>();

  if (retreating) {
    const threat = retreating.id === defender.id ? attacker : defender;
    const to = legalRetreat(retreating, threat);
    if (to) {
      updatedUnits = updatedUnits.map(u => u.id === retreating.id
        ? { ...u, position: to, facing: facingFrom(retreating.position, to) }
        : u);
      events.push({
        kind: 'unit-retreated',
        unitId: retreating.id,
        from: retreating.position,
        to,
      });
    } else if (grid) {
      addCohesionDelta(retreating.id, -1, 'blocked-retreat');
      if (cohesionOf(retreating) <= -2) routedIds.set(retreating.id, 'blocked-retreat');
    }
  }

  updatedUnits = updatedUnits.map(u => {
    const delta = cohesionDeltas.get(u.id) ?? 0;
    if (delta < 0 && cohesionOf(u) <= -2) {
      routedIds.set(u.id, routedIds.get(u.id) ?? 'cohesion-collapse');
    }
    if (delta === 0) return { ...u, cohesion: cohesionOf(u) };
    return { ...u, cohesion: clampCohesion(cohesionOf(u) + delta) };
  }).filter(u => !routedIds.has(u.id));

  for (const u of updatedUnits) {
    const before = cohesionOf(allUnits.find(original => original.id === u.id) ?? u);
    const after = cohesionOf(u);
    if (before !== after) {
      const delta = after - before;
      const reason = delta > 0
        ? (u.id === defender.id ? 'held-firm' : 'won-attack')
        : 'took-damage';
      events.push({
        kind: 'cohesion-changed',
        unitId: u.id,
        from: before,
        to: after,
        reason: cohesionReasons.get(u.id) ?? reason,
      });
    }
  }

  for (const [unitId, reason] of routedIds) {
    events.push({ kind: 'unit-routed', unitId, reason });
  }

  for (const id of eliminatedIds) {
    events.push({ kind: 'unit-eliminated', unitId: id });
  }

  return { updatedUnits, events };
}
