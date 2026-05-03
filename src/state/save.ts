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

let warned = false;

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
        const parsed = JSON.parse(raw) as SavedRun;
        if (parsed.state?.schemaVersion === 1) out.push(parsed);
      } catch { /* skip */ }
    }
    return out.sort((a, b) => b.savedAt - a.savedAt);
  },

  load(runId) {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY_PREFIX + runId);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SavedRun;
      if (parsed.state.schemaVersion !== 1) return null;
      return parsed;
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
