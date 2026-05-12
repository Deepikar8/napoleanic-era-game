import type { GameState, TerrainKind } from '../engine/types';

import parchmentTexture from '../assets/skins/ulm-austerlitz-1805/parchment.jpg';
import plainTexture from '../assets/skins/ulm-austerlitz-1805/plain.jpg';
import forestTexture from '../assets/skins/ulm-austerlitz-1805/forest.jpg';
import townTexture from '../assets/skins/ulm-austerlitz-1805/town.jpg';
import hillTexture from '../assets/skins/ulm-austerlitz-1805/hill.jpg';
import roadTexture from '../assets/skins/ulm-austerlitz-1805/road.jpg';
import riverTexture from '../assets/skins/ulm-austerlitz-1805/river.jpg';
import bridgeTexture from '../assets/skins/ulm-austerlitz-1805/bridge.jpg';
import marshTexture from '../assets/skins/ulm-austerlitz-1805/marsh.jpg';

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
    gridColor: '#4a371f',
    gridIntersectionColor: '#5c4426',
    borderColor: '#4a3219',
    paperTint: '#dbc28a',
    counter: {
      bevel: '#f7e5b2',
      shadow: '#1a1208',
      highlight: '#d4a017',
      inactiveStroke: '#6f5c3f',
    },
  },
  'peninsular-war-1808': {
    id: 'peninsular-war-1808',
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
    gridColor: '#4a371f',
    gridIntersectionColor: '#5c4426',
    borderColor: '#55381d',
    paperTint: '#d3b273',
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
