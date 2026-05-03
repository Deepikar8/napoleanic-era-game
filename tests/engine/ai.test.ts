import { describe, it, expect } from 'vitest';
import type { Unit, Scenario } from '../../src/engine/types';
import { beginBattle } from '../../src/engine';
import { runAiTurn } from '../../src/engine/ai';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

const aggressiveScenario: Scenario = {
  id: 'ai-test', title: 'AI test', briefingMd: 't',
  grid: { width: 8, height: 8 }, tiles: [],
  units: [
    u({ id: 'fr1', side: 'french',  position: { x: 0, y: 0 } }),
    u({ id: 'au1', side: 'austrian', position: { x: 5, y: 0 }, type: 'light-cavalry' }),
  ],
  victory: [{ for: 'french', kind: 'eliminate-unit', args: { unitId: 'au1' } }],
  ai: { generalRule: 'aggressive', triggers: [] },
};

describe('AI', () => {
  it('aggressive AI moves the active-side unit toward nearest enemy', () => {
    let state = beginBattle(aggressiveScenario);
    state = { ...state, currentSide: 'austrian' };  // pretend it's the AI's turn
    const r = runAiTurn(state, aggressiveScenario);
    const au1 = r.state.units.find(u => u.id === 'au1')!;
    // Should have moved closer to fr1 (lower x)
    expect(au1.position.x).toBeLessThan(5);
  });

  it('emits turn-ended event after acting', () => {
    let state = beginBattle(aggressiveScenario);
    state = { ...state, currentSide: 'austrian' };
    const r = runAiTurn(state, aggressiveScenario);
    expect(r.events.some(e => e.kind === 'turn-ended')).toBe(true);
  });

  it('defensive AI does not advance when no enemy is adjacent', () => {
    const defensiveScenario: Scenario = {
      ...aggressiveScenario,
      ai: { generalRule: 'defensive', triggers: [] },
    };
    let state = beginBattle(defensiveScenario);
    state = { ...state, currentSide: 'austrian' };
    const r = runAiTurn(state, defensiveScenario);
    const au1 = r.state.units.find(u => u.id === 'au1')!;
    expect(au1.position).toEqual({ x: 5, y: 0 });
  });

  it('triggered actions fire on whenTurn', () => {
    const triggered: Scenario = {
      ...aggressiveScenario,
      ai: {
        generalRule: 'defensive',
        triggers: [{
          whenTurn: 1,
          do: [{ kind: 'change-formation', unitId: 'au1', to: 'square' }],
        }],
      },
    };
    let state = beginBattle(triggered);
    state = { ...state, currentSide: 'austrian' };
    const r = runAiTurn(state, triggered);
    expect(r.state.units.find(u => u.id === 'au1')!.formation).toBe('square');
  });

  it('skips suicidal attacks (gap <= -2): a strength-1 line attacking a fresh grenadier stands down', () => {
    const scn: Scenario = {
      id: 'suicide', title: 'Suicide', briefingMd: 't',
      grid: { width: 4, height: 4 }, tiles: [],
      units: [
        // au1 is weak (strength 1, morale 1) attacking a much stronger grenadier
        u({ id: 'au1', side: 'austrian', position: { x: 1, y: 1 }, strength: 1, morale: 1 }),
        u({ id: 'fr1', side: 'french',   position: { x: 2, y: 1 }, strength: 4, morale: 3, type: 'grenadier' }),
      ],
      victory: [{ for: 'french', kind: 'eliminate-unit', args: { unitId: 'au1' } }],
      ai: { generalRule: 'aggressive', triggers: [] },
    };
    let state = beginBattle(scn);
    state = { ...state, currentSide: 'austrian' };
    const r = runAiTurn(state, scn);
    // au1's strength should be unchanged; it should NOT have attacked.
    const au1 = r.state.units.find(u => u.id === 'au1')!;
    expect(au1.strength).toBe(1);
    expect(r.events.some(e => e.kind === 'attack-resolved')).toBe(false);
  });

  it('infantry switches to square when an adjacent enemy cavalry threatens', () => {
    const scn: Scenario = {
      id: 'square', title: 'Square', briefingMd: 't',
      grid: { width: 4, height: 4 }, tiles: [],
      units: [
        u({ id: 'au-inf', side: 'austrian', position: { x: 1, y: 1 }, type: 'line-infantry', formation: 'line' }),
        u({ id: 'fr-cav', side: 'french',   position: { x: 2, y: 1 }, type: 'light-cavalry' }),
      ],
      victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 3 } }],
      ai: { generalRule: 'defensive', triggers: [] },
    };
    let state = beginBattle(scn);
    state = { ...state, currentSide: 'austrian' };
    const r = runAiTurn(state, scn);
    expect(r.state.units.find(u => u.id === 'au-inf')!.formation).toBe('square');
    // Should not have attacked — formation switch consumes the action.
    expect(r.events.some(e => e.kind === 'attack-resolved')).toBe(false);
  });

  it('easy difficulty attacks any adjacent enemy without preview math', () => {
    // Same setup as the suicidal-attack test, but on easy: AI should still
    // attack the much-stronger grenadier even though the predicted result is
    // bad.
    const scn: Scenario = {
      id: 'easy-vs-suicide', title: 'Easy', briefingMd: 't',
      grid: { width: 4, height: 4 }, tiles: [],
      units: [
        u({ id: 'au1', side: 'austrian', position: { x: 1, y: 1 }, strength: 1, morale: 1 }),
        u({ id: 'fr1', side: 'french',   position: { x: 2, y: 1 }, strength: 4, morale: 3, type: 'grenadier' }),
      ],
      victory: [{ for: 'french', kind: 'eliminate-unit', args: { unitId: 'au1' } }],
      ai: { generalRule: 'aggressive', triggers: [] },
    };
    let state = beginBattle(scn);
    state = { ...state, currentSide: 'austrian' };
    const r = runAiTurn(state, scn, 'easy');
    expect(r.events.some(e => e.kind === 'attack-resolved')).toBe(true);
  });

  it('hard difficulty refuses attacks at gap=-1 that normal would still take', () => {
    // Attacker: strength 4 + morale 1 = 5, +1 line vs infantry = 6.
    // Defender: strength 4 + morale 2 = 6, +1 line vs infantry = 7.
    // Gap = -1 → normal attacks (>= -1 threshold), hard refuses (>= 0 threshold).
    const scn: Scenario = {
      id: 'hard-marginal', title: 'Hard', briefingMd: 't',
      grid: { width: 4, height: 4 }, tiles: [],
      units: [
        u({ id: 'au1', side: 'austrian', position: { x: 1, y: 1 }, strength: 4, morale: 1 }),
        u({ id: 'fr1', side: 'french',   position: { x: 2, y: 1 }, strength: 4, morale: 2, moraleRevealed: true }),
      ],
      victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 3 } }],
      ai: { generalRule: 'defensive', triggers: [] },
    };
    let state = beginBattle(scn);
    state = { ...state, currentSide: 'austrian' };
    const rNormal = runAiTurn(state, scn, 'normal');
    const rHard = runAiTurn(state, scn, 'hard');
    expect(rNormal.events.some(e => e.kind === 'attack-resolved')).toBe(true);
    expect(rHard.events.some(e => e.kind === 'attack-resolved')).toBe(false);
  });

  it('picks the best-gap adjacent target instead of the first one', () => {
    // Two adjacent enemies: a strong grenadier (gap unfavorable) and a weak conscript
    // (gap favorable). AI should attack the conscript.
    const scn: Scenario = {
      id: 'pick', title: 'Pick', briefingMd: 't',
      grid: { width: 4, height: 4 }, tiles: [],
      units: [
        u({ id: 'au1', side: 'austrian', position: { x: 1, y: 1 }, strength: 4, morale: 3 }),
        u({ id: 'fr-strong', side: 'french', position: { x: 0, y: 1 }, type: 'grenadier', strength: 4, morale: 3 }),
        u({ id: 'fr-weak',   side: 'french', position: { x: 2, y: 1 }, strength: 1, morale: 1 }),
      ],
      victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 3 } }],
      ai: { generalRule: 'aggressive', triggers: [] },
    };
    let state = beginBattle(scn);
    state = { ...state, currentSide: 'austrian' };
    const r = runAiTurn(state, scn);
    const attackEv = r.events.find(e => e.kind === 'attack-resolved');
    expect(attackEv).toBeTruthy();
    if (attackEv && attackEv.kind === 'attack-resolved') {
      expect(attackEv.defenderId).toBe('fr-weak');
    }
  });
});
