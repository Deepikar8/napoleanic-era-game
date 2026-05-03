import type { GameState } from '../engine/types';

const KEY_PREFIX = 'napoleonic-save-';
const MAX_RUNS = 3;

export interface SavedRun {
  runId: string;
  savedAt: number;       // unix ms
  state: GameState;
}

export interface SaveBackend {
  list(): SavedRun[];
  load(runId: string): SavedRun | null;
  save(run: SavedRun): void;
  remove(runId: string): void;
}

// localStorage is user-editable; we can't trust the contents past a JSON parse.
// Validate the shape we actually need before handing it to the engine.

const SIDES = new Set(['french', 'austrian', 'russian']);
const FORMATIONS = new Set(['line', 'column', 'square']);
const FACINGS = new Set(['N', 'E', 'S', 'W']);
const STRENGTHS = new Set([1, 2, 3, 4]);
const MORALES = new Set([1, 2, 3]);
const PHASES = new Set(['orders', 'end-of-turn']);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isPos = (v: unknown): boolean =>
  isObject(v) && typeof v.x === 'number' && typeof v.y === 'number';

const isUnit = (v: unknown): boolean => {
  if (!isObject(v)) return false;
  if (typeof v.id !== 'string') return false;
  if (typeof v.side !== 'string' || !SIDES.has(v.side)) return false;
  if (typeof v.type !== 'string') return false;          // engine validates type internally
  if (!isPos(v.position)) return false;
  if (typeof v.facing !== 'string' || !FACINGS.has(v.facing)) return false;
  if (typeof v.formation !== 'string' || !FORMATIONS.has(v.formation)) return false;
  if (typeof v.strength !== 'number' || !STRENGTHS.has(v.strength)) return false;
  if (typeof v.morale !== 'number' || !MORALES.has(v.morale)) return false;
  return true;
};

export function isValidGameState(v: unknown): v is GameState {
  if (!isObject(v)) return false;
  if (v.schemaVersion !== 1) return false;
  if (v.campaignId !== 'ulm-austerlitz-1805') return false;
  if (typeof v.scenarioIndex !== 'number' || v.scenarioIndex < 0) return false;
  if (typeof v.scenarioId !== 'string') return false;
  if (typeof v.currentSide !== 'string' || !SIDES.has(v.currentSide)) return false;
  if (typeof v.turn !== 'number' || v.turn < 1) return false;
  if (typeof v.phase !== 'string' || !PHASES.has(v.phase)) return false;
  if (!Array.isArray(v.units) || !v.units.every(isUnit)) return false;
  if (!Array.isArray(v.log)) return false;
  if (!Array.isArray(v.decisionsTaken)) return false;
  if (!Array.isArray(v.outcomes)) return false;
  if (v.selectedUnitId !== null && typeof v.selectedUnitId !== 'string') return false;
  if (v.pendingDecisionId !== null && typeof v.pendingDecisionId !== 'string') return false;
  // pendingPatches / triggersFired added in v1.11.0; missing in older saves is OK.
  if (v.pendingPatches !== undefined && !isObject(v.pendingPatches)) return false;
  if (v.triggersFired !== undefined && !Array.isArray(v.triggersFired)) return false;
  return true;
}

export function isValidSavedRun(v: unknown): v is SavedRun {
  if (!isObject(v)) return false;
  if (typeof v.runId !== 'string') return false;
  if (typeof v.savedAt !== 'number') return false;
  if (!isValidGameState(v.state)) return false;
  return true;
}

let warned = false;

// Forward-compat: migrate older saves that were written before v1.11.0
// added pendingPatches and triggersFired to GameState.
function migrate(run: SavedRun): SavedRun {
  return {
    ...run,
    state: {
      ...run.state,
      pendingPatches: run.state.pendingPatches ?? {},
      triggersFired: run.state.triggersFired ?? [],
    },
  };
}

export const localStorageBackend: SaveBackend = {
  list() {
    if (typeof localStorage === 'undefined') return [];
    const out: SavedRun[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(KEY_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed: unknown = JSON.parse(raw);
        if (isValidSavedRun(parsed)) out.push(migrate(parsed));
      } catch { /* skip */ }
    }
    return out.sort((a, b) => b.savedAt - a.savedAt);
  },

  load(runId) {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY_PREFIX + runId);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isValidSavedRun(parsed) ? migrate(parsed) : null;
    } catch { return null; }
  },

  save(run) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(KEY_PREFIX + run.runId, JSON.stringify(run));
      const all = this.list();
      if (all.length > MAX_RUNS) {
        for (const r of all.slice(MAX_RUNS)) this.remove(r.runId);
      }
    } catch (e) {
      if (!warned) {
        console.warn('Saving disabled (localStorage unavailable):', e);
        warned = true;
      }
    }
  },

  remove(runId) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY_PREFIX + runId);
  },
};

export function newRunId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
