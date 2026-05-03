# Changelog

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
