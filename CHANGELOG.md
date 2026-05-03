# Changelog

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
