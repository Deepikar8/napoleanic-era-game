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
});
