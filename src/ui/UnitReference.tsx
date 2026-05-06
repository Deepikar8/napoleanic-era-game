import type { CSSProperties } from 'react';
import type { UnitType } from '../engine/types';
import { unitSilhouetteId } from '../art/unit-silhouettes';
import grenadierInk from '../assets/units/grenadier-raster-ink.png';
import heavyCavalryInk from '../assets/units/heavy-cavalry-raster-ink.png';
import lightInfantryInk from '../assets/units/light-infantry-raster-ink.png';
import lightCavalryInk from '../assets/units/light-cavalry-raster-ink.png';
import lineInfantryInk from '../assets/units/line-infantry-raster-ink.png';
import { Panel } from './shared';

const UNIT_REFERENCE: Array<{ type: UnitType; code: string; label: string }> = [
  { type: 'line-infantry', code: 'LI', label: 'Line infantry' },
  { type: 'light-infantry', code: 'Li', label: 'Light infantry' },
  { type: 'grenadier', code: 'Gr', label: 'Grenadier' },
  { type: 'light-cavalry', code: 'LC', label: 'Light cavalry' },
  { type: 'heavy-cavalry', code: 'HC', label: 'Heavy cavalry' },
  { type: 'foot-artillery', code: 'FA', label: 'Foot artillery' },
  { type: 'horse-artillery', code: 'HA', label: 'Horse artillery' },
];

const UNIT_REFERENCE_VIEWBOX: Record<UnitType, string> = {
  'line-infantry': '0 0 24 24',
  'light-infantry': '0 0 24 24',
  'grenadier': '0 0 24 24',
  'light-cavalry': '0 0 64 44',
  'heavy-cavalry': '0 0 64 44',
  'foot-artillery': '0 0 24 24',
  'horse-artillery': '0 0 24 24',
};

const UNIT_REFERENCE_RASTER: Partial<Record<UnitType, string>> = {
  'line-infantry': lineInfantryInk,
  'light-infantry': lightInfantryInk,
  'grenadier': grenadierInk,
  'light-cavalry': lightCavalryInk,
  'heavy-cavalry': heavyCavalryInk,
};

const UNIT_REFERENCE_RASTER_CLASS: Partial<Record<UnitType, string>> = {
  'line-infantry': 'h-7 w-6',
  'light-infantry': 'h-6 w-8',
  'grenadier': 'h-7 w-6',
  'light-cavalry': 'h-7 w-8',
  'heavy-cavalry': 'h-7 w-8',
};

export function UnitReference() {
  return (
    <Panel title="Unit reference">
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {UNIT_REFERENCE.map(item => (
          <div key={item.type} className="flex items-center gap-2">
            <span className="w-7 rounded bg-ink text-parchment text-center font-bold leading-6">
              {item.code}
            </span>
            {UNIT_REFERENCE_RASTER[item.type] ? (
              <img
                src={UNIT_REFERENCE_RASTER[item.type]}
                alt=""
                className={`${UNIT_REFERENCE_RASTER_CLASS[item.type]} shrink-0 object-contain`}
              />
            ) : (
              <svg
                viewBox={UNIT_REFERENCE_VIEWBOX[item.type]}
                aria-hidden="true"
                className="h-6 w-6 shrink-0 text-ink"
                style={{ '--unit-detail': '#f5edd6' } as CSSProperties}
              >
                <use href={`#${unitSilhouetteId(item.type)}`} />
              </svg>
            )}
            <span className="font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
