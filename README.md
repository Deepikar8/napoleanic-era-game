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
