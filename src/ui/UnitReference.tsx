import type { CSSProperties } from 'react';
import type { UnitType } from '../engine/types';
import { unitSilhouetteId } from '../art/unit-silhouettes';
import {
  getUnitRasterIcon,
  UNIT_REFERENCE_RASTER_CLASS,
  UNIT_REFERENCE_VIEWBOX,
} from '../art/unit-art';
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

export function UnitReference() {
  return (
    <Panel title="Unit reference">
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {UNIT_REFERENCE.map(item => {
          const rasterIcon = getUnitRasterIcon(item.type, 'austrian');
          return (
            <div key={item.type} className="flex items-center gap-2">
              <span className="w-7 rounded bg-ink text-parchment text-center font-bold leading-6">
                {item.code}
              </span>
              {rasterIcon ? (
                <img
                  src={rasterIcon}
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
          );
        })}
      </div>
    </Panel>
  );
}
