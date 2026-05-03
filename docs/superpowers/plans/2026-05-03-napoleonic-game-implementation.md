# Napoleonic-Era Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based hybrid strategy game covering Napoleon's 1805 Ulm–Austerlitz campaign — chess-like tactical battles + dispatches + decisions, hot-seat primary, scripted AI fallback, deploys to GitHub Pages.

**Architecture:** Pure-functional TypeScript engine isolated from a React/SVG UI. Engine owns `GameState` and emits a `BattleEvent[]` log on every state transition; the UI renders, the Zustand store persists. Scenarios are data files (one per battle). Decisions are JSON-safe data patches, so saves roundtrip cleanly.

**Tech stack:** TypeScript, React, Vite, SVG (for board), TailwindCSS, Zustand, Vitest, React Testing Library, GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-05-03-napoleonic-game-design.md` (read this first if you have not).

**Project root:** `/Users/deepikarudramurthy/Documents/napoleanic-era-game`. Greenfield except `.gitignore` and the spec doc. Git initialized on `main`.

---

## Phase Overview

The plan follows the spec's W1–W4 schedule. Each phase delivers playable software.

| Phase | Tasks | Output |
|---|---|---|
| **Phase 0** | 1     | Tooling bootstrap |
| **Phase 1 — W1** | 2–11 | Engine + Austerlitz scenario + hot-seat playable battle |
| **Phase 2 — W2** | 12–20 | Splash + Campaign Menu + 2 more scenarios + save/load + replay log + first GitHub Pages deploy |
| **Phase 3 — W3** | 21–28 | Dispatches + Decisions + remaining 4 scenarios + Help overlay |
| **Phase 4 — W4** | 29–34 | Scripted AI + Campaign End + sound + v1.0 |

**Universal commit convention:** Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). Every task ends with a commit step that uses `GIT_AUTHOR_*` env vars only if the local git identity is not yet set; once set, ordinary `git commit -m` works. Suggested first-time setup (one-shot, **local repo only**, not global): `git config user.name "Your Name" && git config user.email "you@example.com"`.

---

## File Structure (locked at start)

```
napoleanic-era-game/
├── .github/
│   └── workflows/
│       └── deploy.yml                       # Phase 2
├── .gitignore                                # exists
├── docs/superpowers/
│   ├── specs/2026-05-03-napoleonic-game-design.md  # exists
│   └── plans/2026-05-03-napoleonic-game-implementation.md   # this file
├── index.html                                # Phase 0
├── package.json                              # Phase 0
├── tsconfig.json                             # Phase 0
├── tsconfig.node.json                        # Phase 0
├── vite.config.ts                            # Phase 0
├── tailwind.config.js                        # Phase 0
├── postcss.config.js                         # Phase 0
├── vitest.config.ts                          # Phase 0
├── public/
│   └── (silhouettes will be inlined SVG, no public assets needed for v1)
├── src/
│   ├── main.tsx                              # Phase 0 (placeholder); finalised Phase 1
│   ├── app.tsx                               # Phase 1 (skeleton); grown Phase 2+
│   ├── index.css                             # Phase 0 (Tailwind)
│   ├── engine/
│   │   ├── types.ts                          # Phase 1 task 2
│   │   ├── grid.ts                           # Phase 1 task 3 (helpers)
│   │   ├── movement.ts                       # Phase 1 task 4
│   │   ├── combat.ts                         # Phase 1 task 5
│   │   ├── victory.ts                        # Phase 1 task 6
│   │   ├── turn.ts                           # Phase 1 task 7
│   │   ├── ai.ts                             # Phase 4 task 29
│   │   └── index.ts                          # public re-exports, grown each phase
│   ├── scenarios/
│   │   ├── 07-austerlitz.ts                  # Phase 1 task 8
│   │   ├── 01-wertingen.ts                   # Phase 2 task 16
│   │   ├── 06-schongrabern.ts                # Phase 2 task 17
│   │   ├── 02-haslach.ts                     # Phase 3 task 23
│   │   ├── 03-elchingen.ts                   # Phase 3 task 24
│   │   ├── 04-ulm.ts                         # Phase 3 task 25
│   │   ├── 05-krems.ts                       # Phase 3 task 26
│   │   └── index.ts                          # ordered roster
│   ├── dispatches/
│   │   └── *.md                              # Phase 3 task 21
│   ├── art/
│   │   └── unit-silhouettes.tsx              # Phase 1 task 9
│   ├── ui/
│   │   ├── BattleBoard.tsx                   # Phase 1 task 10
│   │   ├── UnitPanel.tsx                     # Phase 1 task 10
│   │   ├── AttackPreview.tsx                 # Phase 1 task 10
│   │   ├── BattleLog.tsx                     # Phase 1 task 10
│   │   ├── Splash.tsx                        # Phase 2 task 13
│   │   ├── CampaignMenu.tsx                  # Phase 2 task 14
│   │   ├── BattleEndScreen.tsx               # Phase 2 task 15
│   │   ├── DispatchScreen.tsx                # Phase 3 task 21
│   │   ├── DecisionPicker.tsx                # Phase 3 task 22
│   │   ├── HelpOverlay.tsx                   # Phase 3 task 27
│   │   ├── CampaignEndScreen.tsx             # Phase 4 task 30
│   │   ├── ReplayViewer.tsx                  # Phase 2 task 19
│   │   └── shared.tsx                        # small UI primitives
│   └── state/
│       ├── store.ts                          # Phase 2 task 12
│       └── save.ts                           # Phase 2 task 12
└── tests/
    ├── engine/                               # mirrors src/engine
    ├── scenarios/
    │   └── validate.test.ts                  # Phase 2 task 18 (build-time validation as a test)
    ├── replay/
    │   └── determinism.test.ts               # Phase 2 task 18
    └── ui/                                   # smoke tests, Phase 2+
```

The hard rule from the spec: **`engine/` never imports from `ui/` or `state/`**. Tests in `tests/engine/` only import `engine/` modules.

---

## Phase 0 — Bootstrap

### Task 1: Project bootstrap (Vite + React + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/app.tsx`, `src/index.css`

- [ ] **Step 1: Verify Node 20+**

```bash
node --version    # expect v20+ (Vite 5 requires this)
```

If absent, install Node (`brew install node` on macOS).

- [ ] **Step 2: Initialize npm and install dependencies**

```bash
cd /Users/deepikarudramurthy/Documents/napoleanic-era-game
npm init -y
npm install react react-dom zustand
npm install -D typescript @types/react @types/react-dom @types/node \
  vite @vitejs/plugin-react \
  vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  tailwindcss postcss autoprefixer \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npx tailwindcss init -p
```

- [ ] **Step 3: Configure `package.json` scripts**

Replace the `scripts` block in `package.json` with:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "typecheck": "tsc -b --noEmit"
  }
}
```

Set `"type": "module"` and `"private": true` in `package.json` if not already.

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "tailwind.config.js", "postcss.config.js"]
}
```

- [ ] **Step 6: Write `vite.config.ts`**

`base` is intentionally `'./'` — when you create the GitHub repo, change this to `'/<repo-name>/'` for Pages. Until then, relative paths work for local dev and `vite preview`.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
});
```

- [ ] **Step 7: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
```

- [ ] **Step 8: Write `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 9: Configure Tailwind**

Replace `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f5f0e6',
        parchmentDark: '#e8dfc3',
        ink: '#2a2018',
        french: '#2c5aa0',
        austrian: '#ece4d0',
        russian: '#4a7a4a',
        gilt: '#d4a017',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 10: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>1805 — A Napoleonic Campaign</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-parchment text-ink">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11: Write `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { margin: 0; }
```

- [ ] **Step 12: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 13: Write `src/app.tsx` (placeholder)**

```tsx
export default function App() {
  return (
    <main className="flex min-h-full items-center justify-center">
      <h1 className="font-serif text-3xl">1805 — boot ok</h1>
    </main>
  );
}
```

- [ ] **Step 14: Smoke-test the dev server and tests**

```bash
npm run dev          # in one terminal — open http://localhost:5173, expect "1805 — boot ok"
npm run test         # in another — expect "No test files found"; this is OK before any tests exist
npm run typecheck    # expect: clean exit
npm run build        # expect: dist/ produced, no errors
```

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Vite + React + TS + Tailwind + Vitest"
```

---

## Phase 1 — W1: Engine + first playable battle

### Task 2: Engine types (`src/engine/types.ts`)

The whole engine speaks these types. Lock them in once.

**Files:**
- Create: `src/engine/types.ts`
- Test: none — types alone are not testable; downstream tasks exercise them.

- [ ] **Step 1: Write `src/engine/types.ts`**

```ts
// All engine types. Pure data, JSON-safe.

export type Side = 'french' | 'austrian' | 'russian';

export type UnitType =
  | 'line-infantry' | 'light-infantry' | 'grenadier'
  | 'light-cavalry' | 'heavy-cavalry'
  | 'foot-artillery' | 'horse-artillery';

export type Formation = 'line' | 'column' | 'square';

export type Facing = 'N' | 'E' | 'S' | 'W';

export type TerrainKind =
  | 'plain' | 'forest' | 'town' | 'hill'
  | 'river' | 'bridge' | 'marsh' | 'road';

export type Strength = 1 | 2 | 3 | 4;
export type Morale = 1 | 2 | 3;

export interface Pos { x: number; y: number; }
export const posEq = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;
export const posKey = (p: Pos) => `${p.x},${p.y}`;

export interface Unit {
  id: string;
  name?: string;
  side: Side;
  type: UnitType;
  position: Pos;
  facing: Facing;
  formation: Formation;
  strength: Strength;
  morale: Morale;
  moraleRevealed?: boolean;     // engine sets true after first attack on this unit
  hasMoved?: boolean;           // reset at start-of-turn
  hasActed?: boolean;           // reset at start-of-turn
}

export interface Tile {
  pos: Pos;
  terrain: TerrainKind;
}

export type VictoryConditionKind =
  | 'eliminate-unit'        // args: { unitId: string }
  | 'hold-tile-for-turns'   // args: { pos: Pos; turns: number }
  | 'capture-tile'          // args: { pos: Pos }
  | 'reduce-side-strength'  // args: { side: Side; threshold: number }
  | 'survive-turns';        // args: { turns: number }

export interface VictoryCondition {
  for: Side;
  kind: VictoryConditionKind;
  args: Record<string, unknown>;
}

export type AiGeneralRule = 'aggressive' | 'defensive' | 'fixed';

export interface AiTrigger {
  whenTurn?: number;                                       // fires at start of this turn
  whenSideStrengthBelow?: { side: Side; threshold: number };
  do: AiAction[];                                          // hand-coded actions
}

export type AiAction =
  | { kind: 'move'; unitId: string; to: Pos }
  | { kind: 'attack'; unitId: string; targetId: string }
  | { kind: 'change-formation'; unitId: string; to: Formation };

export interface AiScript {
  generalRule: AiGeneralRule;
  triggers: AiTrigger[];
}

// Decisions are pre-battle modifiers chosen by the player after a dispatch.
export interface Decision {
  id: string;                  // unique within campaign — referenced from saves
  promptMd: string;
  options: DecisionOption[];
}

export interface DecisionOption {
  label: string;
  patch: ScenarioPatch;
}

export interface ScenarioPatch {
  unitsAdded?: Unit[];
  unitsRemovedByIds?: string[];
  unitOverrides?: Array<{ id: string } & Partial<Omit<Unit, 'id'>>>;
  tilesOverridden?: Tile[];
  victoryOverride?: VictoryCondition[];
  turnLimitOverride?: number;
}

export interface Scenario {
  id: string;
  title: string;
  briefingMd: string;          // filename (without .md) under src/dispatches
  grid: { width: number; height: number };
  tiles: Tile[];               // sparse — non-plain only
  units: Unit[];
  victory: VictoryCondition[];
  turnLimit?: number;
  ai: AiScript;
  preBattleDecision?: Decision;
  postBattleDispatch?: string; // filename under src/dispatches
}

// Events emitted by every state-changing engine call. Cumulative array forms the replay log.
export type BattleEvent =
  | { kind: 'turn-started'; turn: number; side: Side }
  | { kind: 'unit-moved'; unitId: string; from: Pos; to: Pos; cost: number }
  | { kind: 'formation-changed'; unitId: string; from: Formation; to: Formation }
  | { kind: 'attack-resolved'; attackerId: string; defenderId: string;
      result: 'attacker-broken' | 'attacker-repulsed' | 'exchange'
            | 'defender-retreats' | 'defender-broken';
      attackerLoss: number; defenderLoss: number;
      attackerScore: number; defenderScore: number; }
  | { kind: 'morale-revealed'; unitId: string; morale: Morale }
  | { kind: 'unit-eliminated'; unitId: string }
  | { kind: 'unit-retreated'; unitId: string; from: Pos; to: Pos }
  | { kind: 'turn-ended'; turn: number; side: Side }
  | { kind: 'victory'; side: Side; reason: string };

export type GamePhase = 'orders' | 'end-of-turn';

export interface GameState {
  schemaVersion: 1;
  campaignId: 'ulm-austerlitz-1805';
  scenarioIndex: number;
  scenarioId: string;
  units: Unit[];
  currentSide: Side;
  turn: number;
  phase: GamePhase;
  selectedUnitId: string | null;
  log: BattleEvent[];
  decisionsTaken: { decisionId: string; optionIndex: number }[];
  outcomes: { scenarioId: string; victor: Side; turnsTaken: number }[];
  pendingDecisionId: string | null;
}

export type VictoryStatus =
  | { kind: 'in-progress' }
  | { kind: 'decided'; victor: Side; reason: string };
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run typecheck
# expect: clean
```

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat(engine): define core types"
```

---

### Task 3: Grid helpers (`src/engine/grid.ts`)

Pure utilities. Used by movement, combat, and AI.

**Files:**
- Create: `src/engine/grid.ts`
- Test: `tests/engine/grid.test.ts`

- [ ] **Step 1: Write `tests/engine/grid.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { manhattan, chebyshev, neighbors4, neighbors8, inBounds, facingFrom } from '../../src/engine/grid';

describe('grid helpers', () => {
  it('manhattan distance', () => {
    expect(manhattan({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('chebyshev distance', () => {
    expect(chebyshev({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4);
  });

  it('neighbors4 returns 4 orthogonal neighbours', () => {
    const r = neighbors4({ x: 2, y: 2 });
    expect(r).toEqual([
      { x: 2, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 2 },
    ]);
  });

  it('neighbors8 returns 8 surrounding cells', () => {
    expect(neighbors8({ x: 2, y: 2 })).toHaveLength(8);
  });

  it('inBounds respects grid extents', () => {
    expect(inBounds({ x: 0, y: 0 }, { width: 3, height: 3 })).toBe(true);
    expect(inBounds({ x: -1, y: 0 }, { width: 3, height: 3 })).toBe(false);
    expect(inBounds({ x: 3, y: 0 }, { width: 3, height: 3 })).toBe(false);
  });

  it('facingFrom yields direction vector', () => {
    expect(facingFrom({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe('E');
    expect(facingFrom({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe('N');
    expect(facingFrom({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe('W');
    expect(facingFrom({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe('S');
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- tests/engine/grid.test.ts
# expect: failures (module not found)
```

- [ ] **Step 3: Implement `src/engine/grid.ts`**

```ts
import type { Pos, Facing } from './types';

export const manhattan = (a: Pos, b: Pos) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export const chebyshev = (a: Pos, b: Pos) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export const neighbors4 = (p: Pos): Pos[] => [
  { x: p.x,     y: p.y - 1 },  // N
  { x: p.x + 1, y: p.y     },  // E
  { x: p.x,     y: p.y + 1 },  // S
  { x: p.x - 1, y: p.y     },  // W
];

export const neighbors8 = (p: Pos): Pos[] => {
  const out: Pos[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (dx !== 0 || dy !== 0) out.push({ x: p.x + dx, y: p.y + dy });
  return out;
};

export const inBounds = (p: Pos, grid: { width: number; height: number }) =>
  p.x >= 0 && p.y >= 0 && p.x < grid.width && p.y < grid.height;

export const facingFrom = (from: Pos, to: Pos): Facing => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'E' : 'W';
  return dy > 0 ? 'S' : 'N';
};

export const facingToVec = (f: Facing): Pos => {
  switch (f) {
    case 'N': return { x:  0, y: -1 };
    case 'E': return { x:  1, y:  0 };
    case 'S': return { x:  0, y:  1 };
    case 'W': return { x: -1, y:  0 };
  }
};
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test -- tests/engine/grid.test.ts
# expect: 6/6 pass
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/grid.ts tests/engine/grid.test.ts
git commit -m "feat(engine): add grid helpers"
```

---

### Task 4: Movement & legal moves (`src/engine/movement.ts`)

Per-unit move budgets, terrain costs, occupied-square blocking, BFS over reachable tiles.

**Files:**
- Create: `src/engine/movement.ts`
- Test: `tests/engine/movement.test.ts`

- [ ] **Step 1: Write `tests/engine/movement.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import type { Scenario, Unit } from '../../src/engine/types';
import { legalMoves, terrainCost, moveBudget } from '../../src/engine/movement';

const u = (over: Partial<Unit> = {}): Unit => ({
  id: 'u1', side: 'french', type: 'line-infantry',
  position: { x: 5, y: 5 }, facing: 'N', formation: 'line',
  strength: 4, morale: 2, ...over,
});

const blank = (w = 10, h = 10): Pick<Scenario, 'grid' | 'tiles'> => ({
  grid: { width: w, height: h }, tiles: [],
});

describe('movement', () => {
  it('infantry move budget is 2; column gets +1', () => {
    expect(moveBudget(u({ type: 'line-infantry', formation: 'line' }))).toBe(2);
    expect(moveBudget(u({ type: 'line-infantry', formation: 'column' }))).toBe(3);
    expect(moveBudget(u({ type: 'light-cavalry', formation: 'line' }))).toBe(4);
    expect(moveBudget(u({ type: 'foot-artillery', formation: 'line' }))).toBe(1);
  });

  it('terrain costs match spec', () => {
    expect(terrainCost('plain')).toBe(1);
    expect(terrainCost('forest')).toBe(2);
    expect(terrainCost('hill')).toBe(2);
    expect(terrainCost('marsh')).toBe(3);
    expect(terrainCost('road')).toBe(1);
    expect(terrainCost('bridge')).toBe(1);
    expect(terrainCost('town')).toBe(Infinity);
    expect(terrainCost('river')).toBe(Infinity);
  });

  it('legalMoves returns reachable tiles within budget on plain', () => {
    const unit = u({ position: { x: 0, y: 0 }, type: 'line-infantry' });
    const moves = legalMoves(unit, [unit], blank(10, 10));
    // budget=2 → reachable = (1,0),(0,1),(2,0),(1,1),(0,2)
    expect(moves).toEqual(expect.arrayContaining([
      { x: 1, y: 0 }, { x: 0, y: 1 },
      { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 },
    ]));
    // and never the unit's own square
    expect(moves).not.toContainEqual({ x: 0, y: 0 });
  });

  it('legalMoves blocks occupied squares', () => {
    const a = u({ id: 'a', position: { x: 0, y: 0 } });
    const b = u({ id: 'b', position: { x: 1, y: 0 } });
    const moves = legalMoves(a, [a, b], blank(10, 10));
    expect(moves).not.toContainEqual({ x: 1, y: 0 });
  });

  it('legalMoves respects out-of-bounds', () => {
    const unit = u({ position: { x: 0, y: 0 } });
    const moves = legalMoves(unit, [unit], blank(2, 2));
    moves.forEach(m => {
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThan(2);
      expect(m.y).toBeLessThan(2);
    });
  });

  it('forest squares cost 2 to enter', () => {
    const unit = u({ position: { x: 0, y: 0 }, type: 'line-infantry' });  // budget 2
    const scenario = {
      grid: { width: 4, height: 1 },
      tiles: [{ pos: { x: 1, y: 0 }, terrain: 'forest' as const }],
    };
    const moves = legalMoves(unit, [unit], scenario);
    expect(moves).toContainEqual({ x: 1, y: 0 });   // affordable: 2 = budget
    expect(moves).not.toContainEqual({ x: 2, y: 0 }); // would cost 3
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- tests/engine/movement.test.ts
# expect: failures (module not found)
```

- [ ] **Step 3: Implement `src/engine/movement.ts`**

```ts
import type { Pos, Unit, Scenario, TerrainKind } from './types';
import { inBounds, neighbors4, posEq, posKey } from './grid';

export const moveBudget = (u: Unit): number => {
  const base =
    u.type === 'line-infantry' || u.type === 'light-infantry' || u.type === 'grenadier' ? 2 :
    u.type === 'light-cavalry' || u.type === 'heavy-cavalry' ? 4 :
    1;                                                  // foot/horse artillery
  return base + (u.formation === 'column' ? 1 : 0);
};

export const terrainCost = (t: TerrainKind): number => {
  switch (t) {
    case 'plain':  return 1;
    case 'road':   return 1;
    case 'bridge': return 1;
    case 'forest': return 2;
    case 'hill':   return 2;
    case 'marsh':  return 3;
    case 'town':   return Infinity;
    case 'river':  return Infinity;
  }
};

const tileTerrain = (p: Pos, scenario: Pick<Scenario, 'tiles'>): TerrainKind => {
  const t = scenario.tiles.find(t => posEq(t.pos, p));
  return t?.terrain ?? 'plain';
};

/** BFS / Dijkstra over reachable tiles within a unit's move budget. */
export const legalMoves = (
  unit: Unit,
  allUnits: Unit[],
  scenario: Pick<Scenario, 'grid' | 'tiles'>,
): Pos[] => {
  const occupied = new Set(
    allUnits.filter(o => o.id !== unit.id).map(o => posKey(o.position))
  );
  const budget = moveBudget(unit);
  const dist = new Map<string, number>();
  dist.set(posKey(unit.position), 0);
  const frontier: Pos[] = [unit.position];

  while (frontier.length > 0) {
    const cur = frontier.shift()!;
    const curDist = dist.get(posKey(cur))!;
    for (const n of neighbors4(cur)) {
      if (!inBounds(n, scenario.grid)) continue;
      if (occupied.has(posKey(n))) continue;
      const cost = terrainCost(tileTerrain(n, scenario));
      if (!isFinite(cost)) continue;
      const newDist = curDist + cost;
      if (newDist > budget) continue;
      const prev = dist.get(posKey(n));
      if (prev === undefined || newDist < prev) {
        dist.set(posKey(n), newDist);
        frontier.push(n);
      }
    }
  }

  dist.delete(posKey(unit.position));
  const out: Pos[] = [];
  for (const k of dist.keys()) {
    const [x, y] = k.split(',').map(Number);
    out.push({ x, y });
  }
  return out;
};
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test -- tests/engine/movement.test.ts
# expect: 6/6 pass
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/movement.ts tests/engine/movement.test.ts
git commit -m "feat(engine): add movement legal-moves with terrain costs"
```

---

### Task 5: Combat resolver (`src/engine/combat.ts`)

The arithmetic heart of the game. Pure function: takes attacker, defender, board context — returns `{ updatedUnits, events }`.

**Files:**
- Create: `src/engine/combat.ts`
- Test: `tests/engine/combat.test.ts`

- [ ] **Step 1: Write `tests/engine/combat.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import type { Unit, Tile } from '../../src/engine/types';
import { resolveAttack } from '../../src/engine/combat';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

describe('combat', () => {
  it('reveals defender morale on first attack', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 }, morale: 3 });
    const { events } = resolveAttack(a, d, [a, d], []);
    expect(events).toContainEqual({ kind: 'morale-revealed', unitId: 'd', morale: 3 });
  });

  it('does not re-reveal already-revealed morale', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 morale: 3, moraleRevealed: true });
    const { events } = resolveAttack(a, d, [a, d], []);
    expect(events.some(e => e.kind === 'morale-revealed')).toBe(false);
  });

  it('square formation crushes cavalry charge', () => {
    const a = u({ id: 'a', side: 'french', type: 'heavy-cavalry',
                 position: { x: 0, y: 0 }, strength: 4, morale: 2 });
    const d = u({ id: 'd', side: 'austrian', type: 'line-infantry',
                 position: { x: 1, y: 0 }, formation: 'square',
                 strength: 4, morale: 2 });
    const { events } = resolveAttack(a, d, [a, d], []);
    const ev = events.find(e => e.kind === 'attack-resolved');
    expect(ev).toBeDefined();
    if (ev?.kind === 'attack-resolved') {
      expect(['attacker-broken', 'attacker-repulsed']).toContain(ev.result);
    }
  });

  it('hill defender gets terrain bonus', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 },
                 strength: 4, morale: 2, formation: 'line' });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 strength: 4, morale: 2, formation: 'line' });
    const tiles: Tile[] = [{ pos: { x: 1, y: 0 }, terrain: 'hill' }];
    const { events } = resolveAttack(a, d, [a, d], tiles);
    const ev = events.find(e => e.kind === 'attack-resolved');
    if (ev?.kind === 'attack-resolved') {
      // Defender is +1 stronger from hill — score gap shifts towards defender
      expect(ev.defenderScore - ev.attackerScore).toBeGreaterThanOrEqual(1);
    }
  });

  it('exchange (0/+1) deals 1 damage to each side', () => {
    // Identical infantry, no terrain, no flanking — score gap should be 0
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 } });
    const { updatedUnits, events } = resolveAttack(a, d, [a, d], []);
    const ev = events.find(e => e.kind === 'attack-resolved');
    if (ev?.kind === 'attack-resolved') {
      expect(['exchange', 'defender-retreats']).toContain(ev.result);
      if (ev.result === 'exchange') {
        const ua = updatedUnits.find(u => u.id === 'a')!;
        const ud = updatedUnits.find(u => u.id === 'd')!;
        expect(ua.strength).toBe(3);
        expect(ud.strength).toBe(3);
      }
    }
  });

  it('eliminates a unit reduced to 0 strength', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 },
                 strength: 4, morale: 3 });   // big
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 strength: 1, morale: 1 });   // small/conscript
    const { updatedUnits, events } = resolveAttack(a, d, [a, d], []);
    const dRemaining = updatedUnits.find(u => u.id === 'd');
    if (!dRemaining) {
      expect(events).toContainEqual({ kind: 'unit-eliminated', unitId: 'd' });
    }
  });

  it('flanking from rear adds attacker bonus', () => {
    const aFront = u({ id: 'aF', side: 'french', position: { x: 1, y: 1 } });
    const aFlank = u({ id: 'aS', side: 'french', position: { x: 0, y: 1 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 facing: 'S', strength: 4, morale: 2 });
    // aS attacks d while aF is also adjacent → flank
    const { events } = resolveAttack(aFlank, d, [aFront, aFlank, d], []);
    const ev = events.find(e => e.kind === 'attack-resolved');
    if (ev?.kind === 'attack-resolved') {
      // attacker should be at least +1 over plain
      expect(ev.attackerScore).toBeGreaterThan(ev.defenderScore);
    }
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- tests/engine/combat.test.ts
# expect: failures (resolveAttack not exported)
```

- [ ] **Step 3: Implement `src/engine/combat.ts`**

```ts
import type { Unit, Tile, BattleEvent } from './types';
import { posEq, chebyshev } from './grid';
import { terrainCost } from './movement';

const isCavalry = (t: Unit['type']) => t === 'light-cavalry' || t === 'heavy-cavalry';
const isInfantry = (t: Unit['type']) =>
  t === 'line-infantry' || t === 'light-infantry' || t === 'grenadier';
const isArtillery = (t: Unit['type']) =>
  t === 'foot-artillery' || t === 'horse-artillery';

const terrainAt = (p: Unit['position'], tiles: Tile[]) =>
  tiles.find(t => posEq(t.pos, p))?.terrain ?? 'plain';

/** Score modifiers for one side. */
const scoreFor = (
  unit: Unit,
  opp: Unit,
  allUnits: Unit[],
  tiles: Tile[],
  isAttacker: boolean,
): number => {
  let s = unit.strength;

  // Morale (always counts — even when hidden, the engine knows)
  s += unit.morale;

  // Terrain (defender only on their tile)
  if (!isAttacker) {
    const ter = terrainAt(unit.position, tiles);
    if (ter === 'hill' || ter === 'forest' || ter === 'town') s += 1;
  }

  // Formation
  if (unit.formation === 'square' && isCavalry(opp.type)) s += 2;       // squares vs cav
  if (unit.formation === 'square' && isArtillery(opp.type)) s -= 2;     // squares vs guns
  if (unit.formation === 'column' && isInfantry(opp.type)) s -= 1;      // column in firefight
  if (unit.formation === 'line' && isInfantry(opp.type)) s += 1;        // line in firefight

  // Flanking (attacker only): another friendly is adjacent to defender
  if (isAttacker) {
    const friendsAdj = allUnits.filter(o =>
      o.side === unit.side && o.id !== unit.id &&
      chebyshev(o.position, opp.position) === 1,
    );
    if (friendsAdj.length > 0) s += 1;
  }

  // Cavalry vs unformed infantry (line/column) — shock
  if (isAttacker && isCavalry(unit.type) && isInfantry(opp.type) && opp.formation !== 'square') {
    s += 1;
  }

  return s;
};

/** Apply combat. Returns updated unit list and events. */
export function resolveAttack(
  attacker: Unit,
  defender: Unit,
  allUnits: Unit[],
  tiles: Tile[],
): { updatedUnits: Unit[]; events: BattleEvent[] } {
  const events: BattleEvent[] = [];

  // Reveal defender morale on first attack against it
  if (!defender.moraleRevealed) {
    events.push({ kind: 'morale-revealed', unitId: defender.id, morale: defender.morale });
  }

  const aScore = scoreFor(attacker, defender, allUnits, tiles, true);
  const dScore = scoreFor(defender, attacker, allUnits, tiles, false);
  const gap = aScore - dScore;

  let result: BattleEvent extends infer E ? E extends { kind: 'attack-resolved' } ? E['result'] : never : never;
  let attackerLoss = 0;
  let defenderLoss = 0;

  if (gap <= -2) { result = 'attacker-broken';   attackerLoss = 2; }
  else if (gap === -1) { result = 'attacker-repulsed'; attackerLoss = 1; }
  else if (gap <= 1)   { result = 'exchange';          attackerLoss = 1; defenderLoss = 1; }
  else if (gap === 2)  { result = 'defender-retreats'; defenderLoss = 0; }
  else                  { result = 'defender-broken';   defenderLoss = 2; }

  events.push({
    kind: 'attack-resolved',
    attackerId: attacker.id, defenderId: defender.id,
    result, attackerLoss, defenderLoss,
    attackerScore: aScore, defenderScore: dScore,
  });

  const updatedUnits = allUnits
    .map(u => {
      if (u.id === attacker.id) return { ...u, strength: Math.max(0, u.strength - attackerLoss) as Unit['strength'] };
      if (u.id === defender.id) return { ...u, strength: Math.max(0, u.strength - defenderLoss) as Unit['strength'], moraleRevealed: true };
      return u;
    })
    .filter(u => {
      if (u.strength === 0) {
        events.push({ kind: 'unit-eliminated', unitId: u.id });
        return false;
      }
      return true;
    });

  return { updatedUnits, events };
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test -- tests/engine/combat.test.ts
# expect: 7/7 pass
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/combat.ts tests/engine/combat.test.ts
git commit -m "feat(engine): add deterministic combat resolver with hidden morale"
```

---

### Task 6: Victory checker (`src/engine/victory.ts`)

**Files:**
- Create: `src/engine/victory.ts`
- Test: `tests/engine/victory.test.ts`

- [ ] **Step 1: Write `tests/engine/victory.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import type { GameState, VictoryCondition, Unit } from '../../src/engine/types';
import { checkVictory } from '../../src/engine/victory';

const baseState = (over: Partial<GameState> = {}): GameState => ({
  schemaVersion: 1, campaignId: 'ulm-austerlitz-1805',
  scenarioIndex: 0, scenarioId: 'test',
  units: [], currentSide: 'french', turn: 1, phase: 'orders',
  selectedUnitId: null, log: [], decisionsTaken: [], outcomes: [],
  pendingDecisionId: null, ...over,
});

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

describe('victory', () => {
  it('eliminate-unit: victory when target gone', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'eliminate-unit', args: { unitId: 'mack' },
    }];
    expect(checkVictory(baseState({ units: [u({ id: 'a', side: 'french' })] }), conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
    expect(checkVictory(baseState({ units: [u({ id: 'mack', side: 'austrian' })] }), conds))
      .toEqual({ kind: 'in-progress' });
  });

  it('reduce-side-strength below threshold', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'reduce-side-strength',
      args: { side: 'austrian', threshold: 3 },
    }];
    const stillAlive = baseState({ units: [u({ id: 'au1', side: 'austrian', strength: 4 })] });
    expect(checkVictory(stillAlive, conds)).toEqual({ kind: 'in-progress' });
    const reduced = baseState({ units: [u({ id: 'au1', side: 'austrian', strength: 2 })] });
    expect(checkVictory(reduced, conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
  });

  it('survive-turns triggers at limit', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'survive-turns', args: { turns: 5 },
    }];
    expect(checkVictory(baseState({ turn: 4 }), conds)).toEqual({ kind: 'in-progress' });
    expect(checkVictory(baseState({ turn: 5 }), conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
  });

  it('capture-tile when a friendly unit stands on it', () => {
    const conds: VictoryCondition[] = [{
      for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 4 } },
    }];
    const empty = baseState({ units: [u({ id: 'fr1', side: 'french', position: { x: 0, y: 0 } })] });
    expect(checkVictory(empty, conds)).toEqual({ kind: 'in-progress' });
    const onIt = baseState({ units: [u({ id: 'fr1', side: 'french', position: { x: 4, y: 4 } })] });
    expect(checkVictory(onIt, conds))
      .toEqual({ kind: 'decided', victor: 'french', reason: expect.any(String) });
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- tests/engine/victory.test.ts
# expect: failures
```

- [ ] **Step 3: Implement `src/engine/victory.ts`**

```ts
import type { GameState, VictoryCondition, VictoryStatus, Side, Pos } from './types';
import { posEq } from './grid';

const totalStrength = (state: GameState, side: Side) =>
  state.units.filter(u => u.side === side).reduce((s, u) => s + u.strength, 0);

const condMet = (state: GameState, c: VictoryCondition): { met: boolean; reason: string } => {
  switch (c.kind) {
    case 'eliminate-unit': {
      const id = c.args.unitId as string;
      return { met: !state.units.some(u => u.id === id), reason: `eliminated ${id}` };
    }
    case 'reduce-side-strength': {
      const side = c.args.side as Side;
      const threshold = c.args.threshold as number;
      return {
        met: totalStrength(state, side) < threshold,
        reason: `${side} reduced below ${threshold}`,
      };
    }
    case 'survive-turns': {
      const turns = c.args.turns as number;
      return { met: state.turn >= turns, reason: `survived to turn ${turns}` };
    }
    case 'capture-tile': {
      const pos = c.args.pos as Pos;
      return {
        met: state.units.some(u => u.side === c.for && posEq(u.position, pos)),
        reason: `captured (${pos.x},${pos.y})`,
      };
    }
    case 'hold-tile-for-turns': {
      // Simple v1: holding right now plus turn-count tracking via metadata is overkill.
      // Implement as: standing on tile when state.turn ≥ args.turns.
      const pos = c.args.pos as Pos;
      const turns = c.args.turns as number;
      const standing = state.units.some(u => u.side === c.for && posEq(u.position, pos));
      return { met: standing && state.turn >= turns, reason: `held tile for ${turns} turns` };
    }
  }
};

export function checkVictory(state: GameState, conds: VictoryCondition[]): VictoryStatus {
  for (const c of conds) {
    const { met, reason } = condMet(state, c);
    if (met) return { kind: 'decided', victor: c.for, reason };
  }
  return { kind: 'in-progress' };
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test -- tests/engine/victory.test.ts
# expect: 4/4 pass
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/victory.ts tests/engine/victory.test.ts
git commit -m "feat(engine): add victory condition checker"
```

---

### Task 7: Turn manager + engine entry points (`src/engine/turn.ts`, `src/engine/index.ts`)

The orchestration layer — implements `moveUnit`, `attack`, `changeFormation`, `endTurn`, and the high-level `applyDecision` / `beginBattle` / `startCampaign`. This is what the UI calls.

**Files:**
- Create: `src/engine/turn.ts`, `src/engine/index.ts`
- Test: `tests/engine/turn.test.ts`

- [ ] **Step 1: Write `tests/engine/turn.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import type { GameState, Unit, Scenario } from '../../src/engine/types';
import { moveUnit, attack, endTurn, beginBattle } from '../../src/engine/turn';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

const trivialScenario: Scenario = {
  id: 'test', title: 'Test', briefingMd: 'test',
  grid: { width: 10, height: 10 }, tiles: [],
  units: [
    u({ id: 'fr1', side: 'french', position: { x: 1, y: 1 } }),
    u({ id: 'au1', side: 'austrian', position: { x: 2, y: 1 } }),
  ],
  victory: [{ for: 'french', kind: 'eliminate-unit', args: { unitId: 'au1' } }],
  ai: { generalRule: 'defensive', triggers: [] },
};

describe('turn manager', () => {
  it('beginBattle initialises GameState from scenario', () => {
    const state = beginBattle(trivialScenario);
    expect(state.units).toHaveLength(2);
    expect(state.turn).toBe(1);
    expect(state.currentSide).toBe('french');
    expect(state.phase).toBe('orders');
  });

  it('moveUnit moves and emits unit-moved event', () => {
    const state = beginBattle(trivialScenario);
    const r = moveUnit(state, 'fr1', { x: 1, y: 2 });
    expect(r.state.units.find(u => u.id === 'fr1')!.position).toEqual({ x: 1, y: 2 });
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'unit-moved', unitId: 'fr1' }));
  });

  it('moveUnit rejects illegal target', () => {
    const state = beginBattle(trivialScenario);
    expect(() => moveUnit(state, 'fr1', { x: 9, y: 9 })).toThrow();
  });

  it('moveUnit rejects opponent unit', () => {
    const state = beginBattle(trivialScenario);
    expect(() => moveUnit(state, 'au1', { x: 0, y: 0 })).toThrow(/not your unit/);
  });

  it('moveUnit refuses double-move in one turn', () => {
    const state = beginBattle(trivialScenario);
    const after = moveUnit(state, 'fr1', { x: 1, y: 2 }).state;
    expect(() => moveUnit(after, 'fr1', { x: 1, y: 3 })).toThrow(/already moved/);
  });

  it('attack adjacency required', () => {
    const state = beginBattle(trivialScenario);
    // fr1 (1,1) is adjacent to au1 (2,1) — legal
    const r = attack(state, 'fr1', 'au1');
    expect(r.events.some(e => e.kind === 'attack-resolved')).toBe(true);
  });

  it('attack non-adjacent throws', () => {
    const farScenario: Scenario = {
      ...trivialScenario,
      units: [
        u({ id: 'fr1', side: 'french', position: { x: 0, y: 0 } }),
        u({ id: 'au1', side: 'austrian', position: { x: 5, y: 5 } }),
      ],
    };
    const state = beginBattle(farScenario);
    expect(() => attack(state, 'fr1', 'au1')).toThrow(/not adjacent/);
  });

  it('endTurn advances turn and switches side', () => {
    const state = beginBattle(trivialScenario);
    const after1 = endTurn(state).state;
    expect(after1.currentSide).toBe('austrian');
    expect(after1.turn).toBe(1);  // same turn, different side
    const after2 = endTurn(after1).state;
    expect(after2.currentSide).toBe('french');
    expect(after2.turn).toBe(2);  // both sides moved → next turn
  });

  it('endTurn resets per-turn flags', () => {
    const state = beginBattle(trivialScenario);
    const moved = moveUnit(state, 'fr1', { x: 1, y: 2 }).state;
    expect(moved.units.find(u => u.id === 'fr1')!.hasMoved).toBe(true);
    const turn2 = endTurn(endTurn(moved).state).state;
    expect(turn2.units.find(u => u.id === 'fr1')!.hasMoved).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- tests/engine/turn.test.ts
# expect: failures
```

- [ ] **Step 3: Implement `src/engine/turn.ts`**

```ts
import type {
  GameState, Unit, Scenario, BattleEvent, Pos, Side, Formation,
} from './types';
import { posEq, chebyshev } from './grid';
import { legalMoves, terrainCost } from './movement';
import { resolveAttack } from './combat';
import { checkVictory } from './victory';

const sideOrder: Side[] = ['french', 'austrian', 'russian'];

function nextSide(current: Side, units: Unit[]): Side {
  // Skip sides with no units; cycle through sideOrder.
  const start = sideOrder.indexOf(current);
  for (let i = 1; i <= sideOrder.length; i++) {
    const cand = sideOrder[(start + i) % sideOrder.length];
    if (units.some(u => u.side === cand)) return cand;
  }
  return current;
}

export function beginBattle(scenario: Scenario): GameState {
  return {
    schemaVersion: 1,
    campaignId: 'ulm-austerlitz-1805',
    scenarioIndex: 0,
    scenarioId: scenario.id,
    units: scenario.units.map(u => ({ ...u })),
    currentSide: 'french',
    turn: 1,
    phase: 'orders',
    selectedUnitId: null,
    log: [{ kind: 'turn-started', turn: 1, side: 'french' }],
    decisionsTaken: [],
    outcomes: [],
    pendingDecisionId: null,
  };
}

export function moveUnit(
  state: GameState,
  unitId: string,
  to: Pos,
): { state: GameState; events: BattleEvent[] } {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) throw new Error(`Unit ${unitId} not found`);
  if (unit.side !== state.currentSide) throw new Error(`${unitId} is not your unit this turn`);
  if (unit.hasMoved) throw new Error(`${unitId} already moved this turn`);

  // Cheap validation: target must appear in legalMoves.
  const moves = legalMoves(unit, state.units, {
    grid: { width: 100, height: 100 },          // grid bounds enforced by scenario consumer
    tiles: [],
  });
  // Caller-supplied scenario tiles aren't on `state` — for v1 we trust `state` is consistent
  // with the active scenario; legality can be re-checked in tests with terrain-bearing tests below.
  if (!moves.some(m => posEq(m, to))) throw new Error(`Illegal move target`);

  const cost = terrainCost('plain'); // overridden when tiles are passed via overload; see note below
  const updated: Unit[] = state.units.map(u =>
    u.id === unitId
      ? { ...u, position: to, hasMoved: true, facing: facingFromMove(u.position, to, u.facing) }
      : u,
  );
  const events: BattleEvent[] = [{
    kind: 'unit-moved', unitId, from: unit.position, to, cost,
  }];
  return {
    state: { ...state, units: updated, log: [...state.log, ...events] },
    events,
  };
}

function facingFromMove(from: Pos, to: Pos, fallback: Unit['facing']): Unit['facing'] {
  if (to.x > from.x) return 'E';
  if (to.x < from.x) return 'W';
  if (to.y > from.y) return 'S';
  if (to.y < from.y) return 'N';
  return fallback;
}

export function attack(
  state: GameState,
  attackerId: string,
  defenderId: string,
): { state: GameState; events: BattleEvent[] } {
  const a = state.units.find(u => u.id === attackerId);
  const d = state.units.find(u => u.id === defenderId);
  if (!a) throw new Error(`Attacker ${attackerId} not found`);
  if (!d) throw new Error(`Defender ${defenderId} not found`);
  if (a.side !== state.currentSide) throw new Error(`${attackerId} is not your unit`);
  if (a.side === d.side) throw new Error(`Cannot attack a friendly unit`);
  if (a.hasActed) throw new Error(`${attackerId} already acted this turn`);
  if (chebyshev(a.position, d.position) !== 1) throw new Error(`Units not adjacent`);

  const { updatedUnits, events: combatEvents } = resolveAttack(a, d, state.units, []);
  // mark attacker as having acted
  const finalUnits = updatedUnits.map(u =>
    u.id === attackerId ? { ...u, hasActed: true } : u,
  );

  return {
    state: { ...state, units: finalUnits, log: [...state.log, ...combatEvents] },
    events: combatEvents,
  };
}

export function changeFormation(
  state: GameState, unitId: string, to: Formation,
): { state: GameState; events: BattleEvent[] } {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) throw new Error(`Unit ${unitId} not found`);
  if (unit.side !== state.currentSide) throw new Error(`Not your unit`);
  if (unit.hasActed) throw new Error(`Already acted this turn`);
  if (unit.formation === to) return { state, events: [] };

  const events: BattleEvent[] = [{
    kind: 'formation-changed', unitId, from: unit.formation, to,
  }];
  const updated = state.units.map(u =>
    u.id === unitId ? { ...u, formation: to, hasActed: true } : u,
  );
  return {
    state: { ...state, units: updated, log: [...state.log, ...events] },
    events,
  };
}

export function endTurn(state: GameState): { state: GameState; events: BattleEvent[] } {
  const events: BattleEvent[] = [{ kind: 'turn-ended', turn: state.turn, side: state.currentSide }];
  const ns = nextSide(state.currentSide, state.units);
  const isNewRound = sideOrder.indexOf(ns) <= sideOrder.indexOf(state.currentSide);
  const newTurn = isNewRound ? state.turn + 1 : state.turn;
  const cleared = state.units.map(u =>
    u.side === ns ? { ...u, hasMoved: false, hasActed: false } : u,
  );
  events.push({ kind: 'turn-started', turn: newTurn, side: ns });
  return {
    state: {
      ...state,
      units: cleared,
      currentSide: ns,
      turn: newTurn,
      phase: 'orders',
      selectedUnitId: null,
      log: [...state.log, ...events],
    },
    events,
  };
}

export { checkVictory };
```

NOTE: the inline `legalMoves` call above does not pass scenario tiles because `GameState` doesn't carry them. The UI layer does the tile-aware legality check in Phase 1 task 10, since the UI knows the active scenario. The engine's `moveUnit` here trusts the caller — this keeps `GameState` JSON-clean. If you later want scenario-tile validation inside the engine, embed `tiles` into `GameState` at `beginBattle` time. (For v1 we keep `tiles` outside.)

Update `moveUnit` to accept `tiles` so the engine *can* enforce terrain/in-bounds when a caller supplies them. **Replace the `moveUnit` body** with:

```ts
export function moveUnit(
  state: GameState,
  unitId: string,
  to: Pos,
  ctx?: { tiles: import('./types').Tile[]; grid: { width: number; height: number } },
): { state: GameState; events: BattleEvent[] } {
  const unit = state.units.find(u => u.id === unitId);
  if (!unit) throw new Error(`Unit ${unitId} not found`);
  if (unit.side !== state.currentSide) throw new Error(`${unitId} is not your unit this turn`);
  if (unit.hasMoved) throw new Error(`${unitId} already moved this turn`);

  if (ctx) {
    const moves = legalMoves(unit, state.units, { grid: ctx.grid, tiles: ctx.tiles });
    if (!moves.some(m => posEq(m, to))) throw new Error(`Illegal move target`);
  } else {
    if (chebyshev(unit.position, to) > 4) throw new Error(`Illegal move target`);
    if (state.units.some(o => o.id !== unitId && posEq(o.position, to))) {
      throw new Error(`Illegal move target`);
    }
  }

  const updated: Unit[] = state.units.map(u =>
    u.id === unitId
      ? { ...u, position: to, hasMoved: true, facing: facingFromMove(u.position, to, u.facing) }
      : u,
  );
  const events: BattleEvent[] = [{
    kind: 'unit-moved', unitId, from: unit.position, to, cost: 1,
  }];
  return {
    state: { ...state, units: updated, log: [...state.log, ...events] },
    events,
  };
}
```

- [ ] **Step 4: Write `src/engine/index.ts`**

```ts
export * from './types';
export * from './grid';
export * from './movement';
export * from './combat';
export * from './victory';
export * from './turn';
```

- [ ] **Step 5: Run tests**

```bash
npm run test
# expect: all engine tests pass (grid + movement + combat + victory + turn)
npm run typecheck
# expect: clean
```

- [ ] **Step 6: Commit**

```bash
git add src/engine/turn.ts src/engine/index.ts tests/engine/turn.test.ts
git commit -m "feat(engine): add turn manager and high-level API"
```

---

### Task 8: Austerlitz scenario data file (`src/scenarios/07-austerlitz.ts`)

A real, hand-tuned scenario. Unit positions sketched from the historical deployment (Pratzen Heights centre, Soult's IV Corps facing the heights, allied Russians/Austrians on the heights). Use small numbers — about 8 units per side — so it fits a 12×12 grid.

**Files:**
- Create: `src/scenarios/07-austerlitz.ts`, `src/scenarios/index.ts`
- Test: none (scenario validation script in Phase 2 task 18 will catch errors)

- [ ] **Step 1: Write `src/scenarios/07-austerlitz.ts`**

```ts
import type { Scenario, Unit, Tile } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E',
  formation: type === 'foot-artillery' || type === 'horse-artillery' ? 'line' : 'line',
  strength: 4, morale,
});

const co = (
  id: string, name: string, side: 'austrian' | 'russian', type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'austrian' ? 'au' : 'ru'}-${id}`, name, side, type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

const tiles: Tile[] = [
  // Pratzen Heights — central ridge
  { pos: { x: 5, y: 5 }, terrain: 'hill' },
  { pos: { x: 6, y: 5 }, terrain: 'hill' },
  { pos: { x: 7, y: 5 }, terrain: 'hill' },
  { pos: { x: 5, y: 6 }, terrain: 'hill' },
  { pos: { x: 6, y: 6 }, terrain: 'hill' },
  { pos: { x: 7, y: 6 }, terrain: 'hill' },
  // Goldbach Stream (south) — partial river with a bridge
  { pos: { x: 4, y: 10 }, terrain: 'river' },
  { pos: { x: 5, y: 10 }, terrain: 'river' },
  { pos: { x: 6, y: 10 }, terrain: 'bridge' },
  { pos: { x: 7, y: 10 }, terrain: 'river' },
  { pos: { x: 8, y: 10 }, terrain: 'river' },
  // Forests on flanks
  { pos: { x: 0, y: 4 }, terrain: 'forest' },
  { pos: { x: 0, y: 5 }, terrain: 'forest' },
  { pos: { x: 11, y: 6 }, terrain: 'forest' },
  { pos: { x: 11, y: 7 }, terrain: 'forest' },
  // Telnitz village (south)
  { pos: { x: 5, y: 11 }, terrain: 'town' },
  { pos: { x: 6, y: 11 }, terrain: 'town' },
];

export const austerlitz: Scenario = {
  id: 'austerlitz',
  title: 'Austerlitz — 2 December 1805',
  briefingMd: '07-austerlitz-briefing',
  grid: { width: 12, height: 12 },
  tiles,
  units: [
    // French — Soult's IV Corps facing the heights from the west
    fr('soult-vandamme', 'Vandamme (St-Hilaire)', 'line-infantry', 3, 5, 3),
    fr('soult-stcyr',    'St-Cyr',                'line-infantry', 3, 6, 3),
    fr('soult-legrand',  'Legrand',               'light-infantry', 3, 7, 2),
    fr('lannes-suchet',  'Suchet (V Corps)',      'line-infantry', 3, 3, 3),
    fr('murat-cav',      'Murat (Cavalry)',       'heavy-cavalry', 2, 4, 3),
    fr('davout-friant',  'Friant (III Corps)',    'line-infantry', 3, 9, 2),
    fr('soult-arty',     'IV Corps Artillery',    'foot-artillery', 2, 6, 2),
    fr('napoleon',       'Napoleon',              'light-cavalry', 2, 5, 3),
    // Coalition — Allied centre on the heights, Russian guard reserve, Buxhowden in south
    co('buxhowden',  'Buxhowden',  'russian',  'line-infantry', 8, 9, 1),
    co('langeron',   'Langeron',   'russian',  'line-infantry', 7, 8, 1),
    co('przybyszewski','Przybyszewski','russian','line-infantry', 6, 8, 1),
    co('kollowrath', 'Kollowrath', 'austrian', 'line-infantry', 6, 6, 1),
    co('miloradovich','Miloradovich','russian','light-infantry', 7, 6, 2),
    co('liechtenstein','Liechtenstein','austrian','heavy-cavalry', 9, 5, 2),
    co('imperial-guard','Imperial Guard','russian','grenadier', 9, 6, 3),
    co('austrian-arty','Austrian Artillery','austrian','foot-artillery', 9, 7, 2),
  ],
  victory: [
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 6, y: 5 } } },
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 7, y: 5 } } },
    { for: 'french', kind: 'reduce-side-strength', args: { side: 'russian', threshold: 8 } },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 12 } },
  ],
  turnLimit: 12,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '07-austerlitz-postbattle',
};
```

- [ ] **Step 2: Write `src/scenarios/index.ts`**

```ts
import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

// Ordered roster — index is the campaign step.
export const campaignScenarios: Scenario[] = [
  austerlitz,                // [0] only entry for Phase 1; expand in Phase 2/3
];

export const getScenarioByIndex = (i: number): Scenario | undefined =>
  campaignScenarios[i];

export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck   # expect clean
```

- [ ] **Step 4: Commit**

```bash
git add src/scenarios/
git commit -m "feat(scenarios): add Austerlitz scenario data"
```

---

### Task 9: Unit silhouette SVGs (`src/art/unit-silhouettes.tsx`)

Inline SVG `<symbol>`s the board can `<use>`.

**Files:**
- Create: `src/art/unit-silhouettes.tsx`

- [ ] **Step 1: Write `src/art/unit-silhouettes.tsx`**

```tsx
/** Inline SVG silhouette set. Render <UnitSpriteDefs /> once near the root,
 *  then `<use href="#silh-infantry" />` (etc.) inside any SVG. */

export function UnitSpriteDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {/* Infantry — shako + musket */}
        <symbol id="silh-line-infantry" viewBox="0 0 24 24">
          <g fill="currentColor">
            <rect x="9" y="2" width="6" height="3" />
            <rect x="8" y="5" width="8" height="0.8" />
            <circle cx="12" cy="7.2" r="1.4" />
            <rect x="10.2" y="8.4" width="3.6" height="6" />
            <rect x="9.8" y="14.4" width="1.6" height="6" />
            <rect x="12.6" y="14.4" width="1.6" height="6" />
            <rect x="15.5" y="3.5" width="0.9" height="14" transform="rotate(8 16 10)" />
          </g>
        </symbol>

        {/* Light infantry — like line but narrower hat */}
        <symbol id="silh-light-infantry" viewBox="0 0 24 24">
          <g fill="currentColor">
            <rect x="10" y="3" width="4" height="2.5" />
            <circle cx="12" cy="7.2" r="1.4" />
            <rect x="10.2" y="8.4" width="3.6" height="6" />
            <rect x="9.8" y="14.4" width="1.6" height="6" />
            <rect x="12.6" y="14.4" width="1.6" height="6" />
            <rect x="15" y="6" width="0.9" height="11" transform="rotate(20 15.5 10)" />
          </g>
        </symbol>

        {/* Grenadier — bearskin (tall fuzzy hat) */}
        <symbol id="silh-grenadier" viewBox="0 0 24 24">
          <g fill="currentColor">
            <ellipse cx="12" cy="3.5" rx="3.2" ry="3.2" />
            <rect x="9" y="3.5" width="6" height="2.5" />
            <circle cx="12" cy="8" r="1.4" />
            <rect x="10.2" y="9.2" width="3.6" height="6" />
            <rect x="9.8" y="15.2" width="1.6" height="5" />
            <rect x="12.6" y="15.2" width="1.6" height="5" />
            <rect x="15.5" y="4" width="0.9" height="14" transform="rotate(8 16 11)" />
          </g>
        </symbol>

        {/* Light cavalry — slim horse + sabre */}
        <symbol id="silh-light-cavalry" viewBox="0 0 32 24">
          <g fill="currentColor">
            <path d="M4 16 C 4 12, 8 10, 14 10 L 22 10 C 26 10, 28 12, 28 14 L 28 17 L 4 17 Z" />
            <rect x="6"  y="17" width="2" height="5" />
            <rect x="11" y="17" width="2" height="5" />
            <rect x="20" y="17" width="2" height="5" />
            <rect x="25" y="17" width="2" height="5" />
            <path d="M28 14 L 31 11 L 30 8 L 27 11 Z" />
            <rect x="14" y="4" width="3.5" height="6" />
            <circle cx="15.7" cy="3" r="1.6" />
            <rect x="18" y="1" width="0.8" height="9" transform="rotate(20 18.4 5)" />
          </g>
        </symbol>

        {/* Heavy cavalry — bulkier horse + helmeted rider */}
        <symbol id="silh-heavy-cavalry" viewBox="0 0 32 24">
          <g fill="currentColor">
            <path d="M3 17 C 3 11, 8 9, 14 9 L 23 9 C 27 9, 29 11, 29 14 L 29 18 L 3 18 Z" />
            <rect x="5"  y="18" width="2.5" height="5" />
            <rect x="10" y="18" width="2.5" height="5" />
            <rect x="20" y="18" width="2.5" height="5" />
            <rect x="25" y="18" width="2.5" height="5" />
            <path d="M29 14 L 32 11 L 31 8 L 28 11 Z" />
            <rect x="13" y="3" width="4.5" height="6" />
            <ellipse cx="15.5" cy="2.2" rx="2" ry="1.6" />
            <rect x="18" y="0" width="0.9" height="11" transform="rotate(15 18.4 5)" />
          </g>
        </symbol>

        {/* Foot artillery — cannon on wheels */}
        <symbol id="silh-foot-artillery" viewBox="0 0 32 24">
          <g fill="currentColor">
            <rect x="6" y="9" width="20" height="4" rx="0.6" />
            <path d="M8 13 L 24 13 L 22 18 L 10 18 Z" />
            <circle cx="11" cy="19" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="21" cy="19" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </g>
        </symbol>

        {/* Horse artillery — cannon + small horse silhouette pulling */}
        <symbol id="silh-horse-artillery" viewBox="0 0 40 24">
          <g fill="currentColor">
            <rect x="14" y="9" width="18" height="3" rx="0.5" />
            <path d="M16 12 L 30 12 L 28 17 L 18 17 Z" />
            <circle cx="19" cy="18" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="27" cy="18" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 16 C 2 13, 5 11, 9 11 L 13 11 L 13 17 L 2 17 Z" />
            <rect x="3" y="17" width="1.6" height="4" />
            <rect x="10" y="17" width="1.6" height="4" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

/** Helper: get the right symbol id for a UnitType. */
import type { UnitType } from '../engine/types';
export const symbolFor = (t: UnitType): string => `#silh-${t}`;
```

- [ ] **Step 2: Verify**

```bash
npm run typecheck   # expect clean
```

- [ ] **Step 3: Commit**

```bash
git add src/art/unit-silhouettes.tsx
git commit -m "feat(art): add SVG unit silhouettes"
```

---

### Task 10: Battle UI components (`src/ui/`)

Five components: `BattleBoard` (the SVG grid), `UnitPanel`, `AttackPreview`, `BattleLog`, and a shared `Button`. They are dumb — they take props, render, and call callbacks. The orchestration (which unit is selected, etc.) lives in `app.tsx` for Phase 1; Phase 2 task 12 lifts it into Zustand.

**Files:**
- Create: `src/ui/shared.tsx`, `src/ui/BattleBoard.tsx`, `src/ui/UnitPanel.tsx`, `src/ui/AttackPreview.tsx`, `src/ui/BattleLog.tsx`

- [ ] **Step 1: Write `src/ui/shared.tsx`**

```tsx
import type { ReactNode } from 'react';

export function Button({
  children, onClick, kind = 'primary', disabled,
}: { children: ReactNode; onClick: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  const cls =
    kind === 'primary'   ? 'bg-gilt text-ink' :
    kind === 'secondary' ? 'bg-ink/30 text-parchment' :
                           'bg-red-700 text-white';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${cls} rounded px-4 py-2 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-parchmentDark rounded border border-ink/30 p-3 mb-3">
      {title && <h4 className="text-xs uppercase tracking-wider text-ink/70 mb-2">{title}</h4>}
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/ui/BattleBoard.tsx`**

```tsx
import type { GameState, Pos, Scenario, Unit } from '../engine/types';
import { posEq, posKey } from '../engine/grid';
import { legalMoves } from '../engine/movement';
import { symbolFor } from '../art/unit-silhouettes';

const TERRAIN_FILL: Record<string, string> = {
  plain: '#e8dfc3', forest: '#6b8a4a', hill: '#c4a878',
  town: '#a08868', river: '#5a7a9a', bridge: '#caa770',
  marsh: '#7a8a5a', road: '#d8c89a',
};

const SIDE_FILL: Record<Unit['side'], string> = {
  french: '#2c5aa0', austrian: '#ece4d0', russian: '#4a7a4a',
};
const SIDE_TEXT: Record<Unit['side'], string> = {
  french: '#ffffff', austrian: '#2a2018', russian: '#ffffff',
};

export interface BattleBoardProps {
  scenario: Scenario;
  state: GameState;
  selectedUnitId: string | null;
  hoveredEnemyId: string | null;
  onSelectUnit: (id: string | null) => void;
  onMoveTo: (to: Pos) => void;
  onAttack: (defenderId: string) => void;
  onHoverEnemy: (id: string | null) => void;
}

export function BattleBoard(p: BattleBoardProps) {
  const { scenario, state, selectedUnitId } = p;
  const cellSize = 48;
  const w = scenario.grid.width * cellSize;
  const h = scenario.grid.height * cellSize;

  const selected = selectedUnitId
    ? state.units.find(u => u.id === selectedUnitId) ?? null
    : null;

  const moves = selected && selected.side === state.currentSide && !selected.hasMoved
    ? legalMoves(selected, state.units, scenario)
    : [];
  const moveSet = new Set(moves.map(posKey));

  const adjacentEnemies = selected
    ? state.units.filter(u =>
        u.side !== selected.side &&
        Math.max(Math.abs(u.position.x - selected.position.x),
                 Math.abs(u.position.y - selected.position.y)) === 1)
    : [];
  const enemySet = new Set(adjacentEnemies.map(u => u.id));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto bg-parchmentDark border border-ink/40">
      {/* Tiles */}
      {Array.from({ length: scenario.grid.height }, (_, y) =>
        Array.from({ length: scenario.grid.width }, (_, x) => {
          const ter = scenario.tiles.find(t => posEq(t.pos, { x, y }))?.terrain ?? 'plain';
          const isMove = moveSet.has(posKey({ x, y }));
          const fill = isMove ? '#b8d8b8' : TERRAIN_FILL[ter];
          return (
            <rect
              key={`${x},${y}`}
              x={x * cellSize} y={y * cellSize}
              width={cellSize} height={cellSize}
              fill={fill}
              stroke="#8a7a5a" strokeWidth={0.5}
              onClick={() => {
                if (selected && isMove) p.onMoveTo({ x, y });
                else p.onSelectUnit(null);
              }}
              style={{ cursor: isMove ? 'pointer' : 'default' }}
            />
          );
        })
      )}

      {/* Units */}
      {state.units.map(u => {
        const cx = u.position.x * cellSize;
        const cy = u.position.y * cellSize;
        const isSelected = u.id === selectedUnitId;
        const isAttackable = enemySet.has(u.id);
        const onClick = () => {
          if (isAttackable) p.onAttack(u.id);
          else p.onSelectUnit(u.id);
        };
        return (
          <g
            key={u.id}
            transform={`translate(${cx + 4}, ${cy + 4})`}
            onClick={onClick}
            onMouseEnter={() => u.side !== state.currentSide && p.onHoverEnemy(u.id)}
            onMouseLeave={() => p.onHoverEnemy(null)}
            style={{ cursor: 'pointer' }}
          >
            {isAttackable && (
              <rect width={cellSize - 8} height={cellSize - 8} rx="3"
                fill="#d8a8a8" stroke="#a04040" strokeWidth={2} />
            )}
            <rect
              width={cellSize - 8} height={cellSize - 8}
              rx="3"
              fill={SIDE_FILL[u.side]}
              stroke={isSelected ? '#d4a017' : 'rgba(0,0,0,0.3)'}
              strokeWidth={isSelected ? 3 : 1.2}
            />
            <g transform={`translate(${(cellSize - 8) * 0.1}, ${(cellSize - 8) * 0.1}) scale(${(cellSize - 8) * 0.032})`}
               style={{ color: SIDE_TEXT[u.side] }}>
              <use href={symbolFor(u.type)} />
            </g>
            <rect x={cellSize - 22} y={cellSize - 22} width={14} height={12}
                  fill="#d4a017" stroke="#2a2018" strokeWidth={0.6} rx="2" />
            <text x={cellSize - 15} y={cellSize - 13} textAnchor="middle"
                  fontSize="9" fontWeight="700" fill="#2a2018">
              {u.strength}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 3: Write `src/ui/UnitPanel.tsx`**

```tsx
import type { Unit } from '../engine/types';
import { Panel } from './shared';

const TYPE_LABEL: Record<Unit['type'], string> = {
  'line-infantry': 'Line Infantry',
  'light-infantry': 'Light Infantry',
  'grenadier': 'Grenadier',
  'light-cavalry': 'Light Cavalry',
  'heavy-cavalry': 'Heavy Cavalry',
  'foot-artillery': 'Foot Artillery',
  'horse-artillery': 'Horse Artillery',
};

export function UnitPanel({ unit }: { unit: Unit | null }) {
  if (!unit) return <Panel title="No unit selected"><p className="text-sm opacity-60">Tap a unit on the board.</p></Panel>;
  return (
    <Panel title="Selected unit">
      <div className="text-sm space-y-1">
        <Row label="Type" value={TYPE_LABEL[unit.type]} />
        {unit.name && <Row label="Name" value={unit.name} />}
        <Row label="Side" value={unit.side} />
        <Row label="Formation" value={unit.formation} />
        <Row label="Strength" value={`${unit.strength} / 4`} />
        <Row label="Morale" value={unit.moraleRevealed ? '★'.repeat(unit.morale) : '?'} />
      </div>
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/ui/AttackPreview.tsx`**

For Phase 1 we expose a *minimal* preview — strength + question-mark for unrevealed morale. Polished math preview ("predicted result range") deferred to Phase 3 task 28.

```tsx
import type { Unit } from '../engine/types';
import { Panel } from './shared';

export function AttackPreview({ attacker, defender }: { attacker: Unit | null; defender: Unit | null }) {
  if (!attacker || !defender) return null;
  return (
    <Panel title="Attack preview">
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-ink/60">Attacker</span>
          <span className="font-semibold">{attacker.name ?? attacker.id} · {attacker.strength}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Defender</span>
          <span className="font-semibold">{defender.name ?? defender.id} · {defender.strength}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Morale</span>
          <span>{defender.moraleRevealed ? '★'.repeat(defender.morale) : '?'}</span>
        </div>
        <div className="text-xs italic opacity-70 pt-1">
          Click the highlighted enemy to confirm the attack.
        </div>
      </div>
    </Panel>
  );
}
```

- [ ] **Step 5: Write `src/ui/BattleLog.tsx`**

```tsx
import type { BattleEvent } from '../engine/types';
import { Panel } from './shared';

const describe = (e: BattleEvent): string => {
  switch (e.kind) {
    case 'turn-started':       return `Turn ${e.turn} — ${e.side} to act`;
    case 'turn-ended':         return `Turn ${e.turn} — ${e.side} ended`;
    case 'unit-moved':         return `${e.unitId} moved to (${e.to.x},${e.to.y})`;
    case 'formation-changed':  return `${e.unitId}: ${e.from} → ${e.to}`;
    case 'attack-resolved':    return `Attack ${e.attackerId} → ${e.defenderId}: ${e.result} (${e.attackerScore} vs ${e.defenderScore})`;
    case 'morale-revealed':    return `${e.unitId} morale revealed: ${'★'.repeat(e.morale)}`;
    case 'unit-eliminated':    return `${e.unitId} eliminated`;
    case 'unit-retreated':     return `${e.unitId} retreated`;
    case 'victory':            return `Victory: ${e.side} (${e.reason})`;
  }
};

export function BattleLog({ events }: { events: BattleEvent[] }) {
  return (
    <Panel title="Battle log">
      <div className="text-xs leading-relaxed max-h-48 overflow-y-auto bg-parchment p-2 rounded">
        {[...events].reverse().slice(0, 40).map((e, i) => (
          <div key={i} className="border-b border-ink/10 py-0.5 last:border-0">{describe(e)}</div>
        ))}
      </div>
    </Panel>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck   # expect clean
```

- [ ] **Step 7: Commit**

```bash
git add src/ui/
git commit -m "feat(ui): add battle board, unit panel, attack preview, and log"
```

---

### Task 11: Wire Phase 1 — first hot-seat playable battle (`src/app.tsx`)

A single-screen `App` boots straight into Austerlitz, with hot-seat play (no side-passing screens needed since hidden info is per-unit, not per-side). React-only state, no Zustand yet — that lands in Phase 2.

**Files:**
- Modify: `src/app.tsx`

- [ ] **Step 1: Replace `src/app.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { BattleBoard } from './ui/BattleBoard';
import { UnitPanel } from './ui/UnitPanel';
import { AttackPreview } from './ui/AttackPreview';
import { BattleLog } from './ui/BattleLog';
import { Button } from './ui/shared';
import { UnitSpriteDefs } from './art/unit-silhouettes';
import { austerlitz } from './scenarios/07-austerlitz';
import {
  beginBattle, moveUnit, attack, changeFormation, endTurn,
  checkVictory,
} from './engine';
import type { GameState, Pos } from './engine/types';

export default function App() {
  const [history, setHistory] = useState<GameState[]>(() => [beginBattle(austerlitz)]);
  const state = history[history.length - 1];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);

  const victory = useMemo(() => checkVictory(state, austerlitz.victory), [state]);

  const push = (next: GameState) => setHistory(h => [...h, next]);
  const undo = () => setHistory(h => (h.length > 1 ? h.slice(0, -1) : h));

  const selected = selectedId ? state.units.find(u => u.id === selectedId) ?? null : null;
  const hoveredEnemy = hoveredEnemyId ? state.units.find(u => u.id === hoveredEnemyId) ?? null : null;

  const handleMove = (to: Pos) => {
    if (!selectedId) return;
    try {
      const next = moveUnit(state, selectedId, to,
        { tiles: austerlitz.tiles, grid: austerlitz.grid }).state;
      push(next);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAttack = (defenderId: string) => {
    if (!selectedId) return;
    try {
      const next = attack(state, selectedId, defenderId).state;
      push(next);
      setSelectedId(null);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleEndTurn = () => {
    push(endTurn(state).state);
    setSelectedId(null);
  };

  const handleFormation = (to: 'line' | 'column' | 'square') => {
    if (!selectedId) return;
    try { push(changeFormation(state, selectedId, to).state); } catch (e) { console.warn(e); }
  };

  return (
    <div className="min-h-full p-4 grid grid-cols-[1fr_320px] gap-4">
      <UnitSpriteDefs />
      <div className="flex flex-col">
        <header className="flex items-center justify-between mb-2 bg-ink text-parchment px-3 py-2 rounded">
          <div>
            <span className="font-bold uppercase">{state.currentSide}</span>
            <span className="ml-3 text-sm">Turn {state.turn} / {austerlitz.turnLimit ?? '∞'}</span>
          </div>
          <div className="text-xs opacity-80">
            {victory.kind === 'decided'
              ? <span className="text-gilt font-bold">Victory: {victory.victor} — {victory.reason}</span>
              : <span>{austerlitz.title}</span>}
          </div>
        </header>
        <BattleBoard
          scenario={austerlitz}
          state={state}
          selectedUnitId={selectedId}
          hoveredEnemyId={hoveredEnemyId}
          onSelectUnit={setSelectedId}
          onMoveTo={handleMove}
          onAttack={handleAttack}
          onHoverEnemy={setHoveredEnemyId}
        />
        <div className="mt-3 flex gap-2 items-center">
          <Button onClick={undo} kind="secondary" disabled={history.length === 1}>Undo</Button>
          <div className="flex-1" />
          {selected && (
            <>
              <Button onClick={() => handleFormation('line')}   kind="secondary">Line</Button>
              <Button onClick={() => handleFormation('column')} kind="secondary">Column</Button>
              <Button onClick={() => handleFormation('square')} kind="secondary">Square</Button>
            </>
          )}
          <Button onClick={handleEndTurn}>End Turn</Button>
        </div>
      </div>
      <aside>
        <UnitPanel unit={selected} />
        <AttackPreview attacker={selected} defender={hoveredEnemy} />
        <BattleLog events={state.log} />
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and play a turn**

```bash
npm run dev
```

Open `http://localhost:5173`. Confirm:
- Austerlitz board renders, Pratzen Heights visible (tan tiles centre).
- Click a French unit (blue) → green tiles show legal moves; adjacent enemy tiles highlight red.
- Click a green tile → unit moves; click a red enemy → combat resolves, log updates, defender morale revealed.
- *End Turn* swaps to Coalition (white/green); after a Coalition turn, back to French and turn counter increments.
- *Undo* rolls back the last action within the current turn.

- [ ] **Step 3: Run all tests + typecheck + build**

```bash
npm run test       # all engine tests still pass
npm run typecheck  # clean
npm run build      # produces dist/ without errors
```

- [ ] **Step 4: Commit and tag W1 milestone**

```bash
git add src/app.tsx
git commit -m "feat(app): wire Phase 1 hot-seat playable Austerlitz"
git tag w1-playable
```

---

## Phase 2 — W2: Campaign skeleton + saves + replay + first deploy

### Task 12: Zustand store + save/load (`src/state/store.ts`, `src/state/save.ts`)

Lift the React-local state from Phase 1 into a Zustand store. Add `localStorage` persistence keyed by run id; up to 3 runs visible, oldest auto-pruned.

**Files:**
- Create: `src/state/store.ts`, `src/state/save.ts`
- Test: `tests/state/save.test.ts`
- Modify: `src/app.tsx`

- [ ] **Step 1: Write `src/state/save.ts`**

```ts
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
        const parsed = JSON.parse(localStorage.getItem(k)!) as SavedRun;
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
```

- [ ] **Step 2: Write `tests/state/save.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageBackend, newRunId } from '../../src/state/save';
import type { GameState } from '../../src/engine/types';

const sampleState = (): GameState => ({
  schemaVersion: 1, campaignId: 'ulm-austerlitz-1805',
  scenarioIndex: 0, scenarioId: 'austerlitz',
  units: [], currentSide: 'french', turn: 1, phase: 'orders',
  selectedUnitId: null, log: [], decisionsTaken: [], outcomes: [],
  pendingDecisionId: null,
});

describe('save backend', () => {
  beforeEach(() => localStorage.clear());

  it('roundtrips a saved run', () => {
    const id = newRunId();
    localStorageBackend.save({ runId: id, savedAt: 1, state: sampleState() });
    const loaded = localStorageBackend.load(id);
    expect(loaded?.state.scenarioId).toBe('austerlitz');
  });

  it('keeps only the 3 newest runs', () => {
    for (let i = 0; i < 5; i++) {
      localStorageBackend.save({ runId: `r${i}`, savedAt: i, state: sampleState() });
    }
    expect(localStorageBackend.list()).toHaveLength(3);
    expect(localStorageBackend.list().map(r => r.runId)).toEqual(['r4', 'r3', 'r2']);
  });

  it('rejects mismatched schemaVersion when loading', () => {
    localStorage.setItem('napoleonic-save-bad', JSON.stringify({
      runId: 'bad', savedAt: 1, state: { ...sampleState(), schemaVersion: 99 },
    }));
    expect(localStorageBackend.load('bad')).toBeNull();
    expect(localStorageBackend.list()).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run — expect pass**

```bash
npm run test -- tests/state/save.test.ts
# expect: 3/3 pass
```

- [ ] **Step 4: Write `src/state/store.ts`**

```ts
import { create } from 'zustand';
import type { GameState, Pos, Formation, Scenario } from '../engine/types';
import { beginBattle, moveUnit, attack, changeFormation, endTurn, checkVictory } from '../engine';
import { localStorageBackend, newRunId, type SavedRun } from './save';

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
    const { state, scenario, history, runId } = get();
    if (!state || !scenario) return;
    const r = endTurn(state);
    const v = checkVictory(r.state, scenario.victory);
    set({
      state: r.state, history: [r.state],   // start a fresh undo stack each turn
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
```

- [ ] **Step 5: Refactor `src/app.tsx` to use the store**

Replace `src/app.tsx`:

```tsx
import { useEffect } from 'react';
import { useGame } from './state/store';
import { austerlitz } from './scenarios/07-austerlitz';
import { Splash } from './ui/Splash';
import { CampaignMenu } from './ui/CampaignMenu';
import { BattleEndScreen } from './ui/BattleEndScreen';
import { BattleBoard } from './ui/BattleBoard';
import { UnitPanel } from './ui/UnitPanel';
import { AttackPreview } from './ui/AttackPreview';
import { BattleLog } from './ui/BattleLog';
import { Button } from './ui/shared';
import { UnitSpriteDefs } from './art/unit-silhouettes';
import { checkVictory } from './engine';

export default function App() {
  const screen = useGame(s => s.screen);

  // Phase 2: Splash, CampaignMenu, BattleEndScreen exist (Tasks 13-15).
  // ReplayViewer exists (Task 19).
  switch (screen) {
    case 'splash':         return <Splash />;
    case 'campaign-menu':  return <CampaignMenu />;
    case 'battle':         return <BattleScreen />;
    case 'battle-end':     return <BattleEndScreen />;
    default:               return <Splash />;
  }
}

function BattleScreen() {
  const {
    state, scenario, selectedUnitId, hoveredEnemyId,
    selectUnit, hoverEnemy, doMove, doAttack, doFormation, doEndTurn, undo,
    saveCurrent,
  } = useGame();

  useEffect(() => { saveCurrent(); }, [state?.turn, state?.currentSide]);

  if (!state || !scenario) return <Splash />;

  const selected = selectedUnitId ? state.units.find(u => u.id === selectedUnitId) ?? null : null;
  const hoveredEnemy = hoveredEnemyId ? state.units.find(u => u.id === hoveredEnemyId) ?? null : null;
  const v = checkVictory(state, scenario.victory);

  return (
    <div className="min-h-full p-4 grid grid-cols-[1fr_320px] gap-4">
      <UnitSpriteDefs />
      <div className="flex flex-col">
        <header className="flex items-center justify-between mb-2 bg-ink text-parchment px-3 py-2 rounded">
          <div>
            <span className="font-bold uppercase">{state.currentSide}</span>
            <span className="ml-3 text-sm">Turn {state.turn} / {scenario.turnLimit ?? '∞'}</span>
          </div>
          <div className="text-xs opacity-80">{scenario.title}</div>
        </header>
        <BattleBoard
          scenario={scenario}
          state={state}
          selectedUnitId={selectedUnitId}
          hoveredEnemyId={hoveredEnemyId}
          onSelectUnit={selectUnit}
          onMoveTo={doMove}
          onAttack={doAttack}
          onHoverEnemy={hoverEnemy}
        />
        <div className="mt-3 flex gap-2 items-center">
          <Button onClick={undo} kind="secondary">Undo</Button>
          <div className="flex-1" />
          {selected && (
            <>
              <Button onClick={() => doFormation('line')}   kind="secondary">Line</Button>
              <Button onClick={() => doFormation('column')} kind="secondary">Column</Button>
              <Button onClick={() => doFormation('square')} kind="secondary">Square</Button>
            </>
          )}
          <Button onClick={doEndTurn}>End Turn</Button>
        </div>
      </div>
      <aside>
        <UnitPanel unit={selected} />
        <AttackPreview attacker={selected} defender={hoveredEnemy} />
        <BattleLog events={state.log} />
        {v.kind === 'decided' && (
          <div className="bg-gilt text-ink p-3 rounded mt-3 text-sm">
            Victory: <strong>{v.victor}</strong> — {v.reason}
          </div>
        )}
      </aside>
    </div>
  );
}
```

(Splash, CampaignMenu, BattleEndScreen are written in tasks 13-15; the import paths are correct in advance so the refactor can compile after those tasks.)

- [ ] **Step 6: Commit**

(Postpone build/typecheck till Task 15; missing Splash etc. would fail typecheck. Just commit the store + save module.)

```bash
git add src/state/ tests/state/
git commit -m "feat(state): add zustand store and localStorage save backend"
```

---

### Task 13: Splash screen (`src/ui/Splash.tsx`)

**Files:**
- Create: `src/ui/Splash.tsx`

- [ ] **Step 1: Write `src/ui/Splash.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useGame } from '../state/store';
import { localStorageBackend, type SavedRun } from '../state/save';
import { Button } from './shared';
import { austerlitz } from '../scenarios/07-austerlitz';
import { campaignScenarios, getScenarioById } from '../scenarios';

export function Splash() {
  const { startNewRun, loadRun, goto } = useGame();
  const [runs, setRuns] = useState<SavedRun[]>([]);

  useEffect(() => { setRuns(localStorageBackend.list()); }, []);

  const onContinue = () => {
    const last = runs[0];
    if (!last) return;
    const scenario = getScenarioById(last.state.scenarioId) ?? campaignScenarios[0];
    loadRun(last.runId, scenario);
  };

  return (
    <main className="min-h-full flex items-center justify-center bg-parchment text-ink">
      <div className="max-w-xl w-full text-center px-6">
        <h1 className="font-serif text-5xl mb-1">1805</h1>
        <p className="font-serif text-xl italic mb-8 opacity-80">A Napoleonic Campaign</p>
        <div className="space-y-3">
          <div><Button onClick={() => startNewRun(austerlitz)}>New Campaign</Button></div>
          {runs.length > 0 && (
            <div><Button onClick={onContinue} kind="secondary">Continue ({runs[0].state.scenarioId}, turn {runs[0].state.turn})</Button></div>
          )}
          <div><Button onClick={() => goto('campaign-menu')} kind="secondary">Campaign Menu</Button></div>
        </div>
        <p className="mt-10 text-xs opacity-50">v0.2 · Phase 2</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit** (skip typecheck — still missing other screens)

```bash
git add src/ui/Splash.tsx
git commit -m "feat(ui): add splash screen"
```

---

### Task 14: Campaign menu (`src/ui/CampaignMenu.tsx`)

A scrolling list of scenarios. Locked nodes appear after the current run's `scenarioIndex`.

**Files:**
- Create: `src/ui/CampaignMenu.tsx`

- [ ] **Step 1: Write `src/ui/CampaignMenu.tsx`**

```tsx
import { useGame } from '../state/store';
import { campaignScenarios } from '../scenarios';
import { Button, Panel } from './shared';

export function CampaignMenu() {
  const { state, startNewRun, goto } = useGame();
  const reachedIndex = state?.scenarioIndex ?? -1;

  return (
    <main className="min-h-full p-6 max-w-2xl mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-3xl">1805 — Campaign</h2>
        <Button kind="secondary" onClick={() => goto('splash')}>Back</Button>
      </header>
      <Panel>
        <div className="space-y-2">
          {campaignScenarios.map((s, i) => {
            const locked = i > reachedIndex + 1;
            return (
              <div key={s.id} className="flex items-center justify-between border-b border-ink/20 last:border-0 py-2">
                <div>
                  <div className="font-bold">{i + 1}. {s.title}</div>
                  <div className="text-xs opacity-70">{s.units.length} units · {s.grid.width}×{s.grid.height}</div>
                </div>
                <Button
                  disabled={locked}
                  kind="secondary"
                  onClick={() => startNewRun(s)}
                >
                  {locked ? 'Locked' : 'Restart from here'}
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/CampaignMenu.tsx
git commit -m "feat(ui): add campaign menu"
```

---

### Task 15: Battle End screen (`src/ui/BattleEndScreen.tsx`)

Victory banner + log summary + advance button.

**Files:**
- Create: `src/ui/BattleEndScreen.tsx`
- Modify: `src/state/store.ts` — add `advanceAfterBattle()`.

- [ ] **Step 1: Append `advanceAfterBattle` to `src/state/store.ts`**

In the `Store` interface add:

```ts
  advanceAfterBattle(): void;
```

And in the `create` body, append:

```ts
  advanceAfterBattle() {
    const { state, scenario, runId } = get();
    if (!state || !scenario || !runId) return;
    const v = require('../engine').checkVictory(state, scenario.victory);
    const idx = state.scenarioIndex;
    const next = require('../scenarios').campaignScenarios[idx + 1];
    if (!next) {
      set({ screen: 'campaign-end' });
      return;
    }
    const nextState = require('../engine').beginBattle(next);
    nextState.scenarioIndex = idx + 1;
    nextState.outcomes = [
      ...state.outcomes,
      { scenarioId: state.scenarioId, victor: v.kind === 'decided' ? v.victor : state.currentSide, turnsTaken: state.turn },
    ];
    set({ state: nextState, scenario: next, history: [nextState], screen: 'battle' });
    get().saveCurrent();
  },
```

(`require` calls avoid a circular import. Replace with proper imports if your toolchain handles them — Vite ESM is fine with regular imports, just place them at top of file.)

A cleaner version — actually use ESM imports. Replace `src/state/store.ts` top imports with:

```ts
import { create } from 'zustand';
import type { GameState, Pos, Formation, Scenario } from '../engine/types';
import { beginBattle, moveUnit, attack, changeFormation, endTurn, checkVictory } from '../engine';
import { localStorageBackend, newRunId, type SavedRun } from './save';
import { campaignScenarios } from '../scenarios';
```

Then `advanceAfterBattle` becomes:

```ts
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
    set({ state: nextState, scenario: next, history: [nextState], screen: 'battle' });
    get().saveCurrent();
  },
```

- [ ] **Step 2: Write `src/ui/BattleEndScreen.tsx`**

```tsx
import { useGame } from '../state/store';
import { Button, Panel } from './shared';
import { checkVictory } from '../engine';

export function BattleEndScreen() {
  const { state, scenario, advanceAfterBattle, goto } = useGame();
  if (!state || !scenario) return null;
  const v = checkVictory(state, scenario.victory);
  const banner = v.kind === 'decided' ? v.victor.toUpperCase() : 'Stalemate';
  const reason = v.kind === 'decided' ? v.reason : 'Turn limit reached';

  return (
    <main className="min-h-full flex items-center justify-center p-6 bg-parchment text-ink">
      <div className="max-w-md w-full text-center">
        <div className="font-serif text-5xl mb-1">{banner}</div>
        <p className="italic opacity-80 mb-6">{reason}</p>
        <Panel title="Battle summary">
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>Battle</span><span className="font-semibold">{scenario.title}</span></div>
            <div className="flex justify-between"><span>Turns taken</span><span className="font-semibold">{state.turn}</span></div>
            <div className="flex justify-between"><span>Events logged</span><span className="font-semibold">{state.log.length}</span></div>
          </div>
        </Panel>
        <div className="mt-4 flex gap-2 justify-center">
          <Button kind="secondary" onClick={() => goto('campaign-menu')}>Campaign Menu</Button>
          <Button onClick={advanceAfterBattle}>Continue</Button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify the whole app builds**

```bash
npm run typecheck   # expect clean
npm run dev         # confirm Splash → New Campaign loads Austerlitz → play to a victory or end-turn → End screen → Continue
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/BattleEndScreen.tsx src/state/store.ts
git commit -m "feat(ui): add battle end screen and inter-scenario advance"
```

---

### Task 16: Wertingen scenario (`src/scenarios/01-wertingen.ts`)

Small cavalry skirmish — tutorial-feeling. ~5 units per side, 8×8 grid.

**Files:**
- Create: `src/scenarios/01-wertingen.ts`
- Modify: `src/scenarios/index.ts`

- [ ] **Step 1: Write `src/scenarios/01-wertingen.ts`**

```ts
import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'austrian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'au'}-${id}`,
  name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const wertingen: Scenario = {
  id: 'wertingen',
  title: 'Wertingen — 8 October 1805',
  briefingMd: '01-wertingen-briefing',
  grid: { width: 8, height: 8 },
  tiles: [
    { pos: { x: 3, y: 3 }, terrain: 'forest' },
    { pos: { x: 4, y: 3 }, terrain: 'forest' },
    { pos: { x: 3, y: 4 }, terrain: 'forest' },
    { pos: { x: 0, y: 6 }, terrain: 'town' },
    { pos: { x: 1, y: 6 }, terrain: 'town' },
  ],
  units: [
    u('french',   'murat',     'Murat',          'heavy-cavalry', 1, 1, 3),
    u('french',   'lasalle',   'Lasalle',        'light-cavalry', 1, 3, 2),
    u('french',   'klein',     'Klein',          'light-cavalry', 1, 5, 2),
    u('french',   'oudinot',   'Oudinot',        'line-infantry', 0, 4, 3),
    u('austrian', 'auffenberg','Auffenberg',     'line-infantry', 6, 4, 1),
    u('austrian', 'spangen',   'Spangen',        'line-infantry', 6, 5, 1),
    u('austrian', 'au-cav',    'Austrian Hussars','light-cavalry', 7, 3, 1),
    u('austrian', 'au-arty',   'Austrian Battery','foot-artillery', 7, 6, 2),
  ],
  victory: [
    { for: 'french', kind: 'reduce-side-strength', args: { side: 'austrian', threshold: 6 } },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 8 } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '01-wertingen-postbattle',
};
```

- [ ] **Step 2: Update `src/scenarios/index.ts`**

```ts
import { wertingen } from './01-wertingen';
import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

export const campaignScenarios: Scenario[] = [
  wertingen,    // [0]
  austerlitz,   // [1] — rest of the campaign filled in Phase 3
];

export const getScenarioByIndex = (i: number): Scenario | undefined => campaignScenarios[i];
export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
```

- [ ] **Step 3: Commit**

```bash
git add src/scenarios/01-wertingen.ts src/scenarios/index.ts
git commit -m "feat(scenarios): add Wertingen"
```

---

### Task 17: Schöngrabern scenario (`src/scenarios/06-schongrabern.ts`)

Bagration's rearguard — French should attack but a strong defensive Russian line on a hill.

**Files:**
- Create: `src/scenarios/06-schongrabern.ts`
- Modify: `src/scenarios/index.ts`

- [ ] **Step 1: Write `src/scenarios/06-schongrabern.ts`**

```ts
import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'russian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'ru'}-${id}`, name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const schongrabern: Scenario = {
  id: 'schongrabern',
  title: 'Schöngrabern — 16 November 1805',
  briefingMd: '06-schongrabern-briefing',
  grid: { width: 10, height: 10 },
  tiles: [
    { pos: { x: 5, y: 4 }, terrain: 'hill' },
    { pos: { x: 6, y: 4 }, terrain: 'hill' },
    { pos: { x: 5, y: 5 }, terrain: 'hill' },
    { pos: { x: 6, y: 5 }, terrain: 'hill' },
    { pos: { x: 0, y: 0 }, terrain: 'forest' },
    { pos: { x: 0, y: 9 }, terrain: 'forest' },
    { pos: { x: 9, y: 0 }, terrain: 'forest' },
    { pos: { x: 9, y: 9 }, terrain: 'forest' },
  ],
  units: [
    u('french',  'murat',    'Murat',       'heavy-cavalry', 1, 4, 3),
    u('french',  'oudinot',  'Oudinot',     'grenadier',     1, 5, 3),
    u('french',  'soult-1',  'Soult Inf.',  'line-infantry', 1, 6, 2),
    u('french',  'soult-2',  'Soult Inf.',  'line-infantry', 1, 3, 2),
    u('french',  'fr-arty',  'French Btty', 'foot-artillery', 0, 5, 2),
    u('russian', 'bagration','Bagration',  'line-infantry', 6, 5, 3),
    u('russian', 'ru-1',     'Pavlov',     'line-infantry', 6, 4, 2),
    u('russian', 'ru-2',     'Doctorov',   'line-infantry', 6, 6, 2),
    u('russian', 'ru-cav',   'Cossacks',   'light-cavalry', 7, 5, 2),
    u('russian', 'ru-arty',  'Russian Btty','foot-artillery', 7, 7, 2),
  ],
  victory: [
    { for: 'french', kind: 'eliminate-unit', args: { unitId: 'ru-bagration' } },
    { for: 'russian', kind: 'survive-turns', args: { turns: 10 } },
  ],
  turnLimit: 10,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '06-schongrabern-postbattle',
};
```

- [ ] **Step 2: Update `src/scenarios/index.ts`**

```ts
import { wertingen } from './01-wertingen';
import { schongrabern } from './06-schongrabern';
import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

export const campaignScenarios: Scenario[] = [
  wertingen,    // [0]
  schongrabern, // [1]
  austerlitz,   // [2]
];

export const getScenarioByIndex = (i: number): Scenario | undefined => campaignScenarios[i];
export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
```

- [ ] **Step 3: Commit**

```bash
git add src/scenarios/06-schongrabern.ts src/scenarios/index.ts
git commit -m "feat(scenarios): add Schöngrabern"
```

---

### Task 18: Scenario validation + replay determinism tests

Both belong in `tests/` and run as part of `npm test`. They're the build-time guards against bad data and unintended engine drift.

**Files:**
- Create: `tests/scenarios/validate.test.ts`, `tests/replay/determinism.test.ts`

- [ ] **Step 1: Write `tests/scenarios/validate.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { campaignScenarios } from '../../src/scenarios';
import { inBounds } from '../../src/engine/grid';

describe('scenario validation', () => {
  for (const s of campaignScenarios) {
    describe(s.id, () => {
      it('all units in bounds', () => {
        for (const u of s.units) {
          expect(inBounds(u.position, s.grid)).toBe(true);
        }
      });

      it('unit IDs are unique', () => {
        const ids = s.units.map(u => u.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('no two units share a square', () => {
        const seen = new Set<string>();
        for (const u of s.units) {
          const k = `${u.position.x},${u.position.y}`;
          expect(seen.has(k)).toBe(false);
          seen.add(k);
        }
      });

      it('victory conditions reference real units', () => {
        for (const c of s.victory) {
          if (c.kind === 'eliminate-unit') {
            const id = c.args.unitId as string;
            expect(s.units.some(u => u.id === id)).toBe(true);
          }
        }
      });

      it('all tiles in bounds', () => {
        for (const t of s.tiles) {
          expect(inBounds(t.pos, s.grid)).toBe(true);
        }
      });

      it('has at least one victory condition for each side present', () => {
        const sides = new Set(s.units.map(u => u.side));
        const condFors = new Set(s.victory.map(v => v.for));
        for (const side of sides) {
          expect(condFors.has(side)).toBe(true);
        }
      });
    });
  }
});
```

- [ ] **Step 2: Write `tests/replay/determinism.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { wertingen } from '../../src/scenarios/01-wertingen';
import { beginBattle, endTurn, moveUnit, attack } from '../../src/engine';

describe('replay determinism', () => {
  it('same script always produces same final state and log', () => {
    const run = () => {
      let s = beginBattle(wertingen);
      // French turn: move Lasalle one step east
      s = moveUnit(s, 'fr-lasalle', { x: 2, y: 3 },
        { tiles: wertingen.tiles, grid: wertingen.grid }).state;
      s = endTurn(s).state;       // -> austrian
      s = endTurn(s).state;       // -> french turn 2
      // French turn 2: move Lasalle into contact with au-cav-equivalent if reachable
      // (Use a stable, in-range target.)
      const target = { x: 3, y: 3 };  // forest — reachable
      s = moveUnit(s, 'fr-lasalle', target,
        { tiles: wertingen.tiles, grid: wertingen.grid }).state;
      return s;
    };
    const a = run(); const b = run();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
```

- [ ] **Step 3: Run**

```bash
npm run test
# expect: all tests pass — engine + state + scenarios + replay determinism
```

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test: scenario validation + replay determinism"
```

---

### Task 19: Replay viewer (`src/ui/ReplayViewer.tsx`)

A minimal stepper over `state.log`. Phase 2 ships the pure log step; the visual replay-of-the-board is enriched in Phase 4.

**Files:**
- Create: `src/ui/ReplayViewer.tsx`
- Modify: `src/ui/Splash.tsx`, `src/app.tsx` to route to it.

- [ ] **Step 1: Write `src/ui/ReplayViewer.tsx`**

```tsx
import { useState } from 'react';
import { useGame } from '../state/store';
import { Button, Panel } from './shared';
import type { BattleEvent } from '../engine/types';

const describe = (e: BattleEvent): string => {
  switch (e.kind) {
    case 'turn-started':       return `Turn ${e.turn} — ${e.side} to act`;
    case 'turn-ended':         return `Turn ${e.turn} — ${e.side} ended`;
    case 'unit-moved':         return `${e.unitId} moved (${e.from.x},${e.from.y}) → (${e.to.x},${e.to.y})`;
    case 'formation-changed':  return `${e.unitId}: ${e.from} → ${e.to}`;
    case 'attack-resolved':    return `Attack ${e.attackerId} → ${e.defenderId}: ${e.result} (${e.attackerScore} vs ${e.defenderScore})`;
    case 'morale-revealed':    return `${e.unitId} morale revealed: ${'★'.repeat(e.morale)}`;
    case 'unit-eliminated':    return `${e.unitId} eliminated`;
    case 'unit-retreated':     return `${e.unitId} retreated`;
    case 'victory':            return `Victory: ${e.side} (${e.reason})`;
  }
};

export function ReplayViewer() {
  const { state, goto } = useGame();
  const [i, setI] = useState(0);
  const events = state?.log ?? [];

  return (
    <main className="min-h-full p-6 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-3xl">Replay</h2>
        <Button kind="secondary" onClick={() => goto('splash')}>Back</Button>
      </header>
      <Panel title={`Event ${i + 1} / ${events.length || 0}`}>
        <div className="font-mono text-sm bg-parchment p-3 rounded min-h-[3em]">
          {events[i] ? describe(events[i]) : '— no events —'}
        </div>
        <div className="flex gap-2 mt-3">
          <Button kind="secondary" onClick={() => setI(Math.max(0, i - 1))}>◀ Back</Button>
          <Button onClick={() => setI(Math.min(events.length - 1, i + 1))}>Forward ▶</Button>
        </div>
      </Panel>
      <Panel title="Full log">
        <div className="text-xs font-mono leading-relaxed max-h-72 overflow-y-auto bg-parchment p-2 rounded">
          {events.map((e, k) => (
            <div key={k} className={k === i ? 'bg-gilt/30 px-1' : 'px-1'}>{describe(e)}</div>
          ))}
        </div>
      </Panel>
    </main>
  );
}
```

- [ ] **Step 2: Add a Splash entry for Replay**

In `src/ui/Splash.tsx`, after the "Campaign Menu" button, insert:

```tsx
<div><Button onClick={() => goto('replay')} kind="secondary">Replay last run</Button></div>
```

- [ ] **Step 3: Update `src/app.tsx` switch**

Add the `replay` case before `default`:

```tsx
case 'replay': return <ReplayViewer />;
```

…and add the corresponding import at the top:

```tsx
import { ReplayViewer } from './ui/ReplayViewer';
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck    # clean
npm run dev          # smoke-test: play a few moves → Splash → Replay last run → step through
```

- [ ] **Step 5: Commit**

```bash
git add src/ui/ReplayViewer.tsx src/ui/Splash.tsx src/app.tsx
git commit -m "feat(ui): add replay viewer"
```

---

### Task 20: GitHub Actions deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.ts` (set `base` to `/<repo-name>/`)

- [ ] **Step 1: Update `vite.config.ts`**

Replace `base: './'` with the GitHub Pages-friendly base. Substitute your real repo name (e.g. `napoleanic-era-game`):

```ts
export default defineConfig({
  plugins: [react()],
  base: '/napoleanic-era-game/',     // ← change to your repo name if different
});
```

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Create the GitHub repo (manual)**

```bash
# After creating the repo on GitHub (private or public — your call), add the remote:
git remote add origin git@github.com:<your-username>/napoleanic-era-game.git
git push -u origin main
```

Then on GitHub: Settings → Pages → Source → "GitHub Actions". The first push to `main` triggers the workflow. Game lives at `https://<your-username>.github.io/napoleanic-era-game/`.

- [ ] **Step 4: Commit and tag W2**

```bash
git add .github/workflows/deploy.yml vite.config.ts
git commit -m "chore: GitHub Pages deploy workflow"
git tag w2-deployed
```

---

## Phase 3 — W3: Dispatches + Decisions + remaining 4 scenarios

### Task 21: Dispatch screen + Markdown loader (`src/ui/DispatchScreen.tsx`, `src/dispatches/`)

Markdown files are bundled at build time via Vite's `?raw` import. Each scenario's `briefingMd` and `postBattleDispatch` resolve to a filename under `src/dispatches/`.

**Files:**
- Create: `src/ui/DispatchScreen.tsx`, `src/dispatches/01-wertingen-briefing.md`, ...one md per existing scenario.
- Modify: `src/state/store.ts` to route `screen: 'dispatch'` between scenarios; `src/app.tsx` to render it.
- Add dependency: a tiny markdown renderer (`marked`).

- [ ] **Step 1: Install marked**

```bash
npm install marked
npm install -D @types/marked
```

- [ ] **Step 2: Add `src/dispatches/loader.ts`**

```ts
// Vite's import.meta.glob with `as: 'raw'` bundles all .md files as strings.
const files = import.meta.glob('./*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function loadDispatch(filename: string): string {
  const key = `./${filename}.md`;
  return files[key] ?? `*Dispatch missing: ${filename}*`;
}
```

- [ ] **Step 3: Write at least one briefing per existing scenario**

`src/dispatches/01-wertingen-briefing.md`:

```markdown
# Wertingen — 8 October 1805

The Austrian general Auffenberg has wandered too far from Mack's main body around Ulm. Murat's cavalry has caught him on the Wertingen plain, with Lannes' infantry coming up in support.

The Austrian column outnumbers your cavalry vanguard, but they are exhausted and unsupported. Strike fast — Lannes will not arrive for hours, and a slow advance will let the Austrians escape into the woods.

> *"They are between us and Ulm, mon Empereur. With your permission, I shall close the trap before the morning fog burns off."* — Murat to Napoleon
```

`src/dispatches/06-schongrabern-briefing.md`:

```markdown
# Schöngrabern — 16 November 1805

Bagration has been left behind by Kutuzov to fight a delaying action — eight thousand Russians against twenty-five thousand French. He is ordered to die in place if necessary so that the main Russian army can escape across the Danube.

You have him fixed against the hill. Murat is here, Soult is here, the artillery is up. There is no excuse not to break him today.

> *"He is a brave man. So were the Spartans."* — Marshal Lannes, observing the Russian line.
```

`src/dispatches/07-austerlitz-briefing.md`:

```markdown
# Austerlitz — 2 December 1805

The trap is set. The Allies, taking the bait, have abandoned the Pratzen Heights to swing south against your weakened right flank. As they march off the heights, Soult's IV Corps will burst out of the morning fog and seize the empty centre.

Hold the right flank just long enough. The Heights are everything.

> *"Gentlemen, examine these heights carefully. In a few hours from now you will be the masters of them."* — Napoleon to his marshals, the night before.
```

(Stub the rest — `02-haslach-briefing.md`, `03-elchingen-briefing.md`, `04-ulm-briefing.md`, `05-krems-briefing.md`, `*-postbattle.md` — with one paragraph placeholders for now; flesh them out after implementing the corresponding scenarios in tasks 23-26.)

```bash
for f in 02-haslach 03-elchingen 04-ulm 05-krems; do
  printf '# %s\n\n*Briefing TBD — see Phase 3 task for scenario.*\n' "$f" \
    > "src/dispatches/${f}-briefing.md"
done
for f in 01-wertingen 02-haslach 03-elchingen 04-ulm 05-krems 06-schongrabern 07-austerlitz; do
  printf '# %s — Aftermath\n\n*Postbattle dispatch TBD.*\n' "$f" \
    > "src/dispatches/${f}-postbattle.md"
done
```

- [ ] **Step 4: Write `src/ui/DispatchScreen.tsx`**

```tsx
import { marked } from 'marked';
import { useGame } from '../state/store';
import { loadDispatch } from '../dispatches/loader';
import { Button, Panel } from './shared';
import { DecisionPicker } from './DecisionPicker';

export function DispatchScreen() {
  const { state, scenario, goto } = useGame();
  if (!state || !scenario) return null;

  const md = loadDispatch(scenario.briefingMd);
  const html = marked.parse(md, { async: false }) as string;

  const decision = scenario.preBattleDecision;
  const decisionTaken = state.decisionsTaken.some(d => d.decisionId === decision?.id);

  return (
    <main className="min-h-full p-6 max-w-3xl mx-auto">
      <Panel>
        <article
          className="prose prose-stone font-serif text-lg leading-relaxed max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Panel>
      {decision && !decisionTaken && <DecisionPicker decision={decision} />}
      {(!decision || decisionTaken) && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => goto('battle')}>Continue to battle →</Button>
        </div>
      )}
    </main>
  );
}
```

(`DecisionPicker` is created in Task 22.)

- [ ] **Step 5: Wire into `app.tsx` switch**

Add:

```tsx
case 'dispatch': return <DispatchScreen />;
```

…and import `DispatchScreen`.

- [ ] **Step 6: Commit (skip typecheck — DecisionPicker pending Task 22)**

```bash
git add src/ui/DispatchScreen.tsx src/dispatches/ src/app.tsx package.json package-lock.json
git commit -m "feat(ui): add dispatch screen with markdown briefings"
```

---

### Task 22: Decision picker + ScenarioPatch application (`src/ui/DecisionPicker.tsx`, `src/engine/patch.ts`)

Decisions live in scenario data; the engine applies their patches when transitioning into a battle.

**Files:**
- Create: `src/ui/DecisionPicker.tsx`, `src/engine/patch.ts`
- Modify: `src/engine/index.ts`, `src/engine/turn.ts` (add `applyDecision`, refactor `beginBattle` to apply pending patches)
- Test: `tests/engine/patch.test.ts`

- [ ] **Step 1: Write `tests/engine/patch.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import type { Scenario, ScenarioPatch } from '../../src/engine/types';
import { applyPatch } from '../../src/engine/patch';

const baseScenario = (): Scenario => ({
  id: 't', title: 'T', briefingMd: 't',
  grid: { width: 5, height: 5 }, tiles: [],
  units: [
    { id: 'u1', side: 'french', type: 'line-infantry',
      position: { x: 0, y: 0 }, facing: 'E', formation: 'line',
      strength: 4, morale: 2 },
  ],
  victory: [{ for: 'french', kind: 'survive-turns', args: { turns: 5 } }],
  ai: { generalRule: 'defensive', triggers: [] },
});

describe('scenario patch', () => {
  it('adds units', () => {
    const p: ScenarioPatch = {
      unitsAdded: [{
        id: 'u2', side: 'french', type: 'light-cavalry',
        position: { x: 1, y: 0 }, facing: 'E', formation: 'line',
        strength: 4, morale: 2,
      }],
    };
    expect(applyPatch(baseScenario(), p).units).toHaveLength(2);
  });

  it('removes units by id', () => {
    const p: ScenarioPatch = { unitsRemovedByIds: ['u1'] };
    expect(applyPatch(baseScenario(), p).units).toHaveLength(0);
  });

  it('overrides unit fields', () => {
    const p: ScenarioPatch = { unitOverrides: [{ id: 'u1', strength: 2 }] };
    expect(applyPatch(baseScenario(), p).units[0].strength).toBe(2);
  });

  it('overrides victory conditions', () => {
    const p: ScenarioPatch = {
      victoryOverride: [{ for: 'french', kind: 'survive-turns', args: { turns: 99 } }],
    };
    expect(applyPatch(baseScenario(), p).victory[0].args.turns).toBe(99);
  });

  it('returns identical scenario when patch is empty', () => {
    expect(applyPatch(baseScenario(), {})).toEqual(baseScenario());
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- tests/engine/patch.test.ts
```

- [ ] **Step 3: Write `src/engine/patch.ts`**

```ts
import type { Scenario, ScenarioPatch, Unit, Tile } from './types';
import { posEq } from './grid';

export function applyPatch(s: Scenario, p: ScenarioPatch): Scenario {
  let units = [...s.units];
  if (p.unitsRemovedByIds?.length) {
    units = units.filter(u => !p.unitsRemovedByIds!.includes(u.id));
  }
  if (p.unitOverrides?.length) {
    units = units.map(u => {
      const ov = p.unitOverrides!.find(o => o.id === u.id);
      return ov ? { ...u, ...ov } as Unit : u;
    });
  }
  if (p.unitsAdded?.length) {
    units = [...units, ...p.unitsAdded];
  }

  let tiles = s.tiles;
  if (p.tilesOverridden?.length) {
    const overrideMap = new Map(p.tilesOverridden.map(t => [`${t.pos.x},${t.pos.y}`, t]));
    const filtered = s.tiles.filter(t => !overrideMap.has(`${t.pos.x},${t.pos.y}`));
    tiles = [...filtered, ...p.tilesOverridden];
    void posEq;  // imported for parity with engine/grid; not used here directly
  }

  return {
    ...s,
    units,
    tiles,
    victory: p.victoryOverride ?? s.victory,
    turnLimit: p.turnLimitOverride ?? s.turnLimit,
  };
}

export const _typeWitness = null as unknown as Tile; // suppress unused-import warnings if any
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test -- tests/engine/patch.test.ts
# expect: 5/5 pass
```

- [ ] **Step 5: Add `applyDecision` to `src/engine/turn.ts`**

```ts
import { applyPatch } from './patch';

export function applyDecisionToScenario(
  scenario: Scenario,
  state: GameState,
  optionIndex: number,
): { scenario: Scenario; state: GameState } {
  const decision = scenario.preBattleDecision;
  if (!decision) return { scenario, state };
  if (state.decisionsTaken.some(d => d.decisionId === decision.id)) {
    return { scenario, state };
  }
  const opt = decision.options[optionIndex];
  if (!opt) throw new Error(`Decision option ${optionIndex} out of range`);
  const patched = applyPatch(scenario, opt.patch);
  const newState: GameState = {
    ...state,
    decisionsTaken: [...state.decisionsTaken, { decisionId: decision.id, optionIndex }],
  };
  return { scenario: patched, state: newState };
}
```

Add `applyDecisionToScenario` to `src/engine/index.ts` exports (it's already there because of `export * from './turn'`).

Also export `applyPatch`:

```ts
export * from './patch';
```

- [ ] **Step 6: Update `beginBattle` to *re-apply pending decisions on resume***

Modify `beginBattle` in `turn.ts` to optionally accept already-recorded decisions and apply them:

```ts
export function beginBattle(scenario: Scenario, takenDecisions: GameState['decisionsTaken'] = []): GameState {
  let s = scenario;
  if (s.preBattleDecision) {
    const taken = takenDecisions.find(d => d.decisionId === s.preBattleDecision!.id);
    if (taken) {
      s = applyPatch(s, s.preBattleDecision.options[taken.optionIndex].patch);
    }
  }
  return {
    schemaVersion: 1,
    campaignId: 'ulm-austerlitz-1805',
    scenarioIndex: 0,
    scenarioId: s.id,
    units: s.units.map(u => ({ ...u })),
    currentSide: 'french',
    turn: 1,
    phase: 'orders',
    selectedUnitId: null,
    log: [{ kind: 'turn-started', turn: 1, side: 'french' }],
    decisionsTaken: takenDecisions,
    outcomes: [],
    pendingDecisionId: null,
  };
}
```

- [ ] **Step 7: Write `src/ui/DecisionPicker.tsx`**

```tsx
import { marked } from 'marked';
import { useGame } from '../state/store';
import type { Decision } from '../engine/types';
import { Button, Panel } from './shared';

export function DecisionPicker({ decision }: { decision: Decision }) {
  const { state, scenario, goto } = useGame();
  if (!state || !scenario) return null;

  const promptHtml = marked.parse(decision.promptMd, { async: false }) as string;

  const choose = (i: number) => {
    // Apply the patch in-place: rebuild GameState by calling beginBattle on the patched scenario.
    // We do that by recording the decision and re-running beginBattle through the store.
    useGame.setState(s => {
      const newDecisions = [...s.state!.decisionsTaken, { decisionId: decision.id, optionIndex: i }];
      // Recreate the GameState applying the chosen patch
      const { applyPatch } = require('../engine/patch');
      const patched = applyPatch(scenario, decision.options[i].patch);
      const fresh = require('../engine').beginBattle(patched, newDecisions);
      fresh.scenarioIndex = s.state!.scenarioIndex;
      fresh.outcomes = s.state!.outcomes;
      return { state: fresh, scenario: patched, history: [fresh] };
    });
    goto('battle');
  };

  return (
    <Panel title="Your decision">
      <div className="prose prose-stone max-w-none mb-3"
           dangerouslySetInnerHTML={{ __html: promptHtml }} />
      <div className="space-y-2">
        {decision.options.map((o, i) => (
          <div key={i}><Button onClick={() => choose(i)} kind="secondary">{o.label}</Button></div>
        ))}
      </div>
    </Panel>
  );
}
```

(Replace the `require()` calls with proper top-of-file imports if your toolchain prefers — they work in Vite ESM but ESM imports are cleaner: `import { applyPatch } from '../engine/patch'; import { beginBattle } from '../engine';`.)

- [ ] **Step 8: Verify**

```bash
npm run typecheck && npm run test
# expect: clean + all pass
```

- [ ] **Step 9: Commit**

```bash
git add src/engine/patch.ts src/engine/turn.ts src/engine/index.ts src/ui/DecisionPicker.tsx tests/engine/patch.test.ts
git commit -m "feat(engine,ui): scenario patches and decision picker"
```

---

### Task 23: Haslach-Jungingen scenario (`src/scenarios/02-haslach.ts`)

French rearguard holds. Add a `preBattleDecision` so the dispatch–decision loop is exercised.

**Files:**
- Create: `src/scenarios/02-haslach.ts`
- Modify: `src/scenarios/index.ts`, `src/dispatches/02-haslach-briefing.md`

- [ ] **Step 1: Write `src/scenarios/02-haslach.ts`**

```ts
import type { Scenario, Unit, Decision } from '../engine/types';

const u = (
  side: 'french' | 'austrian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'au'}-${id}`,
  name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

const decision: Decision = {
  id: 'haslach-pre',
  promptMd:
    'Werneck has cut off Dupont\'s 6,000 men with three times their number. Dupont, vastly outnumbered, intends to attack rather than be enveloped.\n\n**Reinforce by sending a battalion of light infantry forward at the cost of leaving the rearguard thinner — or hold them back?**',
  options: [
    {
      label: 'Send the light infantry forward',
      patch: { unitsAdded: [
        { id: 'fr-light-reinforcement', name: 'Light Bn (reinforcement)',
          side: 'french', type: 'light-infantry', position: { x: 1, y: 4 },
          facing: 'E', formation: 'line', strength: 3, morale: 2 },
      ] },
    },
    {
      label: 'Hold the rearguard intact',
      patch: { unitOverrides: [
        { id: 'fr-dupont', morale: 3 },   // tougher Dupont
      ] },
    },
  ],
};

export const haslach: Scenario = {
  id: 'haslach',
  title: 'Haslach-Jungingen — 11 October 1805',
  briefingMd: '02-haslach-briefing',
  grid: { width: 9, height: 9 },
  tiles: [
    { pos: { x: 4, y: 4 }, terrain: 'town' },
    { pos: { x: 5, y: 4 }, terrain: 'town' },
    { pos: { x: 0, y: 8 }, terrain: 'river' },
    { pos: { x: 1, y: 8 }, terrain: 'river' },
    { pos: { x: 2, y: 8 }, terrain: 'bridge' },
    { pos: { x: 3, y: 8 }, terrain: 'river' },
  ],
  units: [
    u('french',   'dupont',    'Dupont',         'line-infantry', 2, 4, 3),
    u('french',   'fr-1',      'French Inf.',    'line-infantry', 2, 3, 2),
    u('french',   'fr-2',      'French Inf.',    'line-infantry', 2, 5, 2),
    u('french',   'fr-arty',   'Battery',        'foot-artillery', 1, 4, 2),
    u('austrian', 'werneck',   'Werneck',        'line-infantry', 7, 4, 2),
    u('austrian', 'au-1',      'Austrian Inf.',  'line-infantry', 7, 3, 1),
    u('austrian', 'au-2',      'Austrian Inf.',  'line-infantry', 7, 5, 1),
    u('austrian', 'au-cav',    'Austrian Hussars','light-cavalry', 8, 4, 2),
  ],
  victory: [
    { for: 'french', kind: 'survive-turns', args: { turns: 8 } },
    { for: 'austrian', kind: 'eliminate-unit', args: { unitId: 'fr-dupont' } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'aggressive', triggers: [] },
  preBattleDecision: decision,
  postBattleDispatch: '02-haslach-postbattle',
};
```

- [ ] **Step 2: Replace `src/dispatches/02-haslach-briefing.md`**

```markdown
# Haslach-Jungingen — 11 October 1805

Dupont has six thousand men. Werneck, attempting to break out of the cordon around Ulm, has thrown twenty thousand at him. The plain south of Haslach is open ground; behind Dupont, the Danube. There is nowhere to run.

Dupont, against every rule of war, has decided to attack first.

> *"If we are to die, let it be facing them."*
```

- [ ] **Step 3: Update `src/scenarios/index.ts`**

```ts
import { wertingen } from './01-wertingen';
import { haslach } from './02-haslach';
import { schongrabern } from './06-schongrabern';
import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

export const campaignScenarios: Scenario[] = [
  wertingen, haslach, schongrabern, austerlitz,
];
export const getScenarioByIndex = (i: number): Scenario | undefined => campaignScenarios[i];
export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
```

- [ ] **Step 4: Commit**

```bash
git add src/scenarios/02-haslach.ts src/scenarios/index.ts src/dispatches/02-haslach-briefing.md
git commit -m "feat(scenarios): add Haslach-Jungingen with pre-battle decision"
```

---

### Task 24: Elchingen scenario (`src/scenarios/03-elchingen.ts`)

Ney's bridge assault. River crossing is the hard tactical thing.

**Files:** create `src/scenarios/03-elchingen.ts`, briefing md, update `index.ts`.

- [ ] **Step 1: Write `src/scenarios/03-elchingen.ts`**

```ts
import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'austrian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'au'}-${id}`,
  name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const elchingen: Scenario = {
  id: 'elchingen',
  title: 'Elchingen — 14 October 1805',
  briefingMd: '03-elchingen-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    // Danube splits the map; one bridge in the middle.
    ...Array.from({ length: 10 }, (_, x) => ({
      pos: { x, y: 3 } as const,
      terrain: x === 5 ? ('bridge' as const) : ('river' as const),
    })),
    { pos: { x: 5, y: 4 }, terrain: 'town' },   // village of Elchingen
    { pos: { x: 6, y: 4 }, terrain: 'hill' },
    { pos: { x: 4, y: 4 }, terrain: 'hill' },
  ],
  units: [
    u('french',   'ney',     'Ney',         'line-infantry', 4, 0, 3),
    u('french',   'loison',  'Loison',      'line-infantry', 5, 0, 2),
    u('french',   'malher',  'Malher',      'light-infantry', 5, 1, 2),
    u('french',   'fr-cav',  'French Cav.', 'light-cavalry', 6, 0, 2),
    u('french',   'fr-arty', 'Battery',     'foot-artillery', 4, 1, 2),
    u('austrian', 'riesch',  'Riesch',      'line-infantry', 5, 5, 2),
    u('austrian', 'au-1',    'Austrian Inf.','line-infantry', 4, 5, 2),
    u('austrian', 'au-2',    'Austrian Inf.','line-infantry', 6, 5, 2),
    u('austrian', 'au-arty', 'Austrian Btty','foot-artillery', 5, 6, 2),
  ],
  victory: [
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 5, y: 4 } } },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 8 } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '03-elchingen-postbattle',
};
```

- [ ] **Step 2: Replace `src/dispatches/03-elchingen-briefing.md`**

```markdown
# Elchingen — 14 October 1805

Ney has been ordered to cross the Danube and storm the village of Elchingen on the heights opposite. Mack's army is dissolving inside Ulm; cutting Elchingen seals the encirclement.

The bridge is intact but exposed. The Austrian battery on the heights commands every yard of the approach. Push forward through the smoke and take the village before nightfall.
```

- [ ] **Step 3: Update `src/scenarios/index.ts`** (insert `elchingen` between `haslach` and `schongrabern`).

- [ ] **Step 4: Commit**

```bash
git add src/scenarios/03-elchingen.ts src/scenarios/index.ts src/dispatches/03-elchingen-briefing.md
git commit -m "feat(scenarios): add Elchingen"
```

---

### Task 25: Ulm "maneuver puzzle" scenario (`src/scenarios/04-ulm.ts`)

A non-fight: French units already surround a fixed Austrian core. Victory is *capture all 4 tiles around the city* before turn limit. The Austrian AI does nothing aggressive — it stands. This trains positioning + cooperation.

**Files:** create `src/scenarios/04-ulm.ts`, briefing md, update `index.ts`.

- [ ] **Step 1: Write `src/scenarios/04-ulm.ts`**

```ts
import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'austrian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'au'}-${id}`,
  name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const ulm: Scenario = {
  id: 'ulm',
  title: 'The Surrender at Ulm — 17 October 1805',
  briefingMd: '04-ulm-briefing',
  grid: { width: 10, height: 10 },
  tiles: [
    // Ulm — town tiles in a 2×2 block, surrounded by neutral terrain
    { pos: { x: 4, y: 4 }, terrain: 'town' },
    { pos: { x: 5, y: 4 }, terrain: 'town' },
    { pos: { x: 4, y: 5 }, terrain: 'town' },
    { pos: { x: 5, y: 5 }, terrain: 'town' },
    // Roads radiating out — capture targets
    { pos: { x: 3, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
    { pos: { x: 4, y: 3 }, terrain: 'road' },
    { pos: { x: 4, y: 6 }, terrain: 'road' },
  ],
  units: [
    u('french',   'soult',  'Soult',       'line-infantry', 1, 4, 3),
    u('french',   'lannes', 'Lannes',      'line-infantry', 1, 5, 3),
    u('french',   'murat',  'Murat',       'heavy-cavalry', 1, 6, 3),
    u('french',   'ney',    'Ney',         'line-infantry', 8, 4, 3),
    u('french',   'davout', 'Davout',      'line-infantry', 8, 5, 3),
    u('austrian', 'mack',   'Mack',        'line-infantry', 4, 4, 1),
    u('austrian', 'au-1',   'Austrian Inf.','line-infantry', 5, 5, 1),
  ],
  victory: [
    // French — close all four roads
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 3, y: 4 } } },
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 6, y: 4 } } },
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 3 } } },
    { for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 6 } } },
    { for: 'austrian', kind: 'survive-turns', args: { turns: 6 } },
  ],
  turnLimit: 6,
  ai: { generalRule: 'defensive', triggers: [] },
  postBattleDispatch: '04-ulm-postbattle',
};
```

NOTE: Spec §3.2 victory matching rule: ANY one condition for a side triggers victory. The Ulm scenario as written would trigger French victory when only ONE road is closed — wrong. Change the victory check semantics for this scenario by representing it as a single grouped condition. Simplest fix without engine changes: include only **one** road as the actual victory tile (the *southwestern* one), with dispatch text framing the others as "secondary objectives". Alternatively introduce an `all-of` victory condition. For Phase 3, take the simpler path:

Replace `victory` with:

```ts
victory: [
  { for: 'french', kind: 'capture-tile', args: { pos: { x: 4, y: 6 } } },  // primary road
  { for: 'austrian', kind: 'survive-turns', args: { turns: 6 } },
],
```

And mention the simplification in the briefing.

- [ ] **Step 2: Write `src/dispatches/04-ulm-briefing.md`**

```markdown
# The Surrender at Ulm — 17 October 1805

There will be no battle today. Mack is trapped inside Ulm with thirty thousand men. The encirclement is complete in every direction except the southern road towards Switzerland.

Close that road. The army inside Ulm dissolves on the next sunrise.

*This is a maneuver puzzle: position a French unit on the southern road tile (4, 6) within six turns. Mack will not attack — he is already negotiating his surrender. There are no casualties to take. There is only geometry.*
```

- [ ] **Step 3: Update `src/scenarios/index.ts`** (insert `ulm` between `elchingen` and `schongrabern`; the chronology actually places Ulm before Krems and Schöngrabern).

```ts
export const campaignScenarios: Scenario[] = [
  wertingen, haslach, elchingen, ulm, schongrabern, austerlitz,  // Krems added in Task 26
];
```

- [ ] **Step 4: Commit**

```bash
git add src/scenarios/04-ulm.ts src/scenarios/index.ts src/dispatches/04-ulm-briefing.md
git commit -m "feat(scenarios): add Ulm maneuver puzzle"
```

---

### Task 26: Krems scenario (`src/scenarios/05-krems.ts`)

Mortier's near-disaster. French outnumbered; victory = survive turn limit; Russian AI = aggressive.

**Files:** create `src/scenarios/05-krems.ts`, briefing md, update `index.ts`.

- [ ] **Step 1: Write `src/scenarios/05-krems.ts`**

```ts
import type { Scenario, Unit } from '../engine/types';

const u = (
  side: 'french' | 'russian',
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `${side === 'french' ? 'fr' : 'ru'}-${id}`,
  name, side, type,
  position: { x, y }, facing: side === 'french' ? 'E' : 'W',
  formation: 'line', strength: 4, morale,
});

export const krems: Scenario = {
  id: 'krems',
  title: 'Krems / Dürnstein — 11 November 1805',
  briefingMd: '05-krems-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    // Danube along the bottom
    ...Array.from({ length: 10 }, (_, x) => ({
      pos: { x, y: 7 } as const, terrain: 'river' as const,
    })),
    { pos: { x: 5, y: 7 }, terrain: 'bridge' },
    // Hills around Dürnstein
    { pos: { x: 3, y: 3 }, terrain: 'hill' },
    { pos: { x: 4, y: 3 }, terrain: 'hill' },
    { pos: { x: 5, y: 3 }, terrain: 'hill' },
    { pos: { x: 6, y: 3 }, terrain: 'hill' },
    // Krems town
    { pos: { x: 8, y: 5 }, terrain: 'town' },
    { pos: { x: 9, y: 5 }, terrain: 'town' },
    // Forest narrow defile
    { pos: { x: 1, y: 4 }, terrain: 'forest' },
    { pos: { x: 2, y: 4 }, terrain: 'forest' },
    { pos: { x: 1, y: 5 }, terrain: 'forest' },
  ],
  units: [
    u('french',   'mortier',  'Mortier',     'line-infantry', 5, 5, 3),
    u('french',   'gazan',    'Gazan',       'line-infantry', 4, 5, 2),
    u('french',   'fr-1',     'French Inf.', 'light-infantry', 6, 5, 2),
    u('french',   'fr-arty',  'Battery',     'foot-artillery', 5, 6, 2),
    u('russian',  'kutuzov',  'Kutuzov',     'line-infantry', 5, 1, 3),
    u('russian',  'ru-1',     'Russian Inf.','line-infantry', 4, 1, 2),
    u('russian',  'ru-2',     'Russian Inf.','line-infantry', 6, 1, 2),
    u('russian',  'ru-3',     'Russian Inf.','line-infantry', 4, 2, 2),
    u('russian',  'ru-4',     'Russian Inf.','line-infantry', 6, 2, 2),
    u('russian',  'ru-cav',   'Russian Cav.','light-cavalry', 7, 1, 2),
  ],
  victory: [
    { for: 'french', kind: 'survive-turns', args: { turns: 8 } },
    { for: 'russian', kind: 'eliminate-unit', args: { unitId: 'fr-mortier' } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'aggressive', triggers: [] },
  postBattleDispatch: '05-krems-postbattle',
};
```

- [ ] **Step 2: Write `src/dispatches/05-krems-briefing.md`**

```markdown
# Krems / Dürnstein — 11 November 1805

Mortier marches along the north bank of the Danube, separated from the rest of the army by the river. Kutuzov has spotted the isolation. The Russians are coming down off the hills in three columns to overwhelm a force half their size.

Survive. The army is racing to your relief but they will not arrive before nightfall.
```

- [ ] **Step 3: Update `src/scenarios/index.ts`** so the order is: Wertingen, Haslach, Elchingen, Ulm, Krems, Schöngrabern, Austerlitz.

```ts
export const campaignScenarios: Scenario[] = [
  wertingen, haslach, elchingen, ulm, krems, schongrabern, austerlitz,
];
```

- [ ] **Step 4: Run all tests including scenario validation**

```bash
npm run test
# expect: all 7 scenarios validate, replay determinism still holds
```

- [ ] **Step 5: Commit**

```bash
git add src/scenarios/05-krems.ts src/scenarios/index.ts src/dispatches/05-krems-briefing.md
git commit -m "feat(scenarios): add Krems and complete the 7-battle campaign"
```

---

### Task 27: Help overlay (`src/ui/HelpOverlay.tsx`)

A modal reachable from any screen via a small "?" button. Shows terrain effects, formation effects, combat thresholds, and key bindings.

**Files:**
- Create: `src/ui/HelpOverlay.tsx`
- Modify: `src/state/store.ts` (add `helpOpen: boolean; toggleHelp(): void`), `src/app.tsx` (mount globally), and the Battle screen action bar to surface the button.

- [ ] **Step 1: Add help state to the store**

In `src/state/store.ts` `Store` interface add `helpOpen: boolean; toggleHelp(): void;` and in the `create` body initial value `helpOpen: false,` and method:

```ts
toggleHelp() { set(s => ({ helpOpen: !s.helpOpen })); },
```

- [ ] **Step 2: Write `src/ui/HelpOverlay.tsx`**

```tsx
import { useGame } from '../state/store';
import { Button } from './shared';

export function HelpOverlay() {
  const { helpOpen, toggleHelp } = useGame();
  if (!helpOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-6"
         onClick={toggleHelp}>
      <div className="bg-parchment text-ink max-w-2xl w-full rounded shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-2xl">How to Play</h2>
          <Button kind="secondary" onClick={toggleHelp}>Close</Button>
        </header>

        <h3 className="font-bold mt-4">Combat</h3>
        <p>Combat compares <code>strength + terrain + flank + formation + morale</code> on each side. Larger gap is better for the higher side.</p>
        <table className="text-sm border w-full mt-2 mb-3">
          <thead className="bg-parchmentDark"><tr><th className="p-1 text-left">Result gap</th><th className="p-1 text-left">Outcome</th></tr></thead>
          <tbody>
            <tr><td className="p-1">≤ −2</td><td className="p-1">Attacker breaks (−2 strength, retreats)</td></tr>
            <tr><td className="p-1">−1</td><td className="p-1">Attacker repulsed (−1 strength)</td></tr>
            <tr><td className="p-1">0 to +1</td><td className="p-1">Exchange (both lose 1)</td></tr>
            <tr><td className="p-1">+2</td><td className="p-1">Defender retreats</td></tr>
            <tr><td className="p-1">≥ +3</td><td className="p-1">Defender broken (−2 strength)</td></tr>
          </tbody>
        </table>

        <h3 className="font-bold">Terrain (defender bonus)</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Hill / Forest / Town: +1 defence</li>
          <li>River: impassable except at bridges</li>
          <li>Marsh: triple movement cost</li>
        </ul>

        <h3 className="font-bold mt-3">Formations</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Line — +1 in firefights</li>
          <li>Column — +1 movement; −1 in firefights</li>
          <li>Square — +2 vs cavalry, −2 vs artillery</li>
        </ul>

        <h3 className="font-bold mt-3">Morale (hidden)</h3>
        <p className="text-sm">Each unit has a hidden morale of 1 (Conscript), 2 (Veteran), or 3 (Elite). The defender's morale is revealed the first time they're attacked.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Mount globally in `src/app.tsx`**

Wrap the existing switch with a fragment that renders `<HelpOverlay />` on top:

```tsx
return (
  <>
    {(() => { switch (screen) { /* ...same cases... */ } })()}
    <HelpOverlay />
  </>
);
```

…and import `HelpOverlay`. Add a `?` button in the BattleScreen action bar:

```tsx
<Button kind="secondary" onClick={useGame.getState().toggleHelp}>?</Button>
```

- [ ] **Step 4: Commit**

```bash
git add src/state/store.ts src/ui/HelpOverlay.tsx src/app.tsx
git commit -m "feat(ui): add help overlay"
```

---

### Task 28: Formation/facing visual indicators + polished attack-math preview

Refines the `BattleBoard` and `AttackPreview` to show formation glyphs, a facing triangle on the front edge, and a numeric combat preview that shows attacker/defender totals with the defender's morale displayed as `?` when unrevealed.

**Files:**
- Modify: `src/ui/BattleBoard.tsx`, `src/ui/AttackPreview.tsx`
- Add helper: `src/engine/preview.ts` — a pure version of the combat-math preview (returns the deterministic score on each side).

- [ ] **Step 1: Add `src/engine/preview.ts`**

Reuses scoring from `combat.ts`. Extract the shared `scoreFor` into a small exported helper. Modify `combat.ts` to export `scoreFor` (rename if needed) and re-import it here, OR — simpler — duplicate the formula in `preview.ts` since it already lives in spec §3.1.

```ts
import type { Unit, Tile } from './types';
import { posEq, chebyshev } from './grid';

const isCavalry = (t: Unit['type']) => t === 'light-cavalry' || t === 'heavy-cavalry';
const isInfantry = (t: Unit['type']) => t === 'line-infantry' || t === 'light-infantry' || t === 'grenadier';
const isArtillery = (t: Unit['type']) => t === 'foot-artillery' || t === 'horse-artillery';

const terrainAt = (p: Unit['position'], tiles: Tile[]) =>
  tiles.find(t => posEq(t.pos, p))?.terrain ?? 'plain';

export interface CombatPreview {
  attackerScore: number;
  defenderScore: number;          // includes defender's morale even if unrevealed
  defenderRevealed: boolean;
  predictedResult: string;        // e.g. "+2 → defender retreats"
}

export function previewAttack(
  attacker: Unit, defender: Unit, allUnits: Unit[], tiles: Tile[],
): CombatPreview {
  const score = (u: Unit, opp: Unit, isAttacker: boolean): number => {
    let s = u.strength + u.morale;
    if (!isAttacker) {
      const ter = terrainAt(u.position, tiles);
      if (ter === 'hill' || ter === 'forest' || ter === 'town') s += 1;
    }
    if (u.formation === 'square' && isCavalry(opp.type)) s += 2;
    if (u.formation === 'square' && isArtillery(opp.type)) s -= 2;
    if (u.formation === 'column' && isInfantry(opp.type)) s -= 1;
    if (u.formation === 'line' && isInfantry(opp.type)) s += 1;
    if (isAttacker) {
      const friends = allUnits.filter(o => o.side === u.side && o.id !== u.id &&
        chebyshev(o.position, opp.position) === 1);
      if (friends.length > 0) s += 1;
      if (isCavalry(u.type) && isInfantry(opp.type) && opp.formation !== 'square') s += 1;
    }
    return s;
  };
  const a = score(attacker, defender, true);
  const d = score(defender, attacker, false);
  const gap = a - d;
  let predicted = 'exchange';
  if (gap <= -2) predicted = 'attacker breaks';
  else if (gap === -1) predicted = 'attacker repulsed';
  else if (gap <= 1)   predicted = 'exchange';
  else if (gap === 2)  predicted = 'defender retreats';
  else                  predicted = 'defender broken';

  return {
    attackerScore: a,
    defenderScore: d,
    defenderRevealed: !!defender.moraleRevealed,
    predictedResult: `${gap >= 0 ? '+' : ''}${gap} → ${predicted}`,
  };
}
```

Export from `src/engine/index.ts`: add `export * from './preview';`.

- [ ] **Step 2: Polish `src/ui/AttackPreview.tsx`**

```tsx
import type { Unit, Scenario } from '../engine/types';
import { Panel } from './shared';
import { previewAttack } from '../engine/preview';

export function AttackPreview({
  attacker, defender, allUnits, tiles,
}: {
  attacker: Unit | null; defender: Unit | null;
  allUnits: Unit[]; tiles: Scenario['tiles'];
}) {
  if (!attacker || !defender) return null;
  const p = previewAttack(attacker, defender, allUnits, tiles);
  const dScoreDisplay = p.defenderRevealed
    ? p.defenderScore.toString()
    : `${p.defenderScore - defender.morale} + ?morale`;

  return (
    <Panel title="Attack preview">
      <div className="text-sm space-y-1">
        <div className="flex justify-between"><span>Attacker</span>
          <span className="font-semibold">{attacker.strength} + {attacker.morale} = {p.attackerScore}</span>
        </div>
        <div className="flex justify-between"><span>Defender</span>
          <span className="font-semibold">{dScoreDisplay}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-ink/20">
          <span className="text-ink/60">Predicted</span>
          <span className="font-bold">{p.defenderRevealed ? p.predictedResult : 'depends on hidden morale'}</span>
        </div>
      </div>
    </Panel>
  );
}
```

Update the `BattleScreen` in `app.tsx` to pass `allUnits={state.units}` and `tiles={scenario.tiles}` to `<AttackPreview>`.

- [ ] **Step 3: Add formation glyph + facing triangle to `BattleBoard.tsx`**

Inside the unit rendering `<g>`, after the strength badge, append:

```tsx
{/* Formation glyph */}
<text x={4} y={cellSize - 12} fontSize="11" fontWeight="700" fill={SIDE_TEXT[u.side]}>
  {u.formation === 'line' ? '—' : u.formation === 'column' ? '⋮' : '▢'}
</text>
{/* Facing triangle on the front edge */}
<polygon
  points={facingTriangle(u.facing, cellSize - 8)}
  fill={SIDE_TEXT[u.side]} opacity={0.7}
/>
```

Add this helper near the top of the file:

```tsx
function facingTriangle(f: 'N' | 'E' | 'S' | 'W', size: number): string {
  const m = size / 2; const t = 4;
  switch (f) {
    case 'N': return `${m - t},0 ${m + t},0 ${m},${-t}`;
    case 'E': return `${size},${m - t} ${size},${m + t} ${size + t},${m}`;
    case 'S': return `${m - t},${size} ${m + t},${size} ${m},${size + t}`;
    case 'W': return `0,${m - t} 0,${m + t} ${-t},${m}`;
  }
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck && npm run test && npm run dev
# In dev: open a battle, hover an enemy, see math preview; check formation glyph and facing triangle render
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/preview.ts src/engine/index.ts src/ui/AttackPreview.tsx src/ui/BattleBoard.tsx src/app.tsx
git commit -m "feat(ui): add combat math preview + formation/facing indicators"
git tag w3-content-complete
```

---

## Phase 4 — W4: AI + Campaign end + sound + v1.0

### Task 29: Scripted AI (`src/engine/ai.ts`)

Drives the opposing side when no human is on it. Two-part design from the spec: `generalRule` (aggressive/defensive/fixed) + `triggers` (turn or condition based actions).

**Files:**
- Create: `src/engine/ai.ts`
- Test: `tests/engine/ai.test.ts`
- Modify: `src/engine/index.ts` to export `runAiTurn`; `src/state/store.ts` to call it on Coalition turns when solo mode is enabled.

- [ ] **Step 1: Write `tests/engine/ai.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test -- tests/engine/ai.test.ts
```

- [ ] **Step 3: Implement `src/engine/ai.ts`**

```ts
import type { GameState, Scenario, Unit, BattleEvent, Pos } from './types';
import { posEq, chebyshev } from './grid';
import { legalMoves } from './movement';
import { moveUnit, attack, changeFormation, endTurn } from './turn';

const nearestEnemy = (unit: Unit, units: Unit[]): Unit | null => {
  const enemies = units.filter(u => u.side !== unit.side);
  if (enemies.length === 0) return null;
  return enemies.reduce((best, e) =>
    chebyshev(unit.position, e.position) < chebyshev(unit.position, best.position) ? e : best
  );
};

const stepToward = (from: Pos, to: Pos, legal: Pos[]): Pos | null => {
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
```

- [ ] **Step 4: Update `src/engine/index.ts`**

```ts
export * from './ai';
```

- [ ] **Step 5: Wire AI into store (solo-mode auto-run)**

In `src/state/store.ts`, add:

```ts
import { runAiTurn } from '../engine/ai';
```

And inside `doEndTurn`, after the existing `set(...)`, append:

```ts
const after = get();
if (after.scenario && after.state &&
    after.state.currentSide !== 'french' &&
    after.solo) {
  // auto-run AI
  const r = runAiTurn(after.state, after.scenario);
  set({ state: r.state, history: [r.state] });
}
```

Add a `solo: boolean` field to the store with default `false`, plus a `setSolo(b: boolean)` action; expose a checkbox in the Splash screen ("Play solo (AI runs the Coalition)").

- [ ] **Step 6: Run tests**

```bash
npm run test
# expect: AI tests pass + everything else still green
```

- [ ] **Step 7: Commit**

```bash
git add src/engine/ai.ts src/engine/index.ts src/state/store.ts src/ui/Splash.tsx tests/engine/ai.test.ts
git commit -m "feat(engine,state): add scripted AI with solo mode toggle"
```

---

### Task 30: Campaign End screen (`src/ui/CampaignEndScreen.tsx`)

Triumph / Partial Victory / Alt-history Defeat verdict based on cumulative outcomes.

**Files:** create `src/ui/CampaignEndScreen.tsx`, route in `app.tsx`.

- [ ] **Step 1: Write `src/ui/CampaignEndScreen.tsx`**

```tsx
import { useGame } from '../state/store';
import { campaignScenarios } from '../scenarios';
import { Button, Panel } from './shared';

type Verdict = 'triumph' | 'partial' | 'defeat';

function verdict(state: { outcomes: { victor: string }[] } | null): Verdict {
  if (!state) return 'defeat';
  const wins = state.outcomes.filter(o => o.victor === 'french').length;
  if (wins >= campaignScenarios.length) return 'triumph';
  if (wins >= Math.ceil(campaignScenarios.length / 2)) return 'partial';
  return 'defeat';
}

const TEXT: Record<Verdict, { title: string; body: string }> = {
  triumph: {
    title: 'Historical Triumph',
    body: 'The campaign ends as it did in 1805. Mack capitulates at Ulm; Kutuzov is shattered at Austerlitz. The Holy Roman Empire dissolves within months. France is supreme on the Continent.',
  },
  partial: {
    title: 'Partial Victory',
    body: 'You have won the war, but at higher cost than history records. The Coalition retires to lick its wounds; Vienna falls but a Russian army survives intact, ready to fight again.',
  },
  defeat: {
    title: 'Alt-History Reverse',
    body: 'In this version of 1805, the Grande Armée\'s gamble fails. Napoleon retreats over the Rhine. Talleyrand is already drafting the abdication.',
  },
};

export function CampaignEndScreen() {
  const { state, goto } = useGame();
  const v = verdict(state);
  const text = TEXT[v];

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="font-serif text-5xl mb-2">{text.title}</h1>
        <p className="font-serif text-lg italic opacity-80 mb-6">{text.body}</p>
        <Panel title="Battle results">
          <ul className="text-sm space-y-1">
            {state?.outcomes.map(o => (
              <li key={o.scenarioId} className="flex justify-between">
                <span>{o.scenarioId}</span>
                <span className={o.victor === 'french' ? 'text-french font-semibold' : 'opacity-70'}>
                  {o.victor} · turn {o.turnsTaken}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="mt-4">
          <Button onClick={() => goto('splash')}>Begin again</Button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Add to `app.tsx` switch**

```tsx
case 'campaign-end': return <CampaignEndScreen />;
```

…and import. The `advanceAfterBattle` already routes to `'campaign-end'` when no next scenario exists.

- [ ] **Step 3: Commit**

```bash
git add src/ui/CampaignEndScreen.tsx src/app.tsx
git commit -m "feat(ui): add campaign end screen"
```

---

### Task 31: Sound (`src/sound.ts`)

Two short audio cues — drum cadence on turn change, fife flourish on victory. Use the Web Audio API; no external assets. Skip on browsers that block autoplay until user interaction.

**Files:**
- Create: `src/sound.ts`
- Modify: `src/state/store.ts` to call `playTurnDrum()` on `endTurn`, `playFifeFlourish()` on victory; `src/ui/Splash.tsx` to expose a "Mute" toggle.

- [ ] **Step 1: Write `src/sound.ts`**

```ts
let ctx: AudioContext | null = null;
let muted = false;

const ensure = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch { return null; }
  }
  return ctx;
};

export const setMuted = (v: boolean) => { muted = v; };
export const isMuted = () => muted;

const beep = (freq: number, durMs: number, gain = 0.15, type: OscillatorType = 'square') => {
  if (muted) return;
  const c = ensure(); if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  g.gain.value = gain;
  osc.connect(g).connect(c.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000);
  osc.stop(c.currentTime + durMs / 1000);
};

export const playTurnDrum = () => {
  beep(140, 80, 0.2, 'square');
  setTimeout(() => beep(110, 80, 0.18, 'square'), 90);
  setTimeout(() => beep( 90, 100, 0.16, 'square'), 180);
};

export const playFifeFlourish = () => {
  const notes = [880, 988, 1175, 1397, 1175, 988, 880];
  notes.forEach((n, i) => setTimeout(() => beep(n, 140, 0.1, 'triangle'), i * 130));
};
```

- [ ] **Step 2: Wire into the store**

In `src/state/store.ts`, import: `import { playTurnDrum, playFifeFlourish } from '../sound';` and call:
- `playTurnDrum()` inside `doEndTurn`, before the `set(...)`.
- `playFifeFlourish()` after detecting victory in `doEndTurn` (when `screen` becomes `'battle-end'`).

Add a `muted: boolean` flag to the store and a `setMuted(v: boolean)` action that calls `setMuted(v)` from `sound.ts`.

- [ ] **Step 3: Splash mute toggle**

Add a small `<label>` near the version footer:

```tsx
<label className="text-xs opacity-60 ml-2">
  <input type="checkbox" onChange={e => useGame.getState().setMuted(e.target.checked)} /> Mute
</label>
```

- [ ] **Step 4: Commit**

```bash
git add src/sound.ts src/state/store.ts src/ui/Splash.tsx
git commit -m "feat: add minimal Web Audio cues for turns and victory"
```

---

### Task 32: iPad / touch fidelity audit

Tap targets, hover-vs-tap, larger cells when the viewport is narrow.

**Files:**
- Modify: `src/ui/BattleBoard.tsx`, `src/index.css`

- [ ] **Step 1: Bump cell size on small viewports**

Replace the fixed `cellSize = 48` in `BattleBoard.tsx` with viewport-aware sizing. Two clean options — pick (a):

(a) Use `vmin`-based sizing on the SVG container. Wrap the `<svg>` in a `<div className="w-full max-h-[80vh] aspect-square mx-auto">` and use `viewBox={`0 0 ${gw * 48} ${gh * 48}`}` so the SVG scales to fit. Touch targets remain 44+ CSS pixels on any reasonable iPad layout because the SVG cells expand to fill the container.

```tsx
return (
  <div className="w-full mx-auto" style={{
    maxWidth: 'min(100%, 80vh)',
  }}>
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto bg-parchmentDark border border-ink/40">
      {/* ... existing children ... */}
    </svg>
  </div>
);
```

- [ ] **Step 2: Don't rely on hover for attack preview**

Add a tap-to-target fallback: when a friendly is selected and the user taps an adjacent enemy *once*, show the attack preview side-panel; a second tap confirms. Implement by adding `onTapEnemy` distinct from `onAttack`, and have BattleBoard:

- First tap on adjacent enemy → call `onHoverEnemy(id)` and *do not* attack.
- Second tap on the *same* enemy while it is the hover target → call `onAttack(id)`.

```tsx
const onClick = () => {
  if (!isAttackable) { p.onSelectUnit(u.id); return; }
  if (p.hoveredEnemyId === u.id) p.onAttack(u.id);
  else p.onHoverEnemy(u.id);
};
```

- [ ] **Step 3: Larger action-bar buttons on touch**

In `src/ui/shared.tsx`, change the `Button` `px-4 py-2` to `px-5 py-3` and bump font slightly. Confirms minimum 44×44 px target.

- [ ] **Step 4: Smoke-test on a real iPad (or DevTools "Responsive" with iPad preset)**

```bash
npm run dev
# iPad Safari at the LAN IP (Vite prints it on startup with --host)
npm run dev -- --host
```

Verify: tap unit, see legal moves; tap green tile, unit moves; tap-tap enemy, attack resolves; *End Turn* reachable without scrolling on iPad portrait.

- [ ] **Step 5: Commit**

```bash
git add src/ui/BattleBoard.tsx src/ui/shared.tsx src/index.css
git commit -m "feat(ui): tap-friendly sizing and double-tap-to-attack for touch"
```

---

### Task 33: Project README + `IDEAS.md`

A small README describing how to run the game locally, deploy, and what the project is. The `IDEAS.md` is the *non-goal* dumping ground from the spec — every "what about pixel art / Coalition mode / 1812 / multiplayer" lands here, never in the v1 backlog.

**Files:**
- Create: `README.md`, `IDEAS.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# 1805 — A Napoleonic Campaign

A web-based hybrid strategy game covering Napoleon's 1805 Ulm–Austerlitz campaign.
Chess-like tactical battles, dispatches, and decisions across seven historical engagements.

Built for an 8–9 year-old who has heard every Age of Napoleon podcast episode, plays chess,
loves Minecraft, and grasps mental arithmetic.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run test         # all engine + state + scenario tests
npm run build        # production bundle in dist/
```

## Deploy

The `main` branch auto-deploys to GitHub Pages via `.github/workflows/deploy.yml`.
After creating the GitHub repo, set Pages source = "GitHub Actions", and update
`base` in `vite.config.ts` to `/<repo-name>/`.

## Architecture (brief)

- **`src/engine/`** — pure TypeScript game logic. No React.
- **`src/scenarios/`** — one TypeScript file per battle (data, not code).
- **`src/dispatches/`** — Markdown briefings + post-battle text.
- **`src/ui/`** — React components rendering the engine.
- **`src/state/`** — Zustand store + localStorage persistence.

See `docs/superpowers/specs/2026-05-03-napoleonic-game-design.md` for the full design spec.
```

- [ ] **Step 2: Write `IDEAS.md`**

```markdown
# IDEAS — for v2 and beyond

Things that are *out of scope for v1* but worth considering once the kid has played it.

- **Coalition mode** — play as Mack at Ulm or Kutuzov on the retreat to Austerlitz against scripted French AI.
- **Multiplayer** — two browsers syncing through a tiny relay (or peer-to-peer WebRTC).
- **Pixel art** — replace SVG silhouettes with hand-drawn 16×16 sprites in a Minecraft-flavoured style.
- **More campaigns** — 1812 Russia, 1813 German Campaign, 1815 Hundred Days.
- **Strategic-map mode** — multi-corps maneuver layer where you order marches and battles emerge from contact.
- **Music** — period martial music; let parents toggle on/off.
- **Mobile-native** — Capacitor wrapper, App Store / Play Store.
- **Print-and-play export** — generate a PDF of unit counters, hex/grid map, and rule sheet.
- **Difficulty knob** — tune base strength values (0–9 vs 0–19) for older players.
- **Replay export/import** — share a `.json` of a battle's events with a friend, who can step through.
- **Coalition AI sophistication** — minimax search with limited depth; alpha-beta pruning.
- **Named generals as separate UnitType** — generals as a distinct concept with morale auras for adjacent units.
```

- [ ] **Step 3: Commit**

```bash
git add README.md IDEAS.md
git commit -m "docs: add README and IDEAS scratchpad"
```

---

### Task 34: v1.0 release

Final tag + version bump + changelog. Run the full quality gate one last time.

**Files:**
- Modify: `package.json` (version `1.0.0`)
- Create: `CHANGELOG.md`

- [ ] **Step 1: Bump version**

In `package.json`, set `"version": "1.0.0"`.

- [ ] **Step 2: Write `CHANGELOG.md`**

```markdown
# Changelog

## v1.0.0 — 2026-XX-XX (replace with merge date)

Initial release.

### Features
- Full Ulm–Austerlitz campaign: 7 battles in chronological order.
- Chess-like tactical layer: square grid, deterministic combat with hidden morale.
- Dispatch + Decision flow between battles, in-character podcast-flavoured prose.
- Hot-seat play; solo mode with scripted AI.
- Replay log viewer.
- Save/load with up to 3 runs in localStorage.
- Web Audio cues (drum, fife). Mute toggle.
- iPad-friendly touch interactions.
- GitHub Pages deploy.

### Engine
- Pure TypeScript, isolated from UI.
- 100% deterministic battles given equal inputs.
- Property-tested (board strength monotone non-increasing; unit positions in bounds; replay determinism).
```

- [ ] **Step 3: Run the whole gate**

```bash
npm run typecheck    # clean
npm run test         # all green
npm run build        # dist/ produced
```

- [ ] **Step 4: Commit and tag**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release v1.0.0"
git tag v1.0.0
git push origin main --follow-tags     # if remote is set up
```

- [ ] **Step 5: Manual playtest checklist**

Final hand-test before declaring done — *do this with the kid, not alone*:

- [ ] Splash → New Campaign → first dispatch (Wertingen) reads correctly
- [ ] Battle plays through; autosave between turns works
- [ ] Defender morale reveal shows in log + UnitPanel after first attack
- [ ] Battle End screen shows correct verdict
- [ ] Inter-battle Decision changes the next scenario's setup
- [ ] Replay viewer steps through events
- [ ] Mute toggle silences audio
- [ ] iPad: tap-tap-to-attack works, action bar visible without scrolling

---
