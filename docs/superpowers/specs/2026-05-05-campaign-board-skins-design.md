# Campaign Board Skins — Design Spec

**Date:** 2026-05-05  
**Status:** Approved direction, awaiting implementation plan.  
**Decision:** Start with campaign-specific board and terrain skins.

## 1. Goal

Upgrade the battle board from a mostly code-rendered parchment grid into a painted board-game map system where each campaign can have its own visual identity.

The first target is the existing `ulm-austerlitz-1805` campaign. It should feel closer to an illustrated Napoleonic war-game board: aged parchment, historic map markings, engraved borders, richer towns/forests/roads, and beveled physical counters. The change must improve atmosphere without weakening gameplay readability.

## 2. Design Direction

Use generated/raster texture assets for board mood and terrain richness, paired with hand-cleaned SVGs for units and interactive UI states.

Campaign skins define the battlefield's visual family:

- Parchment/base map texture
- Grid and border treatment
- Terrain textures for plain, forest, town, hill, road, river, bridge, and marsh
- Ambient page background
- Counter material styling tokens

Unit counters and silhouettes remain consistent across scenarios so the player can recognize unit type, side, strength, morale, formation, and facing quickly. Campaign art should make the board feel distinct; it should not make the game harder to parse.

## 3. Scope

### In Scope For First Pass

- Add a campaign skin lookup for `ulm-austerlitz-1805`.
- Add generated raster assets under `src/assets/skins/ulm-austerlitz-1805/`.
- Update `BattleBoard` to render terrain patterns from the selected campaign skin.
- Improve board frame, parchment, grid, and decorative border styling.
- Improve counter beveling, shadows, and material feel.
- Replace the weak cavalry SVGs with larger, cleaner horse-and-rider marks.
- Preserve existing accessibility affordances: keyboard focus cursor, tooltips, contrast, reduced motion behavior, and SVG readability.

### Out Of Scope For First Pass

- Unique painted backgrounds for every individual scenario.
- Campaign briefing/victory/defeat illustration packs.
- New campaigns.
- Engine changes to movement, combat, victory, saves, replay, AI, or scenario patching.
- A full canvas renderer rewrite.

## 4. Architecture

Keep the skin system presentational and separate from engine state.

Recommended modules:

```text
src/
  art/
    campaign-skins.ts
    unit-silhouettes.tsx
  assets/
    skins/
      ulm-austerlitz-1805/
        parchment.png
        plain.png
        forest.png
        town.png
        hill.png
        road.png
        river.png
        bridge.png
        marsh.png
```

`campaign-skins.ts` should export typed skin metadata:

```ts
type CampaignSkinId = 'ulm-austerlitz-1805';

interface CampaignBoardSkin {
  id: CampaignSkinId;
  boardTexture: string;
  terrainTextures: Record<TerrainKind, string>;
  gridColor: string;
  borderColor: string;
  paperTint: string;
  counterStyle: {
    bevelColor: string;
    shadowColor: string;
    highlightColor: string;
  };
}
```

The UI can derive the skin from `state.campaignId` or `scenario` context. No skin data should be stored in `GameState`, because changing art should not invalidate saves or replay logs.

## 5. BattleBoard Rendering

`BattleBoard` should continue using SVG for interaction and deterministic layout.

The rendering stack should be:

1. Board-level parchment/map texture.
2. Terrain tile fills using skin-provided image patterns.
3. Grid lines and decorative intersections/border.
4. Objective markers and keyboard cursor.
5. Units/counters.
6. Combat effects and tooltips.

Terrain mechanics remain driven by `scenario.tiles`. The skin only changes how terrain is drawn.

## 6. Asset Strategy

Raster assets should be generated as reusable square textures, not baked screenshots of a full scenario. This keeps scenario authoring flexible while still giving the board a painted quality.

Recommended texture sizes:

- `parchment.png`: 1024×1024 or 1536×1536
- Terrain tiles: 256×256 or 512×512
- Keep textures readable when repeated at a 48px SVG cell scale.

Generated assets should avoid embedded unit counters, labels, UI text, or fixed grid lines. The code owns gameplay state and grid alignment.

## 7. Unit SVG Strategy

Unit silhouettes stay vector and `currentColor`-driven so they can render on French, Austrian, and Russian counters.

The cavalry marks need the first cleanup:

- Larger source viewBox than the current tiny `24×24` mark.
- Clear horse profile: head, neck, back, chest, separate legs, tail.
- Clear rider posture and weapon.
- Distinct light cavalry versus heavy cavalry: lighter horse/body line and saber for light cavalry; bulkier horse/rider mass and helmet posture for heavy cavalry.

After cavalry, infantry and artillery can be refined using the same SVG style.

## 8. Accessibility And UX Constraints

The visual upgrade must preserve:

- Keyboard-only play and visible focus cursor.
- Color contrast for counters, strength badges, tooltip text, and movement/attack highlights.
- Reduced-motion behavior for effects.
- Board readability on mobile/tablet.
- Tooltips that remain legible over textured backgrounds.
- Terrain recognition without relying on color alone.

Texture richness should never obscure legal move highlights, attackable targets, objective markers, or selected unit state.

## 9. Save And Replay Integrity

No save migration is required for this feature if skin data remains outside `GameState`.

Existing saves store:

- `campaignId`
- `scenarioId`
- units
- decisions
- outcomes
- replay log
- pending patches

All of that remains valid. Replays should render with the current campaign skin for the campaign id, but replay state reconstruction should be unchanged.

## 10. Verification

Implementation should be verified with:

- `npm run build`
- `npm run lint`
- Existing test suite if implementation touches shared rendering helpers or types.
- Browser visual check at desktop and mobile/tablet widths.
- Manual checks for:
  - cavalry readability at board scale
  - terrain readability
  - selected unit state
  - legal move highlight
  - attackable enemy highlight
  - keyboard cursor
  - tooltip contrast
  - reduced motion setting

## 11. Acceptance Criteria

The first pass is complete when:

- The existing campaign uses a named board skin.
- The live battle board visibly resembles a painted Napoleonic war-game map.
- Forest, town, hill, road, river, bridge, marsh, and plain terrain remain distinguishable.
- Cavalry reads as horse-and-rider at normal board scale.
- Counters feel materially closer to the reference: beveled, shadowed, and board-game-like.
- Saves and replays continue to work without schema changes.
- Build and lint pass.
