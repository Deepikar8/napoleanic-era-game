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

        {/* Light cavalry — horse + rider + sabre */}
        <symbol id="silh-light-cavalry" viewBox="0 0 32 24">
          <g fill="currentColor">
            <path d="M4 16 C 4 12, 8 10, 14 10 L 22 10 C 26 10, 28 12, 28 14 L 28 17 L 4 17 Z"/>
            <rect x="6" y="17" width="2" height="5"/>
            <rect x="11" y="17" width="2" height="5"/>
            <rect x="20" y="17" width="2" height="5"/>
            <rect x="25" y="17" width="2" height="5"/>
            <path d="M28 14 L 31 11 L 30 8 L 27 11 Z"/>
            <rect x="14" y="4" width="3.5" height="6"/>
            <circle cx="15.7" cy="3" r="1.6"/>
            <rect x="18" y="1" width="0.8" height="9" transform="rotate(20 18.4 5)"/>
          </g>
        </symbol>

        {/* Heavy cavalry — bigger horse, more upright rider */}
        <symbol id="silh-heavy-cavalry" viewBox="0 0 32 24">
          <g fill="currentColor">
            <path d="M3 17 C 3 12, 8 9, 15 9 L 23 9 C 27 9, 29 12, 29 15 L 29 18 L 3 18 Z"/>
            <rect x="5" y="18" width="2.5" height="5"/>
            <rect x="11" y="18" width="2.5" height="5"/>
            <rect x="20" y="18" width="2.5" height="5"/>
            <rect x="26" y="18" width="2.5" height="5"/>
            <path d="M29 15 L 31 11 L 30 7 L 27 11 Z"/>
            <rect x="14" y="2" width="4" height="7"/>
            <circle cx="16" cy="1.5" r="1.8"/>
            <ellipse cx="16" cy="0.5" rx="3" ry="1.2"/>
            <rect x="18.5" y="0" width="1" height="9" transform="rotate(15 19 4.5)"/>
          </g>
        </symbol>

        {/* Foot artillery — cannon on wheels */}
        <symbol id="silh-foot-artillery" viewBox="0 0 32 24">
          <g fill="currentColor">
            <rect x="6" y="9" width="20" height="4" rx="0.6"/>
            <path d="M8 13 L 24 13 L 22 18 L 10 18 Z"/>
            <circle cx="11" cy="19" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="21" cy="19" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          </g>
        </symbol>

        {/* Horse artillery — same cannon, smaller/lighter look */}
        <symbol id="silh-horse-artillery" viewBox="0 0 32 24">
          <g fill="currentColor">
            <rect x="8" y="10" width="16" height="3.2" rx="0.5"/>
            <path d="M10 13.2 L 22 13.2 L 20.5 17 L 11.5 17 Z"/>
            <circle cx="12" cy="18" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="22" cy="18" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export const unitSilhouetteId = (type: string): string => `silh-${type}`;
