# Changelog

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
