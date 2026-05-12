import type { Unit } from '../engine/types';

import grenadierInk from '../assets/units/grenadier-raster-ink.png';
import grenadierWhite from '../assets/units/grenadier-raster-white.png';
import heavyCavalryInk from '../assets/units/heavy-cavalry-raster-ink.png';
import heavyCavalryWhite from '../assets/units/heavy-cavalry-raster-white.png';
import lightInfantryInk from '../assets/units/light-infantry-raster-ink.png';
import lightInfantryWhite from '../assets/units/light-infantry-raster-white.png';
import lightCavalryInk from '../assets/units/light-cavalry-raster-ink.png';
import lightCavalryWhite from '../assets/units/light-cavalry-raster-white.png';
import lineInfantryInk from '../assets/units/line-infantry-raster-ink.png';
import lineInfantryWhite from '../assets/units/line-infantry-raster-white.png';

export interface UnitCounterIconLayout {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export const UNIT_COUNTER_ICON_LAYOUT: Record<Unit['type'], UnitCounterIconLayout> = {
  'line-infantry': { x: 7.5, y: 8.2, scale: 1, width: 14, height: 28 },
  'light-infantry': { x: 1.2, y: 11.2, scale: 1, width: 32, height: 24 },
  'grenadier': { x: 8.2, y: 7.8, scale: 1, width: 13, height: 28 },
  'light-cavalry': { x: 1.6, y: 10.2, scale: 1, width: 32, height: 25 },
  'heavy-cavalry': { x: 1.2, y: 9.4, scale: 1, width: 33, height: 26 },
  'foot-artillery': { x: 2.6, y: 6.8, scale: 1.34, width: 24, height: 24 },
  'horse-artillery': { x: 2.4, y: 6.6, scale: 1.34, width: 24, height: 24 },
};

export const UNIT_RASTER_ICON: Partial<Record<Unit['type'], Record<Unit['side'], string>>> = {
  'line-infantry': {
    french: lineInfantryWhite,
    austrian: lineInfantryInk,
    russian: lineInfantryWhite,
    spanish: lineInfantryInk,
    british: lineInfantryWhite,
    portuguese: lineInfantryWhite,
  },
  'light-infantry': {
    french: lightInfantryWhite,
    austrian: lightInfantryInk,
    russian: lightInfantryWhite,
    spanish: lightInfantryInk,
    british: lightInfantryWhite,
    portuguese: lightInfantryWhite,
  },
  'grenadier': {
    french: grenadierWhite,
    austrian: grenadierInk,
    russian: grenadierWhite,
    spanish: grenadierInk,
    british: grenadierWhite,
    portuguese: grenadierWhite,
  },
  'light-cavalry': {
    french: lightCavalryWhite,
    austrian: lightCavalryInk,
    russian: lightCavalryWhite,
    spanish: lightCavalryInk,
    british: lightCavalryWhite,
    portuguese: lightCavalryWhite,
  },
  'heavy-cavalry': {
    french: heavyCavalryWhite,
    austrian: heavyCavalryInk,
    russian: heavyCavalryWhite,
    spanish: heavyCavalryInk,
    british: heavyCavalryWhite,
    portuguese: heavyCavalryWhite,
  },
};

export const UNIT_REFERENCE_RASTER_CLASS: Partial<Record<Unit['type'], string>> = {
  'line-infantry': 'h-7 w-6',
  'light-infantry': 'h-6 w-8',
  'grenadier': 'h-7 w-6',
  'light-cavalry': 'h-7 w-8',
  'heavy-cavalry': 'h-7 w-8',
};

export const UNIT_REFERENCE_VIEWBOX: Record<Unit['type'], string> = {
  'line-infantry': '0 0 24 24',
  'light-infantry': '0 0 24 24',
  'grenadier': '0 0 24 24',
  'light-cavalry': '0 0 64 44',
  'heavy-cavalry': '0 0 64 44',
  'foot-artillery': '0 0 24 24',
  'horse-artillery': '0 0 24 24',
};

export function getUnitRasterIcon(type: Unit['type'], side: Unit['side']): string | undefined {
  return UNIT_RASTER_ICON[type]?.[side];
}
