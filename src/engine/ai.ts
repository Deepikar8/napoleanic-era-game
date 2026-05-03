import type { GameState, Scenario, Unit, BattleEvent, Pos } from './types';
import { chebyshev } from './grid';
import { legalMoves } from './movement';
import { moveUnit, attack, changeFormation, endTurn } from './turn';

const nearestEnemy = (unit: Unit, units: Unit[]): Unit | null => {
  const enemies = units.filter(u => u.side !== unit.side);
  if (enemies.length === 0) return null;
  return enemies.reduce((best, e) =>
    chebyshev(unit.position, e.position) < chebyshev(unit.position, best.position) ? e : best
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

  // Per-unit general rule for the active side
  const activeUnits = s.units.filter(u => u.side === s.currentSide && !u.hasActed);
  for (const unit of activeUnits) {
    const enemy = nearestEnemy(unit, s.units);
    if (!enemy) break;

    if (chebyshev(unit.position, enemy.position) === 1) {
      // attack if possible
      try {
        const r = attack(s, unit.id, enemy.id);
        s = r.state; events.push(...r.events);
      } catch { /* skip */ }
      continue;
    }

    if (scenario.ai.generalRule === 'defensive') {
      // don't advance
      continue;
    }

    if (scenario.ai.generalRule === 'aggressive' && !unit.hasMoved) {
      const moves = legalMoves(unit, s.units, scenario);
      const target = stepToward(unit.position, enemy.position, moves);
      if (target) {
        try {
          const r = moveUnit(s, unit.id, target,
            { tiles: scenario.tiles, grid: scenario.grid });
          s = r.state; events.push(...r.events);
        } catch { /* skip */ }
      }
    }
  }

  const r = endTurn(s);
  s = r.state; events.push(...r.events);
  return { state: s, events };
}
