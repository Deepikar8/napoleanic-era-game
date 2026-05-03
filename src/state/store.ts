import { create } from 'zustand';
import type { GameState, Pos, Formation, Scenario } from '../engine/types';
import { beginBattle, moveUnit, attack, changeFormation, endTurn, checkVictory } from '../engine';
import { runAiTurn } from '../engine/ai';
import { replayUpTo, eventUnitIds } from '../engine/replay';
import { localStorageBackend, newRunId } from './save';
import { campaignScenarios } from '../scenarios';
import { playTurnDrum, playFifeFlourish, setMuted as soundSetMuted } from '../sound';

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
  errorMessage: string | null;
  isAnimating: boolean;
  animatingHighlightIds: string[];

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
  showDetails: false,
  errorMessage: null,
  isAnimating: false,
  animatingHighlightIds: [],

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
      set({ state: r.state, history: [...history, r.state] });
    } catch (e) { get().flashError(e instanceof Error ? e.message : String(e)); }
  },

  doAttack(defenderId) {
    if (get().isAnimating) return;
    const { state, selectedUnitId, history } = get();
    if (!state || !selectedUnitId) return;
    try {
      const r = attack(state, selectedUnitId, defenderId);
      set({ state: r.state, history: [...history, r.state], selectedUnitId: null });
    } catch (e) { get().flashError(e instanceof Error ? e.message : String(e)); }
  },

  doFormation(to) {
    if (get().isAnimating) return;
    const { state, selectedUnitId, history } = get();
    if (!state || !selectedUnitId) return;
    try {
      const r = changeFormation(state, selectedUnitId, to);
      set({ state: r.state, history: [...history, r.state] });
    } catch (e) { get().flashError(e instanceof Error ? e.message : String(e)); }
  },

  doEndTurn() {
    if (get().isAnimating) return;
    const { state, scenario, runId } = get();
    if (!state || !scenario) return;
    playTurnDrum();
    const r = endTurn(state);
    const v = checkVictory(r.state, scenario.victory);
    set({
      state: r.state, history: [r.state],
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
      const ai = runAiTurn(stateBeforeAi, aiScenario);
      const v2 = checkVictory(ai.state, aiScenario.victory);

      const startIdx = stateBeforeAi.log.length;       // first new event index
      const endIdx = ai.state.log.length - 1;          // last event index in final log

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

      set({ isAnimating: true, animatingHighlightIds: [] });

      const fullLog = ai.state.log;
      let i = startIdx;
      const stepDelay = 600;

      const finish = () => {
        set({
          state: ai.state, history: [ai.state],
          screen: v2.kind === 'decided' ? 'battle-end' : 'battle',
          isAnimating: false, animatingHighlightIds: [],
        });
        if (v2.kind === 'decided') playFifeFlourish();
        if (runId) get().saveCurrent();
      };

      const tick = () => {
        // Bail out if the player navigated away or a new run started mid-animation.
        const cur = get();
        if (!cur.isAnimating || cur.scenario !== aiScenario) return;

        const ev = fullLog[i];
        const intermediate = replayUpTo(aiScenario, stateBeforeAi.decisionsTaken, fullLog, i);
        set({ state: intermediate, animatingHighlightIds: eventUnitIds(ev) });

        if (i >= endIdx) {
          setTimeout(finish, stepDelay);
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
    const next = campaignScenarios[idx + 1];
    if (!next) { set({ screen: 'campaign-end' }); return; }
    const nextState = beginBattle(next);
    nextState.scenarioIndex = idx + 1;
    nextState.outcomes = [
      ...state.outcomes,
      { scenarioId: state.scenarioId, victor: v.kind === 'decided' ? v.victor : state.currentSide, turnsTaken: state.turn },
    ];
    set({ state: nextState, scenario: next, history: [nextState], screen: 'dispatch' });
    get().saveCurrent();
  },
}));
