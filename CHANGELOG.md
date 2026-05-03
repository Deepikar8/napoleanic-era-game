# Changelog

## v1.3.1 — 2026-05-03

### Fixed
- **"<unit> is not your unit" error mid-attack.** Reported by playtester selecting fr-murat on Wertingen and trying to attack. Root cause in `BattleBoard`: the `adjacentEnemies` filter only checked `u.side !== selected.side` — it didn't verify the selected unit was on the active side, nor that the target was on the opposing team (coalition-aware). So selecting a non-active-side unit would still light up enemies with the red attackable ring; tap-tap-to-attack invoked the engine, which correctly rejected with the raw error. Now the attack indicator only renders when:
  - `canAct(selected.side)` (the selected unit is on the side currently to act), AND
  - `!selected.hasActed` (it hasn't already attacked this turn), AND
  - the target is **not** on the same team via `sameTeam` (austrian + russian count as one team).
- Same fix prevents Austerlitz coalition partners from showing each other as attackable.

## v1.3.0 — 2026-05-03

The "make AI moves visible" pass + coalition smoke test.

### Added
- **Animated AI turns in solo mode.** Previously the AI ran synchronously inside `doEndTurn` and the board jumped to a final state with no narrative. Now the engine still runs in one shot, but the store steps the displayed state through each AI-generated event with a 600ms delay (using the v1.2.0 replay rebuilder), highlighting the unit involved at each step.
- **"Coalition is moving…" status banner** under the board during the animation. Action-bar buttons disable during animation so accidental taps don't queue up.
- **Store guards on player actions during animation.** `doMove` / `doAttack` / `doFormation` / `doEndTurn` early-return when `isAnimating` so dispatched events from the UI don't corrupt the in-flight animation.
- **Coalition turn smoke tests** (5 new tests in `turn.test.ts`): handover french → austrian, both partners can act on the same turn, partners can't attack each other, flags reset on next coalition turn, french locked out during coalition.

### Changed
- Header label shows **"COALITION"** instead of **"AUSTRIAN"** when the scenario has both Austrian and Russian units, so the player understands russian units are also active.

## v1.2.2 — 2026-05-03

Found by playtest.

### Fixed
- **Towns are now passable.** `terrainCost('town')` was `Infinity`, which made every scenario with a town in a victory or path-of-attack location effectively unwinnable. Worst case: **Elchingen** (the kid's complaint — couldn't cross the bridge because the only south exit is the village, which was impassable) and **Ulm** (the entire 2×2 centre was sealed off). Towns now cost 1 to enter; defenders inside still get +1, as the help overlay always claimed.
- Removed `game.png` artifact from the repo.

### Added
- Regression test reproducing the Elchingen bridge geometry: infantry north of a river+bridge can now reach a town tile south of the bridge.

## v1.2.1 — 2026-05-03

Hotfixes from first real playthrough.

### Fixed
- **Giant silhouette overflow.** `<use>` of a `<symbol>` without explicit width/height defaults to 100% of the use's SVG context — for cavalry/artillery this rendered massive white shapes overlaying the right side of the board. Added explicit `width={24} height={24}` on the use.

### Added
- **Unit-type badge** in the top-left of every unit. Two-letter codes (LI/Li/Gr/LC/HC/FA/HA) on a coloured pill — colour-coded by category (brown=infantry, red=cavalry, blue=artillery). Always visible regardless of silhouette legibility, so cavalry vs infantry is unambiguous at a glance.

## v1.2.0 — 2026-05-03

The "less to parse" pass — visual clarity and replay polish.

### Added
- **Animated replay.** The Replay screen now renders the battle board at the active event's state by reapplying log events to the scenario's initial state. Involved units get a gold highlight ring. Click any log entry to jump to it; new ⏮ Start / End ⏭ buttons. A new engine test verifies the rebuilt state matches the engine's actual state at every snapshot.
- **Show details toggle** in the action bar. Formation glyph (—/⋮/▢) and facing triangle now hidden by default; flip the toggle when the player wants tactical detail.
- **Terrain tooltip.** Tap (or hover) a tile when no unit is selected to see terrain name, effect, and any occupying unit. Auto-dismisses when a unit is picked.
- **"Acted" indicator.** Units that have used both their move and their action this turn render at 0.45 opacity, so the active player can see at a glance which still have actions left.
- **highlightUnitIds prop on BattleBoard** for replay-style highlighting.

### Changed
- Splash "Continue" button shows the scenario title (e.g. "Continue: Haslach-Jungingen — 11 October 1805 · turn 5") instead of the raw id.
- Campaign End screen results list shows scenario titles instead of raw ids.

## v1.1.0 — 2026-05-03

The "playable for real" pass — discoverability and forgiveness fixes.

### Fixed
- **Briefings and pre-battle decisions now actually appear.** `startNewRun` and `advanceAfterBattle` previously routed straight to the battle screen, leaving every dispatch markdown file and the Haslach pre-battle decision unreachable. Both routes now go through `DispatchScreen`. (Resuming a saved run still skips the dispatch and lands you back where you were.)
- **Illegal moves no longer fail silently.** Engine errors (`Illegal move target`, `Already moved this turn`, etc.) now surface as a transient red toast instead of a `console.warn`.

### Added
- **First-run tutorial hint** above the battle board explaining the tap-unit / tap-tile / tap-tap-enemy flow. Dismissed permanently in localStorage.
- **End Turn confirmation.** First tap arms the button (red, with a count of un-acted units); a second tap within 4 seconds confirms. Auto-clears on side change.
- **Distinct cavalry / artillery silhouettes.** Cavalry now has a tall vertical rider on top with a raised sabre; artillery has spoked wheels and no upright figure. Heavy cavalry adds a helmet plume; horse artillery adds a small horse pulling.

### Changed
- "New Campaign" on the Splash now starts at scenario index 0 (Wertingen) instead of jumping straight to Austerlitz. (Was first shipped as v1.0.1.)
- Unit silhouette `viewBox`es are uniformly `24×24` (cavalry/artillery were `32×24` and overflowed adjacent cells by ~5px).

## v1.0.1 — 2026-05-03

### Fixed
- "New Campaign" on the Splash now starts at scenario index 0 (Wertingen) instead of jumping straight to Austerlitz. The hardcode dated from Phase 2 when Austerlitz was the only scenario.
- Version footer text updated from "v0.4 · Phase 4" to "v1.0.0".

## v1.0.0 — 2026-05-03

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
