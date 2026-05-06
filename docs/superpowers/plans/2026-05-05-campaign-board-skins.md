# Campaign Board Skins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first campaign-specific painted board skin for `ulm-austerlitz-1805`, with reusable raster terrain assets, skinned SVG board rendering, beveled counters, and clearer cavalry marks.

**Architecture:** Keep skins purely presentational. Add a typed `campaign-skins.ts` lookup that maps `campaignId` to texture URLs and visual tokens; `BattleBoard` derives the skin from `state.campaignId` and uses SVG `<pattern><image /></pattern>` fills. Unit silhouettes stay SVG and `currentColor`-driven.

**Tech Stack:** TypeScript, React, SVG, Vite asset imports, CSS/Tailwind, macOS `sips` for deriving raster texture assets from the approved generated board art.

---

### Task 1: Create Campaign Skin Assets

**Files:**
- Create: `src/assets/skins/ulm-austerlitz-1805/parchment.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/plain.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/forest.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/town.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/hill.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/road.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/river.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/bridge.png`
- Create: `src/assets/skins/ulm-austerlitz-1805/marsh.png`

- [x] **Step 1: Create the asset directory**

Run:

```bash
mkdir -p src/assets/skins/ulm-austerlitz-1805
```

Expected: directory exists.

- [x] **Step 2: Derive square texture assets from the approved generated board mockup**

Run these commands from the repo root. Keep crop and resize as separate
steps; `sips` applies resizing before cropping when both are in the same
command, which can pull counter art or dark board areas into repeatable
textures.

```bash
sips -c 96 96 src/assets/art/board-visual-direction.png --cropOffset 520 345 --out src/assets/skins/ulm-austerlitz-1805/plain.png
sips -c 96 96 src/assets/art/board-visual-direction.png --cropOffset 525 505 --out src/assets/skins/ulm-austerlitz-1805/forest.png
sips -c 120 120 src/assets/art/board-visual-direction.png --cropOffset 25 810 --out src/assets/skins/ulm-austerlitz-1805/town.png
cp src/assets/skins/ulm-austerlitz-1805/plain.png src/assets/skins/ulm-austerlitz-1805/road.png
cp src/assets/skins/ulm-austerlitz-1805/plain.png src/assets/skins/ulm-austerlitz-1805/parchment.png
sips -z 1024 1024 src/assets/skins/ulm-austerlitz-1805/parchment.png
sips -z 512 512 src/assets/skins/ulm-austerlitz-1805/plain.png
sips -z 512 512 src/assets/skins/ulm-austerlitz-1805/forest.png
sips -z 512 512 src/assets/skins/ulm-austerlitz-1805/town.png
sips -z 512 512 src/assets/skins/ulm-austerlitz-1805/road.png
cp src/assets/skins/ulm-austerlitz-1805/plain.png src/assets/skins/ulm-austerlitz-1805/hill.png
cp src/assets/skins/ulm-austerlitz-1805/plain.png src/assets/skins/ulm-austerlitz-1805/river.png
cp src/assets/skins/ulm-austerlitz-1805/road.png src/assets/skins/ulm-austerlitz-1805/bridge.png
cp src/assets/skins/ulm-austerlitz-1805/forest.png src/assets/skins/ulm-austerlitz-1805/marsh.png
```

Expected: all nine PNG files exist. `hill`, `river`, `bridge`, and `marsh` start as texture-backed variants that code overlays with distinct SVG marks.

- [x] **Step 3: Verify asset dimensions**

Run:

```bash
sips -g pixelWidth -g pixelHeight src/assets/skins/ulm-austerlitz-1805/*.png
```

Expected: `parchment.png` is `1024×1024`; terrain textures are `512×512`.

### Task 2: Add Typed Campaign Skin Metadata

**Files:**
- Create: `src/art/campaign-skins.ts`

- [x] **Step 1: Create the skin metadata module**

Add `src/art/campaign-skins.ts`:

```ts
import type { GameState, TerrainKind } from '../engine/types';

import parchmentTexture from '../assets/skins/ulm-austerlitz-1805/parchment.png';
import plainTexture from '../assets/skins/ulm-austerlitz-1805/plain.png';
import forestTexture from '../assets/skins/ulm-austerlitz-1805/forest.png';
import townTexture from '../assets/skins/ulm-austerlitz-1805/town.png';
import hillTexture from '../assets/skins/ulm-austerlitz-1805/hill.png';
import roadTexture from '../assets/skins/ulm-austerlitz-1805/road.png';
import riverTexture from '../assets/skins/ulm-austerlitz-1805/river.png';
import bridgeTexture from '../assets/skins/ulm-austerlitz-1805/bridge.png';
import marshTexture from '../assets/skins/ulm-austerlitz-1805/marsh.png';

export type CampaignSkinId = GameState['campaignId'];

export interface CampaignBoardSkin {
  id: CampaignSkinId;
  boardTexture: string;
  terrainTextures: Record<TerrainKind, string>;
  gridColor: string;
  gridIntersectionColor: string;
  borderColor: string;
  paperTint: string;
  screenTexture: string;
  counter: {
    bevel: string;
    shadow: string;
    highlight: string;
    inactiveStroke: string;
  };
}

export const CAMPAIGN_BOARD_SKINS: Record<CampaignSkinId, CampaignBoardSkin> = {
  'ulm-austerlitz-1805': {
    id: 'ulm-austerlitz-1805',
    boardTexture: parchmentTexture,
    screenTexture: parchmentTexture,
    terrainTextures: {
      plain: plainTexture,
      forest: forestTexture,
      town: townTexture,
      hill: hillTexture,
      road: roadTexture,
      river: riverTexture,
      bridge: bridgeTexture,
      marsh: marshTexture,
    },
    gridColor: '#3f3120',
    gridIntersectionColor: '#5a452a',
    borderColor: '#4a3219',
    paperTint: '#dbc28a',
    counter: {
      bevel: '#f7e5b2',
      shadow: '#1a1208',
      highlight: '#d4a017',
      inactiveStroke: '#6f5c3f',
    },
  },
};

export function getCampaignBoardSkin(campaignId: GameState['campaignId']): CampaignBoardSkin {
  return CAMPAIGN_BOARD_SKINS[campaignId];
}
```

- [x] **Step 2: Run TypeScript check**

Run:

```bash
npm run typecheck
```

Expected: TypeScript succeeds or fails only because consumers have not been wired yet. If it fails because images are missing, return to Task 1.

### Task 3: Wire Campaign Skin Into BattleBoard

**Files:**
- Modify: `src/ui/BattleBoard.tsx`

- [x] **Step 1: Import the skin lookup**

Add:

```ts
import { getCampaignBoardSkin } from '../art/campaign-skins';
```

- [x] **Step 2: Derive the active skin inside `BattleBoard`**

After `const h = scenario.grid.height * cellSize;`, add:

```ts
const skin = getCampaignBoardSkin(state.campaignId);
```

- [x] **Step 3: Replace terrain pattern constants with skinned pattern ids**

Keep `TERRAIN_PATTERN` as pattern ids, but ensure the SVG `<defs>` contains image-backed patterns named `terrain-plain`, `terrain-forest`, `terrain-town`, `terrain-hill`, `terrain-road`, `terrain-river`, `terrain-bridge`, and `terrain-marsh`.

Use this helper shape in the component:

```tsx
const terrainTextureEntries = Object.entries(skin.terrainTextures) as Array<[TerrainKind, string]>;
```

In `<defs>`, before `terrain-move`, render:

```tsx
<pattern id="board-paper" patternUnits="userSpaceOnUse" width="512" height="512">
  <image href={skin.boardTexture} width="512" height="512" preserveAspectRatio="xMidYMid slice" />
</pattern>
{terrainTextureEntries.map(([kind, href]) => (
  <pattern key={kind} id={`terrain-${kind}`} patternUnits="userSpaceOnUse" width="48" height="48">
    <image href={href} width="48" height="48" preserveAspectRatio="xMidYMid slice" />
  </pattern>
))}
```

Then keep type-specific SVG overlays for hills/roads/rivers/bridges/marshes in the tile loop so each terrain is recognizable beyond texture.

- [x] **Step 4: Add board background and decorative grid intersections**

At the start of the SVG content after `<defs>`, add:

```tsx
<rect width={w} height={h} fill="url(#board-paper)" />
<rect x={1} y={1} width={w - 2} height={h - 2} fill="none" stroke={skin.borderColor} strokeWidth={2.2} pointerEvents="none" />
```

After the tile rectangles, render intersection dots:

```tsx
{Array.from({ length: scenario.grid.height + 1 }, (_, y) =>
  Array.from({ length: scenario.grid.width + 1 }, (_, x) => (
    <circle
      key={`grid-dot-${x},${y}`}
      cx={x * cellSize}
      cy={y * cellSize}
      r={1.8}
      fill="none"
      stroke={skin.gridIntersectionColor}
      strokeWidth={0.7}
      opacity={0.7}
      pointerEvents="none"
    />
  ))
)}
```

- [x] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

### Task 4: Improve Counter Material And Cavalry SVGs

**Files:**
- Modify: `src/ui/BattleBoard.tsx`
- Modify: `src/art/unit-silhouettes.tsx`
- Modify: `src/ui/UnitReference.tsx`

- [x] **Step 1: Update counter filters and outlines**

In `BattleBoard.tsx`, update `counter-shadow` to use stronger shadow and add an inner bevel/highlight rect around counters. Keep selected, active, and attackable states more visually prominent than texture.

- [x] **Step 2: Replace light and heavy cavalry symbols**

In `unit-silhouettes.tsx`, replace only `silh-light-cavalry` and `silh-heavy-cavalry` with larger, cleaner horse-and-rider marks. Use `viewBox="0 0 72 48"` and paths that clearly show the horse body, separate legs, tail, head/neck, rider torso/head, and weapon.

- [x] **Step 3: Allow type-specific symbol view boxes in `UnitReference`**

Add a viewBox lookup:

```ts
const UNIT_REFERENCE_VIEWBOX: Record<UnitType, string> = {
  'line-infantry': '0 0 24 24',
  'light-infantry': '0 0 24 24',
  'grenadier': '0 0 24 24',
  'light-cavalry': '0 0 72 48',
  'heavy-cavalry': '0 0 72 48',
  'foot-artillery': '0 0 24 24',
  'horse-artillery': '0 0 24 24',
};
```

Use `viewBox={UNIT_REFERENCE_VIEWBOX[item.type]}`.

- [x] **Step 4: Update board icon layout for larger cavalry**

In `BattleBoard.tsx`, extend `UNIT_ICON_LAYOUT` to include `width` and `height`, using larger dimensions for cavalry:

```ts
const UNIT_ICON_LAYOUT: Record<Unit['type'], { x: number; y: number; scale: number; width: number; height: number }> = {
  'line-infantry': { x: 5.2, y: 4.6, scale: 1.24, width: 24, height: 24 },
  'light-infantry': { x: 5.2, y: 4.8, scale: 1.24, width: 24, height: 24 },
  'grenadier': { x: 5.0, y: 4.2, scale: 1.25, width: 24, height: 24 },
  'light-cavalry': { x: 2.2, y: 9.4, scale: 0.72, width: 44, height: 30 },
  'heavy-cavalry': { x: 1.6, y: 9.0, scale: 0.72, width: 44, height: 30 },
  'foot-artillery': { x: 2.6, y: 6.8, scale: 1.34, width: 24, height: 24 },
  'horse-artillery': { x: 2.4, y: 6.6, scale: 1.34, width: 24, height: 24 },
};
```

Then render `<use ... width={icon.width} height={icon.height} />`.

- [x] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

### Task 5: Update Page/Board CSS And Verify

**Files:**
- Modify: `src/index.css`

- [x] **Step 1: Tune board frame CSS**

Update `.battle-screen`, `.battle-board-frame`, and `.battle-board-svg` so the page background and board frame use a darker, engraved-map feel without adding new behavior.

- [x] **Step 2: Run full verification**

Run:

```bash
npm run build
npm run lint
```

Expected: both pass.

- [x] **Step 3: Browser visual check**

Use the existing dev server or start one with:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: the board loads at `/napoleanic-era-game/`, terrain remains readable, cavalry reads as mounted units, and selected/legal/attack states remain clear.
