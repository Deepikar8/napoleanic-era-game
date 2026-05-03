import { create } from 'zustand';
import type { GameState, Pos, Formation, Scenario } from '../engine/types';
import { beginBattle, moveUnit, attack, changeFormation, endTurn, checkVictory } from '../engine';
import { localStorageBackend, newRunId } from './save';

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
}

export const useGame = create<Store>((set, get) => ({
  runId: null, state: null, scenario: null, history: [],
  screen: 'splash', selectedUnitId: null, hoveredEnemyId: null,

  startNewRun(scenario) {
    const initial = beginBattle(scenario);
    set({
      runId: newRunId(), state: initial, scenario,
      history: [initial], screen: 'battle',
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
    const { state, scenario, selectedUnitId, history } = get();
    if (!state || !scenario || !selectedUnitId) return;
    try {
      const r = moveUnit(state, selectedUnitId, to,
        { tiles: scenario.tiles, grid: scenario.grid });
      set({ state: r.state, history: [...history, r.state] });
    } catch (e) { console.warn(e); }
  },

  doAttack(defenderId) {
    const { state, selectedUnitId, history } = get();
    if (!state || !selectedUnitId) return;
    try {
      const r = attack(state, selectedUnitId, defenderId);
      set({ state: r.state, history: [...history, r.state], selectedUnitId: null });
    } catch (e) { console.warn(e); }
  },

  doFormation(to) {
    const { state, selectedUnitId, history } = get();
    if (!state || !selectedUnitId) return;
    try {
      const r = changeFormation(state, selectedUnitId, to);
      set({ state: r.state, history: [...history, r.state] });
    } catch (e) { console.warn(e); }
  },

  doEndTurn() {
    const { state, scenario, runId } = get();
    if (!state || !scenario) return;
    const r = endTurn(state);
    const v = checkVictory(r.state, scenario.victory);
    set({
      state: r.state, history: [r.state],
      selectedUnitId: null, hoveredEnemyId: null,
      screen: v.kind === 'decided' ? 'battle-end' : 'battle',
    });
    if (runId) get().saveCurrent();
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
}));
