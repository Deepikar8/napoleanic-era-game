import { create } from 'zustand';
import type { GameState, Pos, Formation, Scenario } from '../engine/types';
import { beginBattle, moveUnit, attack, changeFormation, endTurn, checkVictory } from '../engine';
import { runAiTurn, type AiDifficulty } from '../engine/ai';
import { replayUpTo, eventUnitIds } from '../engine/replay';
import { applyScenarioTriggers } from '../engine/triggers';
import { localStorageBackend, newRunId } from './save';
import { campaignScenarios } from '../scenarios';
import {
  playTurnDrum, playFifeFlourish, setMuted as soundSetMuted,
  playAttackThump, playEliminationGong, playRetreatSlide,
} from '../sound';
import type { BattleEvent } from '../engine/types';

const playEventSound = (e: BattleEvent) => {
  switch (e.kind) {
    case 'attack-resolved':  playAttackThump(); break;
    case 'unit-eliminated':  playEliminationGong(); break;
    case 'unit-retreated':   playRetreatSlide(); break;
    default: /* silent */ break;
  }
};

const unitName = (id: string, units: { id: string; name?: string }[]): string =>
  units.find(u => u.id === id)?.name ?? id;

const moraleFlavour = (m: 1 | 2 | 3): string => {
  switch (m) {
    case 1: return 'Conscripts! They falter at the first volley.';
    case 2: return 'Veterans. They stand firm.';
    case 3: return 'Elite Guard. We will bleed for every yard.';
  }
};

const captionForEvent = (e: BattleEvent, units: { id: string; name?: string }[]): string | null => {
  switch (e.kind) {
    case 'unit-moved':        return `${unitName(e.unitId, units)} moved to (${e.to.x}, ${e.to.y})`;
    case 'formation-changed': return `${unitName(e.unitId, units)} formed ${e.to}`;
    case 'attack-resolved':   return `${unitName(e.attackerId, units)} attacks ${unitName(e.defenderId, units)} — ${e.result}`;
    case 'morale-revealed':   return `${unitName(e.unitId, units)}: ${moraleFlavour(e.morale)}`;
    case 'unit-eliminated':   return `${unitName(e.unitId, units)} eliminated`;
    case 'unit-retreated':    return `${unitName(e.unitId, units)} retreats`;
    case 'trigger-fired':     return e.flavour ?? null;
    case 'turn-started':
    case 'turn-ended':
    case 'victory':
      return null;
  }
};

export type Screen = 'splash' | 'campaign-menu' | 'dispatch' | 'battle' | 'battle-end' | 'campaign-end' | 'replay';

interface Store {
  // Run state
  runId: string | null;
  state: GameState | null;
  scenario: Scenario | null;
  history: GameState[];   // for in-turn undo
  // UI
  screen: Screen;
  selectedUnitId: string | null;
  hoveredEnemyId: string | null;
  helpOpen: boolean;
  solo: boolean;
  muted: boolean;
  showDetails: boolean;
  aiDifficulty: AiDifficulty;
  errorMessage: string | null;
  isAnimating: boolean;
  animatingHighlightIds: string[];
  animatingMessage: string | null;

  // Actions
  startNewRun(scenario: Scenario): void;
  loadRun(runId: string, scenario: Scenario): void;
  goto(screen: Screen): void;
  selectUnit(id: string | null): void;
  hoverEnemy(id: string | null): void;
  doMove(to: Pos): void;
  doAttack(defenderId: string): void;
  doFormation(to: Formation): void;
  doEndTurn(): void;
  undo(): void;
  saveCurrent(): void;
  advanceAfterBattle(): void;
  toggleHelp(): void;
  setSolo(b: boolean): void;
  setMuted(b: boolean): void;
  setAiDifficulty(d: AiDifficulty): void;
  toggleDetails(): void;
  flashError(msg: string): void;
  clearError(): void;
}

export const useGame = create<Store>((set, get) => ({
  runId: null, state: null, scenario: null, history: [],
  screen: 'splash', selectedUnitId: null, hoveredEnemyId: null,
  helpOpen: false,
  solo: false,
  muted: false,
  showDetails: true,
  aiDifficulty: 'normal',
  errorMessage: null,
  isAnimating: false,
  animatingHighlightIds: [],
  animatingMessage: null,

  startNewRun(scenario) {
    const initial = beginBattle(scenario);
    set({
      runId: newRunId(), state: initial, scenario,
      history: [initial], screen: 'dispatch',
      selectedUnitId: null, hoveredEnemyId: null,
    });
  },

  loadRun(runId, scenario) {
    const loaded = localStorageBackend.load(runId);
    if (!loaded) return;
    set({
      runId, state: loaded.state, scenario,
      history: [loaded.state], screen: 'battle',
      selectedUnitId: null, hoveredEnemyId: null,
    });
  },

  goto(screen) { set({ screen }); },
  selectUnit(id) { set({ selectedUnitId: id }); },
  hoverEnemy(id) { set({ hoveredEnemyId: id }); },

  doMove(to) {
    if (get().isAnimating) return;
    const { state, scenario, selectedUnitId, history } = get();
    if (!state || !scenario || !selectedUnitId) return;
    try {
      const r = moveUnit(state, selectedUnitId, to,
        { tiles: scenario.tiles, grid: scenario.grid });
      const t = applyScenarioTriggers(r.state, scenario);
      const v = checkVictory(t.state, scenario.victory);
      set({
        state: t.state, history: [...history, t.state],
        screen: v.kind === 'decided' ? 'battle-end' : 'battle',
      });
      if (v.kind === 'decided') playFifeFlourish();
    } catch (e) { get().flashError(e instanceof Error ? e.message : String(e)); }
  },

  doAttack(defenderId) {
    if (get().isAnimating) return;
    const { state, scenario, selectedUnitId, history } = get();
    if (!state || !scenario || !selectedUnitId) return;
    try {
      const r = attack(state, selectedUnitId, defenderId);
      for (const ev of r.events) playEventSound(ev);
      const t = applyScenarioTriggers(r.state, scenario);
      const v = checkVictory(t.state, scenario.victory);
      set({
        state: t.state, history: [...history, t.state],
        selectedUnitId: null,
        screen: v.kind === 'decided' ? 'battle-end' : 'battle',
      });
      if (v.kind === 'decided') playFifeFlourish();
    } catch (e) { get().flashError(e instanceof Error ? e.message : String(e)); }
  },

  doFormation(to) {
    if (get().isAnimating) return;
    const { state, scenario, selectedUnitId, history } = get();
    if (!state || !scenario || !selectedUnitId) return;
    try {
      const r = changeFormation(state, selectedUnitId, to);
      const t = applyScenarioTriggers(r.state, scenario);
      const v = checkVictory(t.state, scenario.victory);
      set({
        state: t.state, history: [...history, t.state],
        screen: v.kind === 'decided' ? 'battle-end' : 'battle',
      });
      if (v.kind === 'decided') playFifeFlourish();
    } catch (e) { get().flashError(e instanceof Error ? e.message : String(e)); }
  },

  doEndTurn() {
    if (get().isAnimating) return;
    const { state, scenario, runId } = get();
    if (!state || !scenario) return;
    playTurnDrum();
    const r = endTurn(state);
    const t = applyScenarioTriggers(r.state, scenario);
    const v = checkVictory(t.state, scenario.victory);
    set({
      state: t.state, history: [t.state],
      selectedUnitId: null, hoveredEnemyId: null,
      screen: v.kind === 'decided' ? 'battle-end' : 'battle',
    });
    if (v.kind === 'decided') playFifeFlourish();
    if (runId) get().saveCurrent();

    const after = get();
    if (after.scenario && after.state &&
        after.state.currentSide !== 'french' &&
        after.solo &&
        after.screen === 'battle') {

      const aiScenario = after.scenario;
      const stateBeforeAi = after.state;
      const ai = runAiTurn(stateBeforeAi, aiScenario, after.aiDifficulty);
      const v2 = checkVictory(ai.state, aiScenario.victory);

      const startIdx = stateBeforeAi.log.length;       // first new event index
      const endIdx = ai.state.log.length - 1;          // last event index in final log

      const fullLog = ai.state.log;

      // Did the AI take any meaningful action? (Anything other than the
      // turn-ended/turn-started bookends.) If not, surface that to the
      // player instead of an empty animation.
      const aiActed = fullLog
        .slice(startIdx, endIdx + 1)
        .some(e => e.kind !== 'turn-ended' && e.kind !== 'turn-started');

      // No new events to animate — apply directly.
      if (endIdx < startIdx) {
        set({
          state: ai.state, history: [ai.state],
          screen: v2.kind === 'decided' ? 'battle-end' : 'battle',
        });
        if (v2.kind === 'decided') playFifeFlourish();
        if (runId) get().saveCurrent();
        return;
      }

      const stoodFirmMsg = 'Coalition stood firm — no movement this turn.';
      const initialMsg = aiActed ? 'Coalition is moving…' : stoodFirmMsg;
      set({ isAnimating: true, animatingHighlightIds: [], animatingMessage: initialMsg });

      let i = startIdx;
      const stepDelay = 900;

      const finish = () => {
        // Bail out if the player navigated away mid-animation. The tick()
        // function's check is similar but doesn't cover the final scheduled
        // setTimeout; without this guard, finish() can clobber a Splash /
        // Campaign Menu screen and overwrite the saved state with stale data.
        const cur = get();
        if (!cur.isAnimating || cur.scenario !== aiScenario) return;
        set({
          state: ai.state, history: [ai.state],
          screen: v2.kind === 'decided' ? 'battle-end' : 'battle',
          isAnimating: false, animatingHighlightIds: [], animatingMessage: null,
        });
        if (v2.kind === 'decided') playFifeFlourish();
        if (runId) get().saveCurrent();
      };

      const tick = () => {
        // Bail out if the player navigated away or a new run started mid-animation.
        const cur = get();
        if (!cur.isAnimating || cur.scenario !== aiScenario) return;

        const ev = fullLog[i];
        const intermediate = replayUpTo(
          aiScenario, stateBeforeAi.decisionsTaken, fullLog, i, campaignScenarios,
        );
        const caption = captionForEvent(ev, intermediate.units);
        set({
          state: intermediate,
          animatingHighlightIds: eventUnitIds(ev),
          animatingMessage: caption ?? (aiActed ? 'Coalition is moving…' : stoodFirmMsg),
        });
        playEventSound(ev);

        if (i >= endIdx) {
          // Hold the last frame a beat longer so the caption is readable.
          setTimeout(finish, stepDelay + (aiActed ? 0 : 600));
          return;
        }
        i++;
        setTimeout(tick, stepDelay);
      };

      setTimeout(tick, stepDelay);
    }
  },

  undo() {
    const { history } = get();
    if (history.length <= 1) return;
    const trimmed = history.slice(0, -1);
    set({ state: trimmed[trimmed.length - 1], history: trimmed });
  },

  saveCurrent() {
    const { runId, state } = get();
    if (!runId || !state) return;
    localStorageBackend.save({ runId, savedAt: Date.now(), state });
  },

  toggleHelp() { set(s => ({ helpOpen: !s.helpOpen })); },
  setSolo(b) { set({ solo: b }); },
  setMuted(b) { soundSetMuted(b); set({ muted: b }); },
  setAiDifficulty(d) { set({ aiDifficulty: d }); },
  toggleDetails() { set(s => ({ showDetails: !s.showDetails })); },
  flashError(msg) {
    set({ errorMessage: msg });
    setTimeout(() => {
      if (useGame.getState().errorMessage === msg) set({ errorMessage: null });
    }, 2200);
  },
  clearError() { set({ errorMessage: null }); },

  advanceAfterBattle() {
    const { state, scenario, runId } = get();
    if (!state || !scenario || !runId) return;
    const v = checkVictory(state, scenario.victory);
    const idx = state.scenarioIndex;

    // Always record this battle's outcome before either advancing or ending the
    // campaign. Without this, the final battle was never appended and a
    // 7-for-7 'Historical Triumph' was unreachable on the campaign-end screen.
    const finishedOutcome = {
      scenarioId: state.scenarioId,
      victor: v.kind === 'decided' ? v.victor : state.currentSide,
      turnsTaken: state.turn,
    };
    const allOutcomes = [...state.outcomes, finishedOutcome];

    const next = campaignScenarios[idx + 1];
    if (!next) {
      set({
        state: { ...state, outcomes: allOutcomes },
        screen: 'campaign-end',
      });
      get().saveCurrent();
      return;
    }
    // Forward decisionsTaken AND pendingPatches into the next scenario so
    // earlier choices' downstream effects materialise.
    const nextState = beginBattle(next, state.decisionsTaken, state.pendingPatches);
    nextState.scenarioIndex = idx + 1;
    nextState.outcomes = allOutcomes;
    nextState.decisionsTaken = state.decisionsTaken;
    set({ state: nextState, scenario: next, history: [nextState], screen: 'dispatch' });
    get().saveCurrent();
  },
}));
