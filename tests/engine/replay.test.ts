import { describe, it, expect } from 'vitest';
import { wertingen } from '../../src/scenarios/01-wertingen';
import { beginBattle, moveUnit, endTurn, attack } from '../../src/engine';
import { replayUpTo } from '../../src/engine/replay';
import { applyScenarioTriggers } from '../../src/engine/triggers';
import type { Scenario } from '../../src/engine/types';

describe('replay rebuild', () => {
  it('matches engine state at every step of a Wertingen sequence', () => {
    const ctx = { tiles: wertingen.tiles, grid: wertingen.grid };
    let s = beginBattle(wertingen);
    const snapshots = [s];

    s = moveUnit(s, 'fr-lasalle', { x: 2, y: 3 }, ctx).state;  snapshots.push(s);
    s = endTurn(s).state;                                       snapshots.push(s);
    s = endTurn(s).state;                                       snapshots.push(s);
    s = moveUnit(s, 'fr-lasalle', { x: 3, y: 3 }, ctx).state;   snapshots.push(s);

    const finalEvents = s.log;

    for (let k = 0; k < snapshots.length; k++) {
      const expected = snapshots[k];
      const idx = expected.log.length - 1;
      const rebuilt = replayUpTo(wertingen, expected.decisionsTaken, finalEvents, idx);

      expect(rebuilt.currentSide).toBe(expected.currentSide);
      expect(rebuilt.turn).toBe(expected.turn);
      expect(rebuilt.units.length).toBe(expected.units.length);
      for (const u of expected.units) {
        const r = rebuilt.units.find(x => x.id === u.id)!;
        expect(r.position).toEqual(u.position);
        expect(r.strength).toBe(u.strength);
        expect(r.formation).toBe(u.formation);
        expect(r.facing).toBe(u.facing);
        expect(!!r.hasMoved).toBe(!!u.hasMoved);
        expect(!!r.hasActed).toBe(!!u.hasActed);
      }
    }
  });

  it('preserves the event log up to the rebuild index', () => {
    const ctx = { tiles: wertingen.tiles, grid: wertingen.grid };
    let s = beginBattle(wertingen);
    s = moveUnit(s, 'fr-lasalle', { x: 2, y: 3 }, ctx).state;
    s = endTurn(s).state;

    // Rebuild at intermediate steps and verify log slices match.
    const fullLog = s.log;
    for (let i = 0; i <= fullLog.length - 1; i++) {
      const r = replayUpTo(wertingen, s.decisionsTaken, fullLog, i);
      expect(r.log.length).toBe(i + 1);
      expect(r.log).toEqual(fullLog.slice(0, i + 1));
    }
  });

  it('reconstructs downstream decision patches when allScenarios is supplied', () => {
    // Set up: a "haslach" scenario with a decision whose chosen option
    // applies a downstream patch to a "krems" scenario, and a "krems"
    // scenario where the patch lowers fr-mortier's morale.
    const decisionId = 'haslach-pre';
    const haslach: Scenario = {
      id: 'haslach', title: 'Haslach', briefingMd: 't',
      grid: { width: 5, height: 5 }, tiles: [],
      units: [
        { id: 'fr1', side: 'french', type: 'line-infantry',
          position: { x: 0, y: 0 }, facing: 'E', formation: 'line',
          strength: 4, morale: 2 },
      ],
      victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 2 } }],
      ai: { generalRule: 'defensive', triggers: [] },
      preBattleDecision: {
        id: decisionId,
        promptMd: 'choose',
        options: [
          {
            label: 'Send forward (downstream consequence)',
            patch: {},
            downstreamPatches: {
              krems: { unitOverrides: [{ id: 'fr-mortier', morale: 1 }] },
            },
          },
          { label: 'Hold back', patch: {} },
        ],
      },
    };
    const krems: Scenario = {
      id: 'krems', title: 'Krems', briefingMd: 't',
      grid: { width: 5, height: 5 }, tiles: [],
      units: [
        { id: 'fr-mortier', side: 'french', type: 'line-infantry',
          position: { x: 0, y: 0 }, facing: 'E', formation: 'line',
          strength: 4, morale: 3 },                  // baseline morale = 3 elite
      ],
      victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 2 } }],
      ai: { generalRule: 'defensive', triggers: [] },
    };
    const allScenarios = [haslach, krems];
    const decisions = [{ decisionId, optionIndex: 0 }];
    const initial = beginBattle(krems, decisions, {
      krems: [{ unitOverrides: [{ id: 'fr-mortier', morale: 1 as const }] }],
    });

    // Without allScenarios — patches lost, baseline morale (3) shows.
    const withoutCtx = replayUpTo(krems, decisions, initial.log, 0);
    expect(withoutCtx.units.find(u => u.id === 'fr-mortier')!.morale).toBe(3);

    // With allScenarios — patch re-derived, replayed morale matches live (1).
    const withCtx = replayUpTo(krems, decisions, initial.log, 0, allScenarios);
    expect(withCtx.units.find(u => u.id === 'fr-mortier')!.morale).toBe(1);
  });

  it('reconstructs a trigger-fired event (added unit reappears at correct position)', () => {
    // Tiny scenario whose trigger spawns a Russian Guard unit when a French
    // unit reaches (3, 3). After running it live, replayUpTo should show
    // the unit appearing at the same step the trigger fired in the live run.
    const scn: Scenario = {
      id: 'trig', title: 'Trig', briefingMd: 't',
      grid: { width: 5, height: 5 }, tiles: [],
      units: [
        { id: 'fr1', side: 'french', type: 'line-infantry',
          position: { x: 0, y: 3 }, facing: 'E', formation: 'line',
          strength: 4, morale: 2 },
        { id: 'au1', side: 'austrian', type: 'line-infantry',
          position: { x: 4, y: 0 }, facing: 'W', formation: 'line',
          strength: 4, morale: 2 },
      ],
      victory: [
        { for: 'french', kind: 'survive-turns', args: { turns: 5 } },
        { for: 'austrian', kind: 'survive-turns', args: { turns: 5 } },
      ],
      ai: { generalRule: 'defensive', triggers: [] },
      scenarioTriggers: [{
        id: 'guard-arrives',
        when: { kind: 'whenSideHasUnitOnTile', side: 'french', pos: { x: 3, y: 3 } },
        patch: {
          unitsAdded: [{
            id: 'ru-guard', side: 'russian', type: 'heavy-cavalry',
            position: { x: 4, y: 4 }, facing: 'W', formation: 'line',
            strength: 4, morale: 3,
          }],
        },
        flavour: 'Guard charge!',
      }],
    };

    // Live: move fr1 step by step toward (3, 3); trigger fires when it lands there.
    let s = beginBattle(scn);
    s = moveUnit(s, 'fr1', { x: 1, y: 3 }, { tiles: scn.tiles, grid: scn.grid }).state;
    // Manual trigger-eval after the move — store.ts does this in normal flow.
    s = applyScenarioTriggers(s, scn).state;

    // No trigger yet (fr1 not at (3,3))
    expect(s.units.find(u => u.id === 'ru-guard')).toBeUndefined();

    // End french turn and resume to fresh fr1 budget
    s = { ...s, units: s.units.map(u => u.id === 'fr1' ? { ...u, hasMoved: false, hasActed: false } : u) };
    s = moveUnit(s, 'fr1', { x: 3, y: 3 }, { tiles: scn.tiles, grid: scn.grid }).state;
    s = applyScenarioTriggers(s, scn).state;
    expect(s.units.find(u => u.id === 'ru-guard')).toBeTruthy();

    // Replay rebuild at the FINAL log index — trigger-fired event in log
    // should bring the Russian Guard unit back at the same position.
    const idx = s.log.length - 1;
    const rebuilt = replayUpTo(scn, s.decisionsTaken, s.log, idx);
    const guard = rebuilt.units.find(u => u.id === 'ru-guard');
    expect(guard).toBeTruthy();
    expect(guard!.position).toEqual({ x: 4, y: 4 });
    expect(guard!.morale).toBe(3);
    expect(rebuilt.triggersFired).toContain('guard-arrives');
  });

  it('handles attack-resolved events (strength + hasActed mutations)', () => {
    const tiny: Scenario = {
      id: 'tiny',
      title: 'Tiny',
      briefingMd: 'tiny',
      grid: { width: 4, height: 4 },
      tiles: [],
      units: [
        { id: 'fr-a', side: 'french',  type: 'line-infantry',
          position: { x: 1, y: 1 }, facing: 'E', formation: 'line',
          strength: 4, morale: 2 },
        { id: 'au-b', side: 'austrian', type: 'line-infantry',
          position: { x: 2, y: 1 }, facing: 'W', formation: 'line',
          strength: 4, morale: 2 },
      ],
      victory: [
        { for: 'french',   kind: 'eliminate-unit', args: { unitId: 'au-b' } },
        { for: 'austrian', kind: 'survive-turns',  args: { turns: 5 } },
      ],
      ai: { generalRule: 'defensive', triggers: [] },
    };

    let s = beginBattle(tiny);
    s = attack(s, 'fr-a', 'au-b').state;

    const idx = s.log.length - 1;
    const rebuilt = replayUpTo(tiny, s.decisionsTaken, s.log, idx);

    expect(rebuilt.units.length).toBe(s.units.length);
    for (const u of s.units) {
      const r = rebuilt.units.find(x => x.id === u.id);
      expect(r).toBeTruthy();
      expect(r!.position).toEqual(u.position);
      expect(r!.strength).toBe(u.strength);
      expect(!!r!.hasActed).toBe(!!u.hasActed);
    }
  });
});
