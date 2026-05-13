# Peninsular Campaign Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vimeiro, Busaco, and Salamanca to the Peninsular War campaign, with coalition-side player control for those strategy lessons.

**Architecture:** Add an optional `Scenario.playerSide` field and central helpers so existing French-player scenarios remain unchanged while selected Peninsular battles can make the British-led coalition the human side. Then add three scenario modules plus dispatch content and register them in the Peninsular campaign order.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Vite.

---

## File Structure

- Modify `src/engine/types.ts`: add optional `playerSide?: Side` to `Scenario`.
- Modify `src/engine/sides.ts`: add helpers for player team and opponent team checks.
- Modify `src/engine/turn.ts`: initialize battles with `scenario.playerSide ?? 'french'`.
- Modify `src/state/store.ts`: run AI when the current side is not the configured player team.
- Modify `src/app.tsx`: filter objective chips and side labels from scenario player-side helpers.
- Modify `src/ui/UnitPanel.tsx`: use selected unit display independent of hardcoded French ownership if present.
- Create `src/scenarios/11-vimeiro.ts`: Vimeiro scenario.
- Create `src/scenarios/12-busaco.ts`: Busaco scenario.
- Create `src/scenarios/13-salamanca.ts`: Salamanca scenario.
- Modify `src/scenarios/index.ts`: import/register the new scenarios after Talavera.
- Create six dispatch files in `src/dispatches`: briefing and post-battle files for the three battles.
- Modify or add tests under `tests/engine`, `tests/state`, `tests/ui`, and `tests/scenarios`.

---

### Task 1: Add Player-Side Model

**Files:**
- Modify: `src/engine/types.ts`
- Modify: `src/engine/sides.ts`
- Modify: `src/engine/turn.ts`
- Test: `tests/engine/turn.test.ts`

- [ ] **Step 1: Write failing tests for player-side defaults and coalition start**

Add these tests to `tests/engine/turn.test.ts`:

```ts
import type { Scenario } from '../../src/engine/types';
import { beginBattle } from '../../src/engine/turn';

const basePlayerSideScenario = (overrides: Partial<Scenario> = {}): Scenario => ({
  id: 'player-side-test',
  title: 'Player Side Test',
  briefingMd: 'test',
  grid: { width: 4, height: 4 },
  tiles: [],
  units: [
    {
      id: 'fr-line',
      side: 'french',
      type: 'line-infantry',
      position: { x: 0, y: 1 },
      facing: 'E',
      formation: 'line',
      strength: 4,
      morale: 2,
    },
    {
      id: 'br-line',
      side: 'british',
      type: 'line-infantry',
      position: { x: 3, y: 1 },
      facing: 'W',
      formation: 'line',
      strength: 4,
      morale: 2,
    },
  ],
  victory: [
    { for: 'french', kind: 'survive-turns', args: { turns: 3 } },
    { for: 'british', kind: 'survive-turns', args: { turns: 3 } },
  ],
  ai: { generalRule: 'defensive', triggers: [] },
  ...overrides,
});

it('defaults new battles to French player side', () => {
  const state = beginBattle(basePlayerSideScenario());
  expect(state.currentSide).toBe('french');
});

it('starts on coalition side when scenario playerSide is British', () => {
  const state = beginBattle(basePlayerSideScenario({ playerSide: 'british' }));
  expect(state.currentSide).toBe('british');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/engine/turn.test.ts`

Expected: FAIL because `Scenario` has no `playerSide` field and `beginBattle` always starts as `french`.

- [ ] **Step 3: Implement player-side field and helpers**

In `src/engine/types.ts`, add this property to `Scenario` near `campaignId`:

```ts
  playerSide?: Side;             // defaults to french; coalition sides act as one player team
```

In `src/engine/sides.ts`, add:

```ts
export const playerSideForScenario = (playerSide?: Side): Side => playerSide ?? 'french';

export const isOnPlayerTeam = (side: Side, playerSide?: Side): boolean =>
  isOnActiveSide(side, playerSideForScenario(playerSide));

export const isPlayerTurn = (currentSide: Side, playerSide?: Side): boolean =>
  isOnActiveSide(currentSide, playerSideForScenario(playerSide));
```

In `src/engine/turn.ts`, change the `beginBattle` return value:

```ts
    currentSide: s.playerSide ?? 'french',
```

and change the initial log entry:

```ts
    log: [{ kind: 'turn-started', turn: 1, side: s.playerSide ?? 'french' }],
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/engine/turn.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/sides.ts src/engine/turn.ts tests/engine/turn.test.ts
git commit -m "feat(game): add scenario player side"
```

---

### Task 2: Make UI And Store Respect Player Side

**Files:**
- Modify: `src/app.tsx`
- Modify: `src/state/store.ts`
- Modify: `src/ui/UnitPanel.tsx`
- Test: `tests/ui/player-side.test.tsx`
- Test: `tests/state/save.test.ts`

- [ ] **Step 1: Write failing tests for player-side objective filtering and AI trigger**

Create `tests/ui/player-side.test.tsx`:

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import App from '../../src/app';
import { beginBattle } from '../../src/engine';
import type { Scenario } from '../../src/engine/types';
import { useGame } from '../../src/state/store';

const playerSideScenario: Scenario = {
  id: 'player-side-ui',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Player Side UI',
  briefingMd: 'test',
  grid: { width: 4, height: 4 },
  tiles: [],
  units: [
    {
      id: 'fr-line',
      side: 'french',
      type: 'line-infantry',
      position: { x: 0, y: 1 },
      facing: 'E',
      formation: 'line',
      strength: 4,
      morale: 2,
    },
    {
      id: 'br-line',
      side: 'british',
      type: 'line-infantry',
      position: { x: 3, y: 1 },
      facing: 'W',
      formation: 'line',
      strength: 4,
      morale: 2,
    },
  ],
  victory: [
    { for: 'british', kind: 'survive-turns', label: 'Hold the ridge', args: { turns: 3 } },
    { for: 'french', kind: 'capture-tile', label: 'French capture ridge', args: { pos: { x: 3, y: 1 } } },
  ],
  ai: { generalRule: 'defensive', triggers: [] },
};

describe('player-side UI', () => {
  beforeEach(() => {
    const state = beginBattle(playerSideScenario);
    useGame.setState({
      runId: 'test-run',
      state,
      scenario: playerSideScenario,
      history: [state],
      screen: 'battle',
      selectedUnitId: null,
      hoveredEnemyId: null,
      helpOpen: false,
      solo: false,
      muted: true,
      showDetails: true,
      aiDifficulty: 'normal',
      errorMessage: null,
      isAnimating: false,
      animatingHighlightIds: [],
      animatingMessage: null,
    });
  });

  it('shows objectives for the configured player side', () => {
    render(<App />);

    expect(screen.getByText(/Hold the ridge/i)).toBeInTheDocument();
    expect(screen.queryByText(/French capture ridge/i)).not.toBeInTheDocument();
  });
});
```

In `tests/state/save.test.ts`, add a migration compatibility assertion:

```ts
it('loads older states without scenario playerSide data', () => {
  const state = sampleState();
  expect(state.currentSide).toBe('french');
  expect(isValidGameState(state)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify the UI test fails**

Run: `npm test -- tests/ui/player-side.test.tsx tests/state/save.test.ts`

Expected: FAIL for objective filtering because `src/app.tsx` filters objectives with `o.for === 'french'`.

- [ ] **Step 3: Update UI/store player-side usage**

In `src/app.tsx`, import:

```ts
import { isOnActiveSide, sameTeam, playerSideForScenario, isOnPlayerTeam } from './engine/sides';
```

Add after `if (!state || !scenario) return <Splash />;`:

```ts
  const playerSide = playerSideForScenario(scenario.playerSide);
```

Update objective filtering:

```ts
  const objectives = summarizeVictory(state, scenario.victory)
    .filter(o => isOnPlayerTeam(o.for, playerSide));
```

Update the side label logic to prefer player/opponent framing:

```ts
  const sideLabel = isOnActiveSide(state.currentSide, playerSide)
    ? state.currentSide
    : (state.currentSide === 'french' ? 'french' : 'coalition');
```

In `src/state/store.ts`, import:

```ts
import { isPlayerTurn } from '../engine/sides';
```

Change the solo-AI check from:

```ts
        after.state.currentSide !== 'french' &&
```

to:

```ts
        !isPlayerTurn(after.state.currentSide, after.scenario.playerSide) &&
```

Update animation fallback captions so they do not always say coalition:

```ts
      const aiSideLabel = after.state.currentSide === 'french' ? 'French' : 'Coalition';
      const stoodFirmMsg = `${aiSideLabel} stood firm — no movement this turn.`;
      const initialMsg = aiActed ? `${aiSideLabel} is moving…` : stoodFirmMsg;
```

In the animation `tick`, change fallback message:

```ts
          animatingMessage: caption ?? (aiActed ? `${aiSideLabel} is moving…` : stoodFirmMsg),
```

In `src/app.tsx`, pass the player side into the unit panel:

```tsx
        <UnitPanel unit={selected} playerSide={playerSide} />
```

In `src/ui/UnitPanel.tsx`, import `Side` and `isOnPlayerTeam`:

```ts
import type { Unit, Morale, Side } from '../engine/types';
import { isOnPlayerTeam } from '../engine/sides';
```

Change ownership and morale helpers:

```ts
const isOwnSide = (unit: Unit, playerSide: Side): boolean => isOnPlayerTeam(unit.side, playerSide);

const moraleDisplay = (unit: Unit, playerSide: Side): string => {
  const reveal = unit.moraleRevealed || isOwnSide(unit, playerSide);
  return reveal
    ? `${'★'.repeat(unit.morale)} ${MORALE_LABEL[unit.morale]}`
    : '? (revealed when first attacked)';
};
```

Change the component signature:

```ts
export function UnitPanel({ unit, playerSide = 'french' }: { unit: Unit | null; playerSide?: Side }) {
```

Update the morale row:

```tsx
        <Row label="Morale" value={moraleDisplay(unit, playerSide)} />
```

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/ui/player-side.test.tsx tests/state/save.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app.tsx src/state/store.ts src/ui/UnitPanel.tsx tests/ui/player-side.test.tsx tests/state/save.test.ts
git commit -m "fix(ui): respect scenario player side"
```

---

### Task 3: Add Vimeiro Scenario And Dispatches

**Files:**
- Create: `src/scenarios/11-vimeiro.ts`
- Create: `src/dispatches/11-vimeiro-briefing.md`
- Create: `src/dispatches/11-vimeiro-postbattle.md`
- Modify: `src/scenarios/index.ts`
- Test: `tests/scenarios/validate.test.ts`

- [ ] **Step 1: Create Vimeiro scenario**

Create `src/scenarios/11-vimeiro.ts`:

```ts
import type { Scenario, Unit } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E', formation: 'column',
  strength: 4, morale,
});

const br = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `br-${id}`, name, side: 'british', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

const pt = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `pt-${id}`, name, side: 'portuguese', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

export const vimeiro: Scenario = {
  id: 'vimeiro',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Vimeiro — 21 August 1808',
  briefingMd: '11-vimeiro-briefing',
  grid: { width: 10, height: 8 },
  tiles: [
    { pos: { x: 6, y: 2 }, terrain: 'hill' },
    { pos: { x: 7, y: 2 }, terrain: 'hill' },
    { pos: { x: 6, y: 3 }, terrain: 'hill' },
    { pos: { x: 7, y: 3 }, terrain: 'hill' },
    { pos: { x: 7, y: 4 }, terrain: 'town' },
    { pos: { x: 8, y: 4 }, terrain: 'town' },
    { pos: { x: 3, y: 4 }, terrain: 'road' },
    { pos: { x: 4, y: 4 }, terrain: 'road' },
    { pos: { x: 5, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
  ],
  units: [
    fr('junot', 'Junot', 'line-infantry', 2, 3, 2),
    fr('laborde', 'Laborde Column', 'line-infantry', 2, 2, 2),
    fr('loison', 'Loison Column', 'line-infantry', 2, 5, 2),
    fr('dragoons', 'French Dragoons', 'heavy-cavalry', 1, 4, 2),
    fr('guns', 'French Battery', 'foot-artillery', 3, 4, 2),
    br('wellesley', 'Wellesley', 'line-infantry', 7, 3, 3),
    br('ferguson', 'Ferguson', 'line-infantry', 7, 2, 2),
    br('hill', 'Hill', 'line-infantry', 8, 4, 2),
    br('guns', 'British Guns', 'foot-artillery', 8, 3, 2),
    pt('line', 'Portuguese Line', 'line-infantry', 6, 5, 2),
  ],
  victory: [
    {
      for: 'british',
      kind: 'all-of',
      label: 'Hold Vimeiro ridge',
      args: {
        conditions: [
          { for: 'british', kind: 'hold-tile-for-turns', args: { pos: { x: 7, y: 3 }, turns: 7 } },
          { for: 'british', kind: 'reduce-side-strength', args: { side: 'french', threshold: 10 } },
        ],
      },
    },
    { for: 'french', kind: 'capture-tile', label: 'Take the ridge', args: { pos: { x: 7, y: 3 } } },
  ],
  turnLimit: 8,
  ai: { generalRule: 'aggressive', triggers: [] },
  postBattleDispatch: '11-vimeiro-postbattle',
  tacticalHint:
    'Line against column. Keep infantry on the ridge, let French columns spend themselves uphill, then counterattack only when their cohesion drops.',
  lesson: {
    principle: 'A steady defensive line can turn an attacking column into a target.',
    before:
      'Vimeiro teaches the value of disciplined fire and position. The French must come forward; the Anglo-Portuguese line wins by making that advance expensive.',
    during:
      'Hold the ridge and town with mutually supporting units. Use artillery to soften columns before committing infantry attacks.',
    after:
      'The strategic lesson is restraint. A commander who already has the strong ground does not need to chase glory; the enemy attack can be defeated by forcing it through the wrong terrain.',
  },
};
```

- [ ] **Step 2: Add Vimeiro dispatch files**

Create `src/dispatches/11-vimeiro-briefing.md`:

```md
# Vimeiro

Junot advances to drive the British back into the sea. Wellesley's army holds the high ground around Vimeiro, with Portuguese troops extending the line.

The French columns are brave and dangerous, but they must climb into prepared fire. Your task is to keep the line steady, protect the guns, and counterattack only when the French attack has lost cohesion.
```

Create `src/dispatches/11-vimeiro-postbattle.md`:

```md
# After Vimeiro

Vimeiro shows that French tactical energy is not enough when the defender has good ground and discipline. The battle is won by making the enemy's preferred method fail on your terms.

The larger Peninsular lesson is patience. The Anglo-Portuguese army does not need to win Spain in one charge; it needs to survive, punish mistakes, and keep improving its position.
```

- [ ] **Step 3: Register Vimeiro**

In `src/scenarios/index.ts`, import `vimeiro` and append it after `talavera` in `peninsularWarScenarios`.

- [ ] **Step 4: Run validation tests**

Run: `npm test -- tests/scenarios/validate.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenarios/11-vimeiro.ts src/dispatches/11-vimeiro-briefing.md src/dispatches/11-vimeiro-postbattle.md src/scenarios/index.ts
git commit -m "feat(game): add Vimeiro scenario"
```

---

### Task 4: Add Busaco Scenario And Dispatches

**Files:**
- Create: `src/scenarios/12-busaco.ts`
- Create: `src/dispatches/12-busaco-briefing.md`
- Create: `src/dispatches/12-busaco-postbattle.md`
- Modify: `src/scenarios/index.ts`
- Test: `tests/scenarios/validate.test.ts`

- [ ] **Step 1: Create Busaco scenario**

Create `src/scenarios/12-busaco.ts`:

```ts
import type { Scenario, Unit } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E', formation: 'column',
  strength: 4, morale,
});

const br = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `br-${id}`, name, side: 'british', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

const pt = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `pt-${id}`, name, side: 'portuguese', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

export const busaco: Scenario = {
  id: 'busaco',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Busaco — 27 September 1810',
  briefingMd: '12-busaco-briefing',
  grid: { width: 11, height: 9 },
  tiles: [
    ...Array.from({ length: 7 }, (_, y) => ({ pos: { x: 7, y: y + 1 } as const, terrain: 'hill' as const })),
    ...Array.from({ length: 5 }, (_, y) => ({ pos: { x: 8, y: y + 2 } as const, terrain: 'hill' as const })),
    { pos: { x: 6, y: 2 }, terrain: 'forest' },
    { pos: { x: 6, y: 6 }, terrain: 'forest' },
    { pos: { x: 4, y: 4 }, terrain: 'road' },
    { pos: { x: 5, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
    { pos: { x: 7, y: 4 }, terrain: 'road' },
    { pos: { x: 8, y: 4 }, terrain: 'road' },
  ],
  units: [
    fr('reynier', 'Reynier', 'line-infantry', 2, 3, 2),
    fr('ney', 'Ney', 'line-infantry', 2, 5, 2),
    fr('merle', 'Merle Column', 'line-infantry', 3, 2, 2),
    fr('loison', 'Loison Column', 'line-infantry', 3, 6, 2),
    fr('guns', 'French Battery', 'foot-artillery', 3, 4, 2),
    br('picton', 'Picton', 'line-infantry', 7, 3, 3),
    br('craufurd', 'Light Division', 'light-infantry', 8, 2, 3),
    br('hill', 'Hill', 'line-infantry', 7, 5, 2),
    pt('pack', 'Pack Portuguese', 'line-infantry', 8, 6, 2),
    br('guns', 'Ridge Battery', 'foot-artillery', 8, 4, 2),
  ],
  victory: [
    {
      for: 'british',
      kind: 'all-of',
      label: 'Hold the Busaco ridge',
      args: {
        conditions: [
          { for: 'british', kind: 'hold-tile-for-turns', args: { pos: { x: 7, y: 4 }, turns: 8 } },
          { for: 'british', kind: 'reduce-side-strength', args: { side: 'french', threshold: 9 } },
        ],
      },
    },
    { for: 'french', kind: 'capture-tile', label: 'Force the ridge road', args: { pos: { x: 8, y: 4 } } },
  ],
  turnLimit: 9,
  ai: { generalRule: 'aggressive', triggers: [] },
  postBattleDispatch: '12-busaco-postbattle',
  tacticalHint:
    'Defense in depth. Hold the ridge long enough to punish the assault, but do not scatter your line chasing broken columns.',
  lesson: {
    principle: 'A tactical victory can serve a larger operational withdrawal.',
    before:
      'Busaco is not about annihilating Massena. It is about making the French pay for the ridge before the army withdraws behind the Lines of Torres Vedras.',
    during:
      'Keep the ridge units mutually supporting. Let French columns climb into artillery and infantry fire, then use command-supported attacks to finish weakened units.',
    after:
      'The lesson is operational patience. A battle can be won because it preserves the army and buys time, not because it ends the war in one afternoon.',
  },
};
```

- [ ] **Step 2: Add Busaco dispatch files**

Create `src/dispatches/12-busaco-briefing.md`:

```md
# Busaco

Massena's army presses into Portugal. Wellington has chosen the ridge at Busaco as a place to make the French attack upward, under fire, before the allied army falls back toward prepared defenses.

Hold the crest. Do not let the French road column split your line. Your goal is not a reckless pursuit; it is to preserve the army while making the French advance weaker with every step.
```

Create `src/dispatches/12-busaco-postbattle.md`:

```md
# After Busaco

Busaco proves that a battle can serve an operational design. The ridge is valuable because it costs the French time, strength, and confidence before they reach the deeper defensive system.

The larger lesson is that withdrawal is not always failure. A disciplined army can fight, hurt the enemy, and still preserve itself for the campaign that follows.
```

- [ ] **Step 3: Register Busaco**

In `src/scenarios/index.ts`, import `busaco` and append it after `vimeiro`.

- [ ] **Step 4: Run validation tests**

Run: `npm test -- tests/scenarios/validate.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenarios/12-busaco.ts src/dispatches/12-busaco-briefing.md src/dispatches/12-busaco-postbattle.md src/scenarios/index.ts
git commit -m "feat(game): add Busaco scenario"
```

---

### Task 5: Add Salamanca Scenario And Dispatches

**Files:**
- Create: `src/scenarios/13-salamanca.ts`
- Create: `src/dispatches/13-salamanca-briefing.md`
- Create: `src/dispatches/13-salamanca-postbattle.md`
- Modify: `src/scenarios/index.ts`
- Test: `tests/scenarios/validate.test.ts`

- [ ] **Step 1: Create Salamanca scenario**

Create `src/scenarios/13-salamanca.ts`:

```ts
import type { Scenario, Unit } from '../engine/types';

const fr = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `fr-${id}`, name, side: 'french', type,
  position: { x, y }, facing: 'E', formation: 'line',
  strength: 4, morale,
});

const br = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `br-${id}`, name, side: 'british', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

const pt = (
  id: string, name: string, type: Unit['type'],
  x: number, y: number, morale: Unit['morale'] = 2,
): Unit => ({
  id: `pt-${id}`, name, side: 'portuguese', type,
  position: { x, y }, facing: 'W', formation: 'line',
  strength: 4, morale,
});

export const salamanca: Scenario = {
  id: 'salamanca',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Salamanca — 22 July 1812',
  briefingMd: '13-salamanca-briefing',
  grid: { width: 11, height: 9 },
  tiles: [
    { pos: { x: 4, y: 2 }, terrain: 'hill' },
    { pos: { x: 5, y: 2 }, terrain: 'hill' },
    { pos: { x: 6, y: 3 }, terrain: 'hill' },
    { pos: { x: 8, y: 5 }, terrain: 'hill' },
    { pos: { x: 8, y: 6 }, terrain: 'hill' },
    { pos: { x: 5, y: 4 }, terrain: 'road' },
    { pos: { x: 6, y: 4 }, terrain: 'road' },
    { pos: { x: 7, y: 4 }, terrain: 'road' },
    { pos: { x: 8, y: 4 }, terrain: 'road' },
    { pos: { x: 9, y: 4 }, terrain: 'road' },
  ],
  units: [
    fr('marmont', 'Marmont Center', 'line-infantry', 6, 4, 2),
    fr('thomieres', 'Thomieres', 'line-infantry', 8, 5, 2),
    fr('maucune', 'Maucune', 'line-infantry', 8, 3, 2),
    fr('cavalry', 'French Cavalry', 'light-cavalry', 9, 5, 2),
    fr('guns', 'French Guns', 'foot-artillery', 7, 4, 2),
    br('wellington', 'Wellington', 'line-infantry', 3, 4, 3),
    br('pakenham', 'Pakenham', 'line-infantry', 4, 5, 3),
    br('leith', 'Leith', 'line-infantry', 4, 3, 2),
    pt('bradford', 'Portuguese Brigade', 'line-infantry', 3, 5, 2),
    br('cavalry', 'Le Marchant', 'heavy-cavalry', 3, 6, 3),
    br('guns', 'Allied Guns', 'foot-artillery', 4, 4, 2),
  ],
  victory: [
    {
      for: 'british',
      kind: 'all-of',
      label: 'Exploit the stretched French wing',
      args: {
        conditions: [
          { for: 'british', kind: 'eliminate-unit', args: { unitId: 'fr-thomieres' } },
          { for: 'british', kind: 'reduce-side-strength', args: { side: 'french', threshold: 10 } },
        ],
      },
    },
    { for: 'french', kind: 'survive-turns', label: 'Recover the line', args: { turns: 8 } },
  ],
  turnLimit: 8,
  ai: {
    generalRule: 'defensive',
    triggers: [
      {
        whenTurn: 4,
        do: [
          { kind: 'move', unitId: 'fr-maucune', to: { x: 7, y: 3 } },
          { kind: 'change-formation', unitId: 'fr-thomieres', to: 'square' },
        ],
      },
    ],
  },
  postBattleDispatch: '13-salamanca-postbattle',
  tacticalHint:
    'Exploit overextension. Strike the exposed French wing fast, keep support close, and prevent the enemy from reforming a continuous line.',
  lesson: {
    principle: 'When an enemy stretches too far, concentration beats frontage.',
    before:
      'At Salamanca the French line has reached too far. The opportunity will not last: hit the exposed wing before the rest of the army can recover.',
    during:
      'Concentrate infantry, cavalry, and guns against Thomieres. Do not spread attacks across the whole line; break one wing and roll it up.',
    after:
      'The lesson is exploitation. A commander does not need equal strength everywhere if the enemy has created one decisive weakness.',
  },
};
```

- [ ] **Step 2: Add Salamanca dispatch files**

Create `src/dispatches/13-salamanca-briefing.md`:

```md
# Salamanca

The French line has stretched too far. Marmont's army is no longer a compact striking force; one wing is exposed, and Wellington sees the moment.

Do not attack everywhere. Concentrate on the exposed French wing, keep your supporting units close, and break the line before it can pull itself back together.
```

Create `src/dispatches/13-salamanca-postbattle.md`:

```md
# After Salamanca

Salamanca is the reward for patience and sharp timing. The French mistake was not weakness, but extension without enough cohesion to survive a sudden blow.

The strategic lesson is concentration. When the enemy gives you a separated wing, the winning move is not a broad advance; it is a fast, supported strike at the part of the army that cannot be rescued in time.
```

- [ ] **Step 3: Register Salamanca**

In `src/scenarios/index.ts`, import `salamanca` and append it after `busaco`.

- [ ] **Step 4: Run validation tests**

Run: `npm test -- tests/scenarios/validate.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenarios/13-salamanca.ts src/dispatches/13-salamanca-briefing.md src/dispatches/13-salamanca-postbattle.md src/scenarios/index.ts
git commit -m "feat(game): add Salamanca scenario"
```

---

### Task 6: Campaign Copy, Full Verification, And Balance Smoke Test

**Files:**
- Modify: `src/scenarios/index.ts`

- [ ] **Step 1: Update Peninsular campaign subtitle/thesis**

In `src/scenarios/index.ts`, update the Peninsular campaign copy:

```ts
subtitle: 'A strategy-learning campaign about overextension, terrain, coalition defense, logistics, and exploitation.',
theme: 'Tactical victories under strategic strain',
thesis: 'France can win battles in Spain, but the war punishes isolation, bad supply, and attacks that ignore terrain, coalition discipline, and the danger of overextension.',
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run build
npm run lint
npm test
```

Expected: all commands pass.

- [ ] **Step 3: Manual local smoke test**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Open the local URL and verify:

- Peninsular campaign lists six battles.
- Vimeiro starts with British/Portuguese units controllable.
- French acts as AI in solo mode after the player ends turn.
- Objective chips show British goals on Vimeiro, Busaco, and Salamanca.
- Existing 1805 and first three Peninsular battles still start as French.

- [ ] **Step 4: Commit final polish if any**

```bash
git add src tests
git commit -m "test(game): verify peninsular campaign expansion"
```

Skip this commit if no files changed after verification.
