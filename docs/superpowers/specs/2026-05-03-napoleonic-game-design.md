# Napoleonic-Era Game — Design Spec

**Date:** 2026-05-03
**Player:** an 8–9 year-old. Strong reader, mental math; plays chess, Minecraft, Age of Empires; has heard every Age of Napoleon podcast episode and Dispatches multiple times.
**Builder:** parent (solo dev), evenings + weekends, ~1 month budget.
**Status:** Approved design, awaiting implementation plan.

---

## 1. Vision

A web-based hybrid strategy game set in Napoleon's 1805 Ulm–Austerlitz campaign. The game combines:

- The tactical clarity of **chess** — square grid, one unit per square, deterministic combat given known stats.
- The campaign feel of **Age of Empires** — a sequence of historical battles tied together by dispatches and decisions.
- The narrated immersion of the **Age of Napoleon podcast** — in-character dispatches between battles.

Designed to reward what this player is already great at: spatial reasoning, mental math, reading comprehension, historical pattern recognition.

## 2. Goals & Non-goals

### Goals (v1)

- **Hot-seat play** (kid vs. parent on one laptop) is the primary mode.
- **Solo play against scripted AI** is the fallback mode.
- **Full Ulm–Austerlitz campaign:** 7 battles, with one in-character dispatch and one tactical decision between each.
- **Deploys to GitHub Pages** via a workflow on push to `main`.
- **Battle replay log** as a first-class output: every state-mutating engine call returns its event sequence; logs serialize to JSON; a Replay Viewer steps through them.

### Non-goals (v1, deferred to a later version)

- Coalition mode (playing as Mack or Kutuzov).
- Networked multiplayer.
- Pixel-art unit sprites.
- Full Europe campaign map; other campaigns (1812, 1813, 1815).
- Music.
- Mobile-native packaging.

## 3. Game Mechanics

### 3.1 Battle layer

- **Square grid**, sized per scenario (10×10 to 14×14). One unit per square.
- **Unit families:**
  - *Infantry:* Line, Light, Grenadier
  - *Cavalry:* Light, Heavy
  - *Artillery:* Foot, Horse
- **Visible state per unit:** type, side colour (Blue=French, Cream=Austrian, Green=Russian), position, facing (N/E/S/W), formation (Line/Column/Square), strength (1–4).
- **Hidden state per unit:** morale rating 1–3 (1=Conscript, 2=Veteran, 3=Elite). Set by scenario, revealed during combat — the morale of whichever unit is *attacked* is revealed when first attacked.
- **Formation effects:**
  - **Line** — standard. Good for firing.
  - **Column** — `+1` move budget; weak in firefights and against artillery.
  - **Square** — strong vs. cavalry charges; weak in firefights.
  - Changing formation costs the unit's action for the turn.
- **Movement:** budget per turn — Infantry 2, Cavalry 4, Artillery 1. Terrain modifies cost: forest +1, hill +1, marsh +2; town blocks except via roads; rivers impassable except at bridges.
- **Combat (deterministic given stats):** `attacker_strength + terrain + flanking + formation + morale  vs.  defender same`. Result thresholds:
  - `≤ −2` → attacker breaks (loses 2 strength, retreats 1 square)
  - `−1` → attacker repulsed (loses 1 strength, stays)
  - `0 to +1` → exchange (both lose 1 strength)
  - `+2` → defender retreats 1 square
  - `≥ +3` → defender broken (loses 2 strength, retreats 2 squares)
- **Defender's hidden morale revealed at first attack against it.**
- **Victory conditions** are scenario-specific. Examples: eliminate a named unit (e.g., a general), hold a hill for N turns, capture a town, reduce total enemy strength below threshold, survive turn limit.
- **Generals are modeled as named Unit instances**, not a separate `UnitType` — `id: 'fr-napoleon'`, `name: 'Napoleon'`, with a normal type (e.g., `light-cavalry`) and elevated stats. Victory conditions reference them by `id`.

### 3.2 Campaign layer

- **One campaign:** 1805 Ulm–Austerlitz. Player commands the French / Napoleon's army.
- **7 battles** in linear historical order:

  | # | Battle | Notes |
  |---|---|---|
  | 1 | Wertingen | Small cavalry skirmish — tutorial |
  | 2 | Haslach-Jungingen | French rearguard holds |
  | 3 | Elchingen | Ney's bridge assault |
  | 4 | Surrender at Ulm | Maneuver puzzle, not a fight |
  | 5 | Krems / Dürnstein | Underdog play (Mortier's near-disaster) |
  | 6 | Schöngrabern | Bagration's rearguard against odds |
  | 7 | Austerlitz | Climactic, biggest scenario, Pratzen Heights gambit |

- **Between each battle:**
  - **Dispatch** — 1–3 paragraphs of in-character narration (Berthier to Napoleon, Napoleon to Cambacérès, Talleyrand to Vienna, etc.) in podcast-flavoured prose.
  - **Decision** — one tactical choice that mutates the next scenario (e.g., *"Force-march to Krems and arrive exhausted, or rest and let Kutuzov dig in?"*). Decision options modify the next scenario's units, terrain, or victory conditions.
- **Campaign end:** Historical Triumph / Partial Victory / Alt-history Defeat depending on cumulative outcomes; a final dispatch summarizes.

## 4. Architecture

### 4.1 Tech stack

- **TypeScript + React + Vite** (browser-only)
- **SVG** for the battle board (cleaner than Canvas for a 14×14 grid; easier to inspect in DevTools)
- **Tailwind** for styling
- **Zustand** for game state
- **Vitest** for tests
- **No backend.** `localStorage` for saves.
- **Deploy:** GitHub Pages via Actions on push to `main`. `vite.config.ts` sets `base: '/<repo-name>/'`.

### 4.2 Module layout

```
src/
  engine/        ← pure logic, no React. Heavily tested.
    types.ts          # Unit, Tile, Scenario, GameState, BattleEvent, Decision
    combat.ts         # combat resolver (the math)
    movement.ts       # legal moves, terrain costs, facing/flanking
    turn.ts           # turn/phase manager
    ai.ts             # scripted AI per scenario
    victory.ts        # victory-condition checks
  scenarios/     ← data, not code. One file per battle.
    01-wertingen.ts
    02-haslach.ts
    03-elchingen.ts
    04-ulm.ts
    05-krems.ts
    06-schongrabern.ts
    07-austerlitz.ts
    index.ts          # ordered campaign roster
  dispatches/    ← Markdown text per battle (pre/post + decisions).
  ui/            ← React components.
    Splash.tsx
    CampaignMenu.tsx
    DispatchScreen.tsx
    BattleBoard.tsx
    UnitPanel.tsx
    AttackPreview.tsx
    BattleLog.tsx
    BattleEndScreen.tsx
    CampaignEndScreen.tsx
    HelpOverlay.tsx
    ReplayViewer.tsx
  state/         ← Zustand store + save/load.
    store.ts
    save.ts
  art/           ← unit silhouettes (SVG sprite sheet).
  app.tsx, main.tsx, index.html, index.css

tests/
  engine/        ← combat, movement, turn, ai unit tests
  scenarios/     ← validation script (run at build time)
  replay/        ← golden-log determinism tests

.github/
  workflows/deploy.yml
```

**Hard rule:** the engine never imports from `ui/` or `state/`. The UI passes a `GameState` to engine functions and gets back a new `GameState` plus an `events: BattleEvent[]` array. This separation is what lets the engine be ruthlessly tested, lets the replay log fall out for free, and leaves the door open to a CLI replay tool or a paper-board export later.

### 4.3 Engine API (all pure)

```ts
startCampaign(): GameState
pendingDecision(state: GameState): Decision | null   // for the upcoming scenario, if any
applyDecision(state: GameState, optionIndex: number): GameState  // applies pendingDecision
beginBattle(state: GameState): GameState               // resolves the scenario file + any patches
moveUnit(state, unitId, to): { state: GameState; events: BattleEvent[] }
attack(state, attackerId, defenderId): { state: GameState; events: BattleEvent[] }
changeFormation(state, unitId, to: Formation): { state: GameState; events: BattleEvent[] }
endTurn(state): { state: GameState; events: BattleEvent[] }
runAiTurn(state): { state: GameState; events: BattleEvent[] }
checkVictory(state): VictoryStatus
```

### 4.4 Core data types

```ts
type Side = 'french' | 'austrian' | 'russian';

type UnitType =
  | 'line-infantry' | 'light-infantry' | 'grenadier'
  | 'light-cavalry' | 'heavy-cavalry'
  | 'foot-artillery' | 'horse-artillery';

type Formation = 'line' | 'column' | 'square';

type TerrainKind =
  | 'plain' | 'forest' | 'town' | 'hill' | 'river' | 'bridge' | 'marsh' | 'road';

interface Unit {
  id: string;            // e.g. 'fr-lannes-v-3rd-line'
  name?: string;         // optional flavour: '3e Régiment de ligne'
  side: Side;
  type: UnitType;
  position: [number, number];
  facing: 'N' | 'E' | 'S' | 'W';
  formation: Formation;
  strength: 1 | 2 | 3 | 4;     // visible
  morale: 1 | 2 | 3;            // hidden until revealed in combat
}

interface Tile { pos: [number, number]; terrain: TerrainKind; }

interface Scenario {
  id: string;                       // 'austerlitz'
  title: string;                    // 'Austerlitz — 2 December 1805'
  briefingMd: string;               // filename in src/dispatches/
  grid: { width: number; height: number };
  tiles: Tile[];                    // sparse — non-plain tiles only
  units: Unit[];
  victory: VictoryCondition[];
  turnLimit?: number;
  ai: AiScript;
  preBattleDecision?: Decision;
}

interface Decision {
  id: string;                       // unique within campaign — used in save log
  promptMd: string;
  options: DecisionOption[];
}

interface DecisionOption {
  label: string;
  patch: ScenarioPatch;             // pure data, must be JSON-safe
}

// ScenarioPatch is a declarative override applied to the next scenario
// before play begins. Pure data — no functions — so saves can replay it.
interface ScenarioPatch {
  unitsAdded?: Unit[];
  unitsRemovedByIds?: string[];
  unitOverrides?: Array<Partial<Unit> & { id: string }>;
  tilesOverridden?: Tile[];
  victoryOverride?: VictoryCondition[];
  turnLimitOverride?: number;
}

interface GameState {
  schemaVersion: 1;
  campaignId: 'ulm-austerlitz-1805';
  scenarioIndex: number;            // 0..6
  scenarioId: string;
  units: Unit[];
  currentSide: Side;
  turn: number;
  phase: 'orders' | 'combat' | 'end-of-turn';
  selectedUnitId: string | null;
  log: BattleEvent[];
  decisionsTaken: { decisionId: string; optionIndex: number }[];
  outcomes: { scenarioId: string; victor: Side; turnsTaken: number }[];
}
```

### 4.5 Save & replay

- One `localStorage` key per campaign run: `napoleonic-save-<runId>`.
- Up to 3 saved runs visible in the menu; older runs auto-pruned.
- **Save format = JSON serialization of `GameState` directly** (no translation layer). Because every field of `GameState` is JSON-safe (including `decisionsTaken`, which references decisions by id rather than carrying their option patches), the save survives roundtrip without a custom (de)serializer.
- **Decisions on resume:** the save records `{decisionId, optionIndex}`; on load, the engine looks up the corresponding `Decision` in the in-memory scenario file and re-applies its `ScenarioPatch`. Decision text and patches live in code, not in the save — so revising a dispatch's wording doesn't break old saves.
- `schemaVersion: 1` on every saved game. If the running engine sees an unrecognised version, the menu shows: *"We updated the game; old saves can't be continued — start fresh?"* — never silently corrupt.
- The cumulative `events` array is the replay log. Replay viewer steps forward/backward through events on a frozen-board view.

### 4.6 Solo AI

- **Scripted, not search-based.** Each scenario carries an `AiScript` with two parts:
  - **General rule:** `'aggressive'` (close to nearest enemy and attack), `'defensive'` (occupy victory tiles, attack only adjacent), or `'fixed'` (run a hand-coded plan).
  - **Triggered events:** scenario-specific scripts that fire on turn or condition. Example: *"on turn 3, Russian Imperial Guard advances on Pratzen Heights"*.
- AI runs in `runAiTurn(state)`, fully deterministic.
- Difficulty in v1 is scenario-tuned. Real difficulty selection deferred to v2.

## 5. UX

### 5.1 Screens

1. **Splash** — title, *New Campaign*, *Continue*, *How to Play*, *Replay Viewer*.
2. **Campaign Menu** — 7-battle path, locked / unlocked nodes, *Continue* or *Restart from battle X*.
3. **Dispatch Screen** — full-bleed parchment-styled text + 1 Decision + *Continue to battle*.
4. **Battle Screen** — board (left) + side panel (right: selected unit / attack preview / log) + action bar (bottom: Change Formation, End Turn, Help).
5. **Battle End** — outcome banner, stats, post-battle dispatch excerpt, *Continue*.
6. **Campaign End** — outcome verdict, decision/battle summary, *Replay any battle*.
7. **Help Overlay** — terrain / formation / combat reference. Reachable from any screen.

### 5.2 Battle screen interactions

- Tap a friendly unit → green tint on legal-move tiles, red tint on attack targets.
- Hover an enemy → side panel runs combat math live; opponent's morale shown as `?` until revealed.
- Tap a green tile → unit moves there.
- Tap a red tile → confirm dialog → combat resolves; events animate; morale reveal shown as a flip.
- **Undo within the current turn only** (chess-like commit on End Turn).
- **Autosave on every End Turn.**

### 5.3 Visual style — units & board

- **Unit art:** flat SVG silhouettes — soldier with shako and musket (infantry), horse-and-rider (cavalry), cannon on wheels (artillery). Side colour as background pad. Strength as corner badge. Front-edge triangle for facing. Formation glyph below the pad: `—` Line, `⋮` Column, `▢` Square.
- **Board:** parchment-beige base; terrain via colour-coded tiles (forest green, hill tan, town brown, river blue). Subtle thin grid lines.
- **Typography:** large readable serif for dispatches, sans-serif for HUD.
- **Touch targets ≥ 44px** so the game works on iPad as well as laptop.

## 6. Testing & Quality

- **Engine unit tests (Vitest):** every combat case (formation × terrain × flanking × morale combinations), every movement-legality rule, every victory-condition kind.
- **Property tests:** *total board strength is monotone non-increasing across legal moves; no unit ever ends a turn off-grid; applying a Decision to a Scenario then resetting equals the original Scenario.*
- **Scenario validation script** runs at build time. Loads every scenario file, asserts: units in bounds, unit IDs unique, victory conditions parseable, decision options reference real scenario fields.
- **Replay determinism:** for each scenario, a saved scripted log replays end-to-end to a known final `GameState` and event sequence.
- **UI smoke tests (Vitest + React Testing Library):** Splash *Continue* loads a save, clicking a unit highlights moves, *End Turn* advances. Light coverage — this is a hobby project, not enterprise.
- **Manual playtests with the kid** at the end of every weekend, 30–45 min. He's the real test.

## 7. Error Handling

- Engine throws typed errors on illegal states. UI catches and shows a kid-readable toast: *"That square is taken — try another."*
- Schema-version mismatch on load → *"We updated the game; old saves can't be continued — start fresh?"*. Never silently corrupt.
- localStorage disabled / quota exceeded → fall back to in-memory state with a banner: *"Saving is off. Don't close the tab."* Detected at startup.
- Static deploy → no network errors in production.

## 8. Schedule

Approach: **engine-first, content-incremental** — protects against scope blowout while giving the kid something playable every weekend.

| Weekend | Goal |
|---|---|
| **W1** | Engine (types, movement, combat, turn manager) + Austerlitz scenario + hot-seat playable. Engine tests in place. No campaign UI yet — boot straight into battle. |
| **W2** | Splash + Campaign Menu + Battle End screen + 2 more scenarios (Wertingen, Schöngrabern) + save/load + replay log + first GitHub Pages deploy. |
| **W3** | Dispatches written and wired with Decisions + remaining 4 scenarios (Haslach, Elchingen, Ulm-puzzle, Krems) + unit silhouettes polished + Help overlay. |
| **W4** | Scripted AI for solo mode + Campaign End screen + sound (drum on turn change, fife flourish on victory) + playtest fixes + `v1.0` tag. |

Schedule is gracefully slippable: cutting one or two of the W3 scenarios doesn't break the campaign — they become "skipped historical interludes" in the dispatch sequence.

## 9. Risks

- **AI feels dumb.** *Mitigation:* scenario-specific scripts with triggered events; the kid plays the harder side; document specific anti-patterns and patch in W4.
- **Dispatch writing is real work.** *Mitigation:* draft seeds in W1 (one paragraph stub per battle), polish across W3; treat them as living text that can be revised post-launch.
- **iPad tap fidelity.** *Mitigation:* enforce minimum 44px tap targets; smoke-test on iPad before the W2 deploy.
- **Scope creep into Coalition mode / multiplayer / pixel art.** *Mitigation:* explicit non-goals (§2); ideas for v2 go into an `IDEAS.md`, never into the v1 backlog.

## 10. Open questions deferred to implementation

- Exact unit count per scenario (~6–12 per side; tune for fun).
- Specific morale assignments per scenario — which units are Elite / Veteran / Conscript.
- Dispatch tone and voice — first drafts in W3, iterate with the kid in playtests.
- Decision options per battle — first drafts in W3.
- Whether to expose a *"math difficulty"* toggle (e.g., scale base strength values 0–9 vs. 0–19) — would be a nice teaching dial but adds tuning load.

---

*End of design.*
