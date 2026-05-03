# Changelog

## v1.14.0 — 2026-05-03

Closes the design review's last open item (#5 — terrain readability).

### Added
- **Terrain patterns**, defined as SVG `<pattern>` elements in the BattleBoard's `<defs>`. Each non-plain terrain now has a recognizable motif that tiles inside its cell:
  - **Forest** — green field with darker green tree dots
  - **Hill** — tan field with two contour lines (topographic-style)
  - **Town** — brown field with two small pitched-roof buildings
  - **River** — blue field with stacked wave lines
  - **Bridge** — wood-coloured field with vertical plank lines
  - **Marsh** — muddy green field with dark speckle dots
  - **Road** — sandy field with a dashed centre line
  - Plain stays as a flat parchment colour so units pop cleanly.
- The "you can move here" green highlight still overrides the terrain pattern (movement clarity beats terrain readability in that moment).

The kid should now scan the board and *recognize the geography*: hills look like hills, the Danube looks like a river, the bridge at Elchingen looks like wooden planks. Tooltips remain the source of truth for exact effect, but the eye gets the gist for free.

## v1.13.1 — 2026-05-03

Reported by playtester: "at Haslach round 6, all the army is killed but the game did not end".

### Fixed
- **Total side elimination now wins.** The engine had no rule for "your opponent has been wiped out, so you win." Victory only fired on specific conditions (eliminate-X, capture-Y, survive-N, etc.). At Haslach the kid wiped the Austrians at turn 6, but Austrians can't kill Dupont (they're dead) and French haven't reached turn 8 yet — so the game just sat. Added a fallback: if one team has zero units and the other team has at least one, the surviving team wins immediately ("Coalition army destroyed" / "French army destroyed"). Explicit scenario conditions still take priority for the recorded reason. Three new tests cover the fix and explicit-condition priority.

## v1.13.0 — 2026-05-03

Combat feedback animations — moving the *drama* of combat onto the board, per the design review's "communicating drama" point.

### Added
- **Damage flash on hit cells.** When a unit's strength drops, the cell flashes a translucent red for 700ms (ease-out fade).
- **Floating loss marker.** A bold "−1" or "−2" rises from the unit and fades over ~1.1s. Stroke-painted for legibility against any background.
- **Elimination animation.** When a unit is removed from the board, a dark cell with an "✕" briefly inflates and fades at the unit's last-known position. Pure UI — no engine change; computed by diffing units between renders.
- **Morale-reveal star burst.** When an enemy's morale flips from hidden to revealed, the matching star count (★/★★/★★★) floats up above the unit in gold for 1.3s. Same hidden→revealed beat the engine already produced; just visible now.

### Implementation
- BattleBoard tracks the previous frame's units in a `useRef` and diffs on each render — strength loss, eliminations, morale flips. New `effects` state holds active overlays; auto-pruned 1500ms after creation.
- New CSS keyframes in `index.css` for `damage-flash`, `float-up`, `eliminate`, `morale-reveal` — each one-shot, all SVG-friendly (`transform-box: fill-box` for stable origins).

## v1.12.0 — 2026-05-03

UI/visual pass — moving information from side panels onto the board.

### Added
- **Objective markers on the board.** Every French `capture-tile` and `hold-tile-for-turns` victory tile now shows a gold flag with a dashed laurel ring on its cell. Unmet objectives gently pulse (1800ms ease-in-out) to draw the eye; met objectives turn green with a ✓. Recursively expands `all-of` so all four Ulm road tiles are individually flagged. The kid sees *where to go* without reading.
- **Active-unit indicator.** Units that can still act this turn (current side, not fully spent) now have a thicker green border. Selected/highlighted units still show the gold border. Combined with the existing dim-on-spent, the kid can tell at a glance which of his pieces are still useful.
- **Revealed morale stars on the unit cell.** Once an enemy's morale is revealed by the first attack, ★ / ★★ / ★★★ appears in the top-right corner of the cell with a dark stroke for legibility. No more digging into the side panel — the morale data lives where the kid is looking.

### Changed
- **Formation glyphs (—/⋮/▢) and facing triangles visible by default.** `showDetails` now defaults to `true`. The "Hide details" toggle remains in the action bar for kids who want a cleaner board.

## v1.11.0 — 2026-05-03

Two big-engine pieces from the design review.

### Added (engine)
- **Cross-battle decision consequences.** New optional `downstreamPatches: Record<scenarioId, ScenarioPatch>` on `DecisionOption`. When the player picks an option, the named patches accumulate in a new `GameState.pendingPatches` map; `beginBattle` consumes the entry for whichever scenario it's starting. Earlier choices now have permanent campaign-level effects.
- **Scenario triggers.** New optional `Scenario.scenarioTriggers: ScenarioTrigger[]` field. Each trigger has a condition (`whenTurn` / `whenSideStrengthBelow` / `whenSideHasUnitOnTile`), a `ScenarioPatch` to apply when met, and an optional `flavour` string for the log/animation. Triggers fire once each (tracked via `GameState.triggersFired`), evaluated after every player action and at end of turn. New `BattleEvent` kind `'trigger-fired'` carries the patch so the replay engine can faithfully reconstruct.
- New helper `applyPatchToState(state, patch)` for live patch application (distinct from `applyPatch(scenario, patch)` which is scenario-data only).
- 9 new tests covering trigger conditions, no-double-fire, and pendingPatches consumption.
- Save migration: older saves without the new `pendingPatches` / `triggersFired` fields get them filled in on load.

### Added (scenarios — making it real)
- **Haslach decision now has lasting effects.** Choosing "send the light infantry forward" now drops `fr-fr-1` at Krems to strength 3 / morale 1 (the troops are tired and battered). "Hold the rearguard intact" leaves them fresh at morale 3.
- **New pre-Schöngrabern decision.** "Force march" weakens Bagration (caught before he can dig in) BUT downgrades Vandamme + St-Cyr at Austerlitz (the army is tired). "Rest first" makes Bagration tougher, leaves Austerlitz French units fresh.
- **Austerlitz Russian Imperial Guard counter-attack.** A staged trigger on Pratzen Heights (6,5): the moment a French unit stands on the tile, the Russian Imperial Guard cavalry materialises east of the heights at full strength + elite morale. The kid sees the flavour text "The Russian Imperial Guard cavalry charges from reserve!" and now has to defend the heights against a fresh elite unit, not just garrison and wait.

### Changed
- Tactical hint at Austerlitz updated to warn about the Imperial Guard charge — bring infantry, form square AS SOON AS you take the heights.

## v1.10.0 — 2026-05-03

Per-scenario unique mechanics — addressing the design-review point that scenarios played homogeneously.

### Added
- **`'all-of'` victory combinator.** Lets a `VictoryCondition` require *every* sub-condition to be met before firing. The top-level `victory[]` array is still implicit OR; `all-of` provides AND. Plus an optional `label?: string` on `VictoryCondition` for clean progress chips.
- **Progress display for combined goals.** `summarizeVictory` now shows fractional progress on `all-of` chips: "Encircle Ulm — close all 4 roads (2/4)". Met sub-conditions count toward the total live during the battle.

### Changed (scenario design)
- **Ulm is now a real encirclement.** Previously: capture the southern road tile = instant win (could be done turn 2 with a cavalry sprint). Now: occupy ALL FOUR road tiles (3,4), (6,4), (4,3), (4,6) — five French commanders, four roads, six turns. Forces the kid to spread the corps and time arrivals. Tactical hint rewritten accordingly.
- **Elchingen requires silencing the battery, not just taking the village.** Previously: capture (5,4) = instant win. Now: capture the village AND eliminate the Austrian foot artillery (which was hammering the bridge approach in the historical battle). Forces the kid to actually fight rather than sprint a cavalryman past the guns. Hint updated.

### Engine
- New tests: `all-of` requires every sub-condition; `summarizeVictory` shows the progress count.
- Scenario validation test now recurses into `all-of` to verify nested `eliminate-unit` references point at real units.

## v1.9.1 — 2026-05-03

External code review pass.

### Fixed
- **Survival/hold victories could fire before the opposing side took its final turn.** Engine evaluated `survive-turns` and `hold-tile-for-turns` at `state.turn >= turns`. After the player ended their turn N, the check fired with `state.turn === N` and the surviving side won — *before* the opposing AI got its turn-N action. This let French press End Turn on turn 8 and win Haslach (Dupont alive) or Krems (Mortier alive) without facing the aggressive AI's last attempt; same pattern at Austerlitz Pratzen Heights. Now uses `state.turn > turns`, so the check fires only after both sides have completed turn N (i.e., we're at the start of turn N+1). Two new tests in `turn.test.ts` and the existing `victory.test.ts` survive-turns case updated to reflect the corrected semantic.
- **Austerlitz Coalition AI was defensive but the scenario tells the player they'll counter-attack.** `defensive` makes the AI sit unless an enemy is adjacent; the briefing/hint promised the Coalition would push back on the Pratzen Heights. Flipped to `aggressive` so the Coalition actually advances. Tactical hint updated: "have someone standing there at turn 9 (after Coalition's turn 8)" — explicit about the timing now that survival/hold semantics have changed.

## v1.9.0 — 2026-05-03

Design review pass — making each scenario teach a different Napoleonic lesson.

### Added
- **Tactical hint per scenario.** New `Scenario.tacticalHint` field (optional, plain language). Rendered in a "Tactical guidance" panel on the Dispatch screen, separate from the in-character briefing prose. Each hint names the lesson the scenario is *supposed* to teach:
  - **Wertingen** — cavalry tutorial: charge isolated infantry, wrap flanks
  - **Haslach** — desperate holdout: don't kill, just keep Dupont alive
  - **Elchingen** — bridge assault: column to cross, line to fight
  - **Ulm** — maneuver puzzle: race a cavalryman to the road, no fighting needed
  - **Krems** — survival: keep Mortier alive, don't chase kills
  - **Schöngrabern** — delaying action: pin and concentrate force on Bagration's hill
  - **Austerlitz** — bait and counterstroke: take the heights AND hold them

### Changed
- **Austerlitz now requires holding the Pratzen Heights, not just touching them.** French primary victory was a one-shot `capture-tile (6,5)` — the kid could rush a cavalry unit, dismount on the hill, and win turn 4. Now `hold-tile-for-turns (6,5) until turn 8`, so they have to take the heights AND defend them while the Coalition counter-attacks. Alternative path (reduce Russian strength) preserved as backup. Engine already supported `hold-tile-for-turns`; we just weren't using it.
- **Morale-reveal captions are dramatic, not numeric.** Was: `morale revealed: ★★`. Now (in the AI animation banner *and* the right-side BattleLog): "Veterans — they stand firm.", "Elite Guard — we will bleed for every yard.", "Conscripts — they falter at the first volley." Same data, with the in-character line that turns the math reveal into narrative.

### Deferred (next design pass)
- Scenario-unique mechanical twists beyond just objectives (#2 in the review) — needs new engine concepts.
- Staged event triggers (Imperial Guard counterattack at Austerlitz mid-battle) — needs `scenarioTriggers` infrastructure separate from AI triggers.
- Cross-battle decision consequences — needs persistent campaign-level state.

## v1.8.0 — 2026-05-03

External code review pass — two real bugs, a refactor, and tooling.

### Fixed
- **Final battle outcome was never recorded.** `advanceAfterBattle` only appended to `state.outcomes` when there was a *next* scenario; the campaign-final battle was lost. `CampaignEndScreen` checks `wins >= campaignScenarios.length` (7) but `outcomes` could only ever hold 6, making "Historical Triumph" unreachable. Now the just-finished outcome is appended unconditionally before either advancing or transitioning to `campaign-end`.
- **Solo AI ignored coalition partners.** `runAiTurn` filtered active units with strict `u.side === s.currentSide`. On a coalition turn (currentSide = `'austrian'`), Russian units were skipped — at Austerlitz the AI would only run half its army. Now uses the same coalition-aware predicate as the engine and UI. New AI test verifies both austrian and russian units act on the same turn.

### Changed (refactor)
- **Coalition / team logic deduplicated.** `COALITION`, `sameTeam`, and the active-side predicate were copy-pasted across `engine/turn.ts`, `engine/ai.ts`, `engine/replay.ts`, `ui/BattleBoard.tsx`, and `app.tsx`. Now defined once in `engine/sides.ts` and re-exported from `engine/index.ts`. All five consumers updated.

### Added
- **Save validation beyond schemaVersion.** `localStorage` is user-editable; `save.ts` previously cast parsed JSON straight to `SavedRun` after a schemaVersion check, leaving any other field free to crash the engine. New `isValidGameState` / `isValidSavedRun` runtime guards check side/turn/phase enums, unit shape (id/side/type/position/facing/formation/strength/morale), and array fields. Three new tests cover malformed states, user-edited saves, and the wrapper validation.
- **ESLint wired up.** `eslint.config.js` (flat config) plus a `lint` script in `package.json`. The TS deps were already installed but had no config or runner. Catches unused vars, `==` use, `var`, and stray console calls. Currently 0 warnings.

## v1.7.5 — 2026-05-03

Reported by playtester: "what does morale mean?".

### Changed
- **UnitPanel morale row spells it out.** Was `?` or `★★`. Now `★★ Veteran` / `★★★ Elite` etc. when revealed; `? (revealed on first attack)` when hidden. New italic footer in the panel: "Morale is how steady the troops are. Higher = harder to break. Hidden until they're attacked."
- **Help overlay Morale section expanded** with the three named ranks (Conscript / Veteran / Elite), the math (morale adds straight to combat score, so a 4-strength elite is 7 vs a 4-strength conscript's 5), and the strategic implication that the first attack of a battle doubles as a probe to learn what you're really up against.

## v1.7.4 — 2026-05-03

Reported by playtester: "where is replay today, I cannot find it".

### Added
- **"Replay this battle" button on the Battle End screen.** Replay was only reachable from the splash before, which meant after winning a fight you had to back out of the campaign to review what happened. Now it sits between Campaign Menu and Continue. Footnote explains the limitation: replay is for the *most recent* battle; once you Continue, it's replaced by the next one's state.

## v1.7.3 — 2026-05-03

Reported by playtester: "so can LI attack anybody or there are rules?"

### Changed
- **Help overlay Combat section rewritten** to lead with "who can attack whom" — making it explicit that any unit can attack any adjacent enemy (kid was unsure if there were type-restrictions). Spells out the three real requirements (adjacency, your turn, opposing team).
- **New "Matchups cheatsheet" table** showing best formation per enemy type (Infantry → Line, Cavalry → Square, Artillery → Line/column). Plus a footnote on the cavalry-charge bonus and a pointer to the AttackPreview panel.
- Formations section now mentions that changing formation costs the unit's action.

## v1.7.2 — 2026-05-03

Reported by playtester: AI animation was unreadable, defensive scenarios looked broken, and the side log didn't update during AI turns.

### Fixed
- **BattleLog stayed frozen during AI animation.** Real bug: `replayUpTo` rebuilt unit positions, strengths, etc. but stripped the event log. The right-side BattleLog reads `state.log`, so during AI animation it showed only the initial turn-started event. Now `replayUpTo` returns `state.log = events.slice(0, idx + 1)`. Each animation step adds the AI's event to the log in real time. New test verifies log slices match for every rebuild index.

### Changed
- **AI animation slowed from 600ms to 900ms per step** so each move is readable.
- **Animation banner now describes the active step** instead of a static "Coalition is moving…": "Auffenberg moved to (4, 4)", "Murat attacks Spangen — defender retreats", etc.
- **"Coalition stood firm" banner** when a defensive AI took no actions this turn (e.g. Wertingen's Austrians sitting tight). Replaces what used to look like an empty/broken animation with a clear "they chose to hold" message.

## v1.7.1 — 2026-05-03

Reported by playtester: "It does not let me end turn after winning, it is asking to confirm as I still have move".

### Fixed
- **Victory now transitions the screen immediately, not at end of turn.** `doMove` / `doAttack` / `doFormation` previously didn't run `checkVictory` — only `doEndTurn` did. So if the player eliminated the last enemy or captured a victory tile mid-turn, the battle screen stayed up; trying to end turn then asked "Confirm? N units can still move or attack" because there were still unspent units. Now every state-changing action checks victory and routes to the Battle End screen on a decision (with the fife flourish).

## v1.7.0 — 2026-05-03

### Added
- **AI difficulty selector on the splash.** Three levels, default Normal:
  - **Easy** — attacks any adjacent enemy, no preview math, never forms square. Throws weak units away.
  - **Normal** (the v1.4.0 behavior) — uses preview math, skips losing attacks (gap < −1), forms square vs adjacent cavalry.
  - **Hard** — Normal plus: only attacks if predicted to win (gap ≥ 0); on the move, targets the weakest reachable enemy instead of the nearest (flanking).
- **Help overlay** now has a "Solo mode &amp; AI difficulty" section explaining the three levels.
- 2 new AI tests: easy attacks suicide trades; hard refuses gap=−1 trades that normal still takes.

The radio buttons are disabled when Solo mode is off (since the AI never runs in hot-seat). `runAiTurn(state, scenario, difficulty)` defaults to `'normal'` so existing call sites stay compatible.

## v1.6.2 — 2026-05-03

Reported by playtester: "I saw 3 unspent but none of the pawns when clicked showed the green paths or red to attack."

### Fixed
- **End Turn count was lying.** "Unspent" was counting any unit that hadn't *attacked* — but a unit that moved into an empty square with no enemies adjacent has nothing left to do. It still appeared in the warning. Now the count includes only units that actually have an action available: either a legal move target left, or an adjacent enemy to attack. The count matches what the kid sees on the board (green tiles + red rings).
- Reworded the warning from "X units haven't acted yet" to "X units can still move or attack" — matches the count's actual meaning.

## v1.6.1 — 2026-05-03

Reported by playtester: "I don't clearly understand the rules, how many turns we have, what does it mean when you said end anyway"

### Changed
- **End Turn confirmation wording.** "End anyway? (3 unspent)" → "Confirm? 3 units haven't acted yet" (or "1 unit hasn't acted yet"). The previous label hid the meaning behind jargon.
- **Header turn counter.** "Turn 4 / 8" → "Turn 4 of 8" — reads more naturally.
- **New help section: "Turns &amp; ending your turn".** Explains what a turn is, what the turn limit does, what "Confirm? N units haven't acted yet" means, and points at the objective chips. Placed at the top of the overlay since it's the question new players hit first.

## v1.6.0 — 2026-05-03

The "polish the rest of the open list" pass.

### Added
- **Unit tooltip on hover.** Hovering any unit (own, enemy, coalition partner) shows a small popover with type code, formation, facing, strength, and morale (or `?` if unrevealed). The terrain tooltip from v1.2.0 now extends seamlessly into a unit panel when the cell is occupied.
- **Per-event sounds.** Attack thump on `attack-resolved`, low gong on `unit-eliminated`, descending slide on `unit-retreated`. Plays both for the player's own attacks and during AI-turn animation steps. Mute toggle on the splash silences everything.
- **Keyboard shortcuts.** `Space` end turn (two-press arm/confirm), `U` undo, `Esc` deselect, `?` toggle help. Documented in the help overlay.
- **Save/load round-trip test.** New `save.test.ts` case constructs a real played-out Wertingen state (move + end turn), saves and reloads, and verifies every nested field matches. Confirms the engine state is JSON-clean.

### Changed
- **Mute toggle promoted** from tiny footer text to a real checkbox alongside the Solo toggle on the splash, with explanatory subtext.
- **Sidebar collapses on narrow viewports.** Below 768px, UnitPanel + AttackPreview + BattleLog stack below the board instead of sitting in a 22rem column. Phone viewports get a usable layout.
- Splash version footer updated.

## v1.5.0 — 2026-05-03

The "feedback / payoff" pass.

### Added
- **Victory progress pills** under the battle header. Each French objective renders as a small chip showing live progress: `Reduce russian to <8 (now 16)`, `Survive to turn 12 (turn 4/12)`, `Capture (5,4)`, etc. Met objectives flip to gold with a ✓. New engine helper `summarizeVictory(state, conds)` exports human-readable progress for any condition.
- **Post-battle dispatches.** All 7 `*-postbattle.md` files now have real prose (Wertingen → Austerlitz). Battle End screen renders the markdown via `marked` between the banner and the summary, closing the narrative loop after each fight.
- **Victory banner flourish.** When the French win, the banner zooms in with a brief shimmer (gold colour, 900ms cubic ease). CSS keyframes only — no JS.
- **Replay auto-play.** Replay viewer gains a `▶ Auto` / `⏸ Pause` button that advances events at 700ms each. Auto-pauses on reaching the end. Manual nav buttons pause autoplay so the kid can scrub freely.

## v1.4.1 — 2026-05-03

### Fixed
- **Text too small on desktop.** Reported by playtester (playing on a desktop monitor instead of iPad). Root font size now scales with viewport: 16px on phone/iPad (correct touch sizing preserved), 18px on screens ≥ 1024px, 20px on screens ≥ 1536px. All `rem`-based Tailwind text/spacing scales proportionally.
- BattleLog and Replay log entries bumped from `text-xs` to `text-sm` so they're comfortable on any screen.
- Sidebar width is now `22rem` (was a hardcoded `320px`), so on a 4K display the unit/attack/log column grows alongside the rest of the layout.

## v1.4.0 — 2026-05-03

The "harder AI" pass.

### Changed
- **AI uses combat math.** Each AI unit now scores every adjacent enemy with the same `previewAttack` the human sees and picks the best-gap target instead of attacking whichever was found first. Tie-breaks toward lower-strength enemies (higher elimination chance).
- **AI no longer commits suicide.** If every adjacent target has a predicted gap ≤ −2 (attacker breaks), the unit holds instead of throwing itself away.
- **AI infantry forms square against adjacent cavalry.** Trades the action for a defensive +2 vs cavalry — usually a better deal than a losing attack.

### Fixed
- **AI no longer treats coalition partners as enemies.** `nearestEnemy` previously used `u.side !== unit.side`, so an Austrian AI unit at Austerlitz would have walked toward a Russian one as if it were an enemy. Now uses team-aware logic; austrian + russian count as one team.

### Added
- 3 new AI tests: skips suicidal attacks, switches to square vs cavalry, picks the best-gap target among multiple adjacents.

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
