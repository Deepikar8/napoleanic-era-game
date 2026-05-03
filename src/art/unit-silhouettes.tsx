import type { UnitType } from '../engine/types';

export function UnitSpriteDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {/* Infantry — shako + musket */}
        <symbol id="silh-line-infantry" viewBox="0 0 24 24">
          <g fill="currentColor">
            <rect x="9" y="2" width="6" height="3" />
            <rect x="8" y="5" width="8" height="0.8" />
            <circle cx="12" cy="7.2" r="1.4" />
            <rect x="10.2" y="8.4" width="3.6" height="6" />
            <rect x="9.8" y="14.4" width="1.6" height="6" />
            <rect x="12.6" y="14.4" width="1.6" height="6" />
            <rect x="15.5" y="3.5" width="0.9" height="14" transform="rotate(8 16 10)" />
          </g>
        </symbol>

        {/* Light infantry — narrower hat */}
        <symbol id="silh-light-infantry" viewBox="0 0 24 24">
          <g fill="currentColor">
            <rect x="10" y="3" width="4" height="2.5" />
            <circle cx="12" cy="7.2" r="1.4" />
            <rect x="10.2" y="8.4" width="3.6" height="6" />
            <rect x="9.8" y="14.4" width="1.6" height="6" />
            <rect x="12.6" y="14.4" width="1.6" height="6" />
            <rect x="15" y="6" width="0.9" height="11" transform="rotate(20 15.5 10)" />
          </g>
        </symbol>

        {/* Grenadier — bearskin (tall hat) */}
        <symbol id="silh-grenadier" viewBox="0 0 24 24">
          <g fill="currentColor">
            <ellipse cx="12" cy="3.5" rx="3.2" ry="3.2" />
            <rect x="9" y="3.5" width="6" height="2.5" />
            <circle cx="12" cy="8" r="1.4" />
            <rect x="10.2" y="9.2" width="3.6" height="6" />
            <rect x="9.8" y="15.2" width="1.6" height="5" />
            <rect x="12.6" y="15.2" width="1.6" height="5" />
            <rect x="15.5" y="4" width="0.9" height="14" transform="rotate(8 16 10)" />
          </g>
        </symbol>

        {/* Light cavalry — tall rider on top of a horse, sabre raised */}
        <symbol id="silh-light-cavalry" viewBox="0 0 24 24">
          <g fill="currentColor">
            {/* Horse body */}
            <path d="M2 14 C 2 12, 4 11, 7 11 L 17 11 C 19 11, 20 12, 20 13 L 20 17 L 2 17 Z"/>
            {/* Horse neck + head, extending right */}
            <path d="M20 13 L 23 9 L 22 7 L 19 11 Z"/>
            {/* Four legs */}
            <rect x="3" y="17" width="1.6" height="5"/>
            <rect x="8" y="17" width="1.6" height="5"/>
            <rect x="14" y="17" width="1.6" height="5"/>
            <rect x="18" y="17" width="1.6" height="5"/>
            {/* Rider — clear vertical mass on top */}
            <rect x="9" y="3" width="3.5" height="8"/>
            <circle cx="10.7" cy="2" r="1.9"/>
            {/* Raised sabre */}
            <rect x="13" y="0" width="0.9" height="10" transform="rotate(25 13.45 5)"/>
          </g>
        </symbol>

        {/* Heavy cavalry — horse + rider with helmet plume */}
        <symbol id="silh-heavy-cavalry" viewBox="0 0 24 24">
          <g fill="currentColor">
            {/* Larger horse body */}
            <path d="M2 14 C 2 11, 5 10, 8 10 L 17 10 C 19 10, 21 12, 21 14 L 21 17 L 2 17 Z"/>
            <path d="M21 14 L 23 9 L 22 6 L 19 10 Z"/>
            <rect x="3" y="17" width="1.8" height="5"/>
            <rect x="8" y="17" width="1.8" height="5"/>
            <rect x="14" y="17" width="1.8" height="5"/>
            <rect x="18" y="17" width="1.8" height="5"/>
            {/* Rider — taller, with plume */}
            <rect x="8.5" y="2" width="4" height="8"/>
            <circle cx="10.5" cy="1" r="2"/>
            {/* Helmet plume — a clear vertical sliver above the head */}
            <rect x="10" y="-3" width="1" height="4"/>
            {/* Sabre, more upright */}
            <rect x="13.5" y="-1" width="1" height="11" transform="rotate(15 14 4.5)"/>
          </g>
        </symbol>

        {/* Foot artillery — long cannon, big spoked wheels, NO rider */}
        <symbol id="silh-foot-artillery" viewBox="0 0 24 24">
          <g fill="currentColor">
            {/* Cannon barrel — bold horizontal cylinder */}
            <rect x="2" y="10" width="17" height="3.5" rx="1.5"/>
            {/* Muzzle ring */}
            <rect x="18.5" y="9" width="2.5" height="5.5"/>
            {/* Carriage / trail */}
            <path d="M2 13.5 L 9 13.5 L 6 19 L 0 19 Z"/>
            {/* Two large wheels with cross spokes */}
            <circle cx="8" cy="19" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6"/>
            <line x1="3.8" y1="19" x2="12.2" y2="19" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8" y1="14.8" x2="8" y2="23.2" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="16" cy="19" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6"/>
            <line x1="11.8" y1="19" x2="20.2" y2="19" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="16" y1="14.8" x2="16" y2="23.2" stroke="currentColor" strokeWidth="1.2"/>
          </g>
        </symbol>

        {/* Horse artillery — smaller cannon + a horse silhouette pulling it */}
        <symbol id="silh-horse-artillery" viewBox="0 0 24 24">
          <g fill="currentColor">
            {/* Smaller cannon, left half */}
            <rect x="1" y="11" width="10" height="2.8" rx="1"/>
            <rect x="10.5" y="10" width="2" height="4.5"/>
            {/* Wheels — smaller, still spoked */}
            <circle cx="4.5" cy="18.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
            <line x1="1.3" y1="18.5" x2="7.7" y2="18.5" stroke="currentColor" strokeWidth="1"/>
            <line x1="4.5" y1="15.3" x2="4.5" y2="21.7" stroke="currentColor" strokeWidth="1"/>
            <circle cx="9.5" cy="18.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
            <line x1="6.3" y1="18.5" x2="12.7" y2="18.5" stroke="currentColor" strokeWidth="1"/>
            <line x1="9.5" y1="15.3" x2="9.5" y2="21.7" stroke="currentColor" strokeWidth="1"/>
            {/* Horse pulling on the right — small body + head */}
            <path d="M14 14 C 14 12.5, 15.5 11.5, 17.5 11.5 L 21 11.5 L 21 17 L 14 17 Z"/>
            <path d="M21 13 L 23 10 L 22 8 L 20 11 Z"/>
            <rect x="14.5" y="17" width="1.4" height="4"/>
            <rect x="18" y="17" width="1.4" height="4"/>
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export const unitSilhouetteId = (type: UnitType): string => `silh-${type}`;
