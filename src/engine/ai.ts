import type { GameState, Scenario, Unit, BattleEvent, Pos } from './types';
import { chebyshev } from './grid';
import { legalMoves } from './movement';
import { moveUnit, attack, changeFormation, endTurn } from './turn';
import { previewAttack } from './preview';
import { sameTeam, isOnActiveSide } from './sides';
import { applyScenarioTriggers } from './triggers';

export type AiDifficulty = 'easy' | 'normal' | 'hard';

const isCavalry = (t: Unit['type']) => t === 'light-cavalry' || t === 'heavy-cavalry';
const isInfantry = (t: Unit['type']) =>
  t === 'line-infantry' || t === 'light-infantry' || t === 'grenadier';

const nearestEnemy = (unit: Unit, units: Unit[]): Unit | null => {
  const enemies = units.filter(u => !sameTeam(u.side, unit.side));
  if (enemies.length === 0) return null;
  return enemies.reduce((best, e) =>
    chebyshev(unit.position, e.position) < chebyshev(unit.position, best.position) ? e : best
  );
};

const weakestEnemy = (unit: Unit, units: Unit[]): Unit | null => {
  const enemies = units.filter(u => !sameTeam(u.side, unit.side));
  if (enemies.length === 0) return null;
  return enemies.reduce((best, e) =>
    e.strength < best.strength ? e : best
  );
};

const stepToward = (_from: Pos, to: Pos, legal: Pos[]): Pos | null => {
  if (legal.length === 0) return null;
  return legal.reduce((best, p) =>
    chebyshev(p, to) < chebyshev(best, to) ? p : best,
  legal[0]);
};

export function runAiTurn(
  state: GameState, scenario: Scenario,
  difficulty: AiDifficulty = 'normal',
): { state: GameState; events: BattleEvent[] } {
  let s = state;
  const events: BattleEvent[] = [];

  // Apply triggers first
  for (const trig of scenario.ai.triggers) {
    if (trig.whenTurn !== undefined && trig.whenTurn !== s.turn) continue;
    if (trig.whenSideStrengthBelow) {
      const totalSide = s.units
        .filter(u => u.side === trig.whenSideStrengthBelow!.side)
        .reduce((a, u) => a + u.strength, 0);
      if (totalSide >= trig.whenSideStrengthBelow.threshold) continue;
    }
    for (const a of trig.do) {
      try {
        if (a.kind === 'move') {
          const r = moveUnit(s, a.unitId, a.to,
            { tiles: scenario.tiles, grid: scenario.grid });
          s = r.state; events.push(...r.events);
        } else if (a.kind === 'attack') {
          const r = attack(s, a.unitId, a.targetId);
          s = r.state; events.push(...r.events);
        } else if (a.kind === 'change-formation') {
          const r = changeFormation(s, a.unitId, a.to);
          s = r.state; events.push(...r.events);
        }
      } catch { /* trigger action illegal — skip */ }
    }
  }

  // Per-unit decision loop. Coalition turns let both austrian and russian
  // units act, so use the team-aware predicate rather than strict side equality.
  const activeUnits = s.units.filter(u => isOnActiveSide(u.side, s.currentSide) && !u.hasActed);
  for (const unit of activeUnits) {
    // Refresh "current" view of this unit, since previous iterations may have changed strengths.
    const cur = s.units.find(u => u.id === unit.id);
    if (!cur) continue;        // unit was eliminated mid-turn

    const adjEnemies = s.units.filter(o =>
      !sameTeam(o.side, cur.side) && chebyshev(o.position, cur.position) === 1);

    // 1. Defensive formation switch (normal+) — infantry threatened by adjacent cavalry forms square.
    if (difficulty !== 'easy' &&
        isInfantry(cur.type) && cur.formation !== 'square' &&
        adjEnemies.some(e => isCavalry(e.type)) && !cur.hasActed) {
      try {
        const r = changeFormation(s, cur.id, 'square');
        s = r.state; events.push(...r.events);
        continue;
      } catch { /* fall through */ }
    }

    // 2. Attack adjacent enemy
    if (adjEnemies.length > 0 && !cur.hasActed) {
      if (difficulty === 'easy') {
        // Easy: attack the first adjacent enemy. No preview math, no skip-if-bad.
        try {
          const r = attack(s, cur.id, adjEnemies[0].id);
          s = r.state; events.push(...r.events);
          continue;
        } catch { /* skip */ }
      } else {
        // Normal/Hard: use preview to pick best target; skip predicted losses.
        let bestTarget: Unit | null = null;
        let bestGap = -Infinity;
        for (const e of adjEnemies) {
          const p = previewAttack(cur, e, s.units, scenario.tiles);
          const gap = p.attackerScore - p.defenderScore;
          if (gap > bestGap || (gap === bestGap && bestTarget && e.strength < bestTarget.strength)) {
            bestGap = gap;
            bestTarget = e;
          }
        }
        // Hard plays only winning attacks (gap >= 0). Normal accepts trades / repulsed (gap >= -1).
        const skipThreshold = difficulty === 'hard' ? 0 : -1;
        if (bestTarget && bestGap >= skipThreshold) {
          try {
            const r = attack(s, cur.id, bestTarget.id);
            s = r.state; events.push(...r.events);
            continue;
          } catch { /* skip */ }
        }
        if (scenario.ai.generalRule === 'defensive') continue;
      }
    }

    // 3. Movement (aggressive only — defensive sits)
    if (scenario.ai.generalRule === 'aggressive' && !cur.hasMoved) {
      const moves = legalMoves(cur, s.units, scenario);
      // Hard: target the weakest reachable enemy (flanking). Normal/Easy: nearest enemy.
      const enemy = difficulty === 'hard'
        ? weakestEnemy(cur, s.units)
        : nearestEnemy(cur, s.units);
      if (!enemy) break;
      const target = stepToward(cur.position, enemy.position, moves);
      if (target) {
        try {
          const r = moveUnit(s, cur.id, target,
            { tiles: scenario.tiles, grid: scenario.grid });
          s = r.state; events.push(...r.events);
        } catch { /* skip */ }
      }
    }
  }

  const r = endTurn(s);
  s = r.state; events.push(...r.events);

  // Triggers must fire for AI-side conditions (whenTurn, whenSideStrengthBelow,
  // whenSideHasUnitOnTile for AI side). Otherwise they'd silently wait for the
  // next player action. Applied AFTER endTurn so turn-counter-based conditions
  // see the new turn number.
  const t = applyScenarioTriggers(s, scenario);
  s = t.state; events.push(...t.events);

  return { state: s, events };
}
