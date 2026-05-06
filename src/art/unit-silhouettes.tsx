import type { UnitType } from '../engine/types';

export function UnitSpriteDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {/* Infantry — parade-stance soldier with shako and upright musket */}
        <symbol id="silh-line-infantry" viewBox="0 0 24 24">
          <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.3 2 H14.3 V5.3 H8.3 Z" strokeWidth="0" />
            <path d="M7.2 5.3 H15.4" strokeWidth="1.2" />
            <circle cx="11.4" cy="7" r="1.35" strokeWidth="0" />
            <path d="M8.6 8.4 H14.2 L15.2 15.8 H7.7 Z" strokeWidth="0" />
            <path d="M8.5 9.8 L6.9 14.2 M14.5 9.7 L16.7 12.6" strokeWidth="1.38" fill="none" />
            <path d="M10 15.4 L9.4 21 M13.1 15.4 L13.9 21" strokeWidth="1.85" fill="none" />
            <path d="M17.5 3.5 V20.5" strokeWidth="1.2" fill="none" />
            <path d="M17.5 3.5 L19.2 2.1" strokeWidth="0.85" fill="none" />
            <path d="M9.8 10.2 L13.9 14.8 M13.8 10.2 L9.5 14.9" stroke="var(--unit-detail, transparent)" strokeWidth="0.72" fill="none" opacity="0.75" />
            <path d="M3.1 21.3 H10.9 M12.7 21.3 H16.2" strokeWidth="1.35" fill="none" />
          </g>
        </symbol>

        {/* Light infantry — forward skirmisher with shouldered musket */}
        <symbol id="silh-light-infantry" viewBox="0 0 24 24">
          <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.6 3 H13.7 L13.1 5.6 H8.9 Z" strokeWidth="0" />
            <path d="M7.5 5.6 H14.3" strokeWidth="1" />
            <circle cx="11.1" cy="7.1" r="1.2" strokeWidth="0" />
            <path d="M8.3 8.4 H12.9 L14.8 13.6 L12.7 16.2 H7.5 L8.9 11.2 Z" strokeWidth="0" />
            <path d="M8.4 15.8 L5.7 20.9 M12.6 15.6 L16.9 20.8" strokeWidth="1.65" fill="none" />
            <path d="M8.4 9.8 L5.6 12.1 M13.7 9.5 L16.6 10.8" strokeWidth="1.18" fill="none" />
            <path d="M15.9 5.5 L20.3 18.8" strokeWidth="1.03" fill="none" />
            <path d="M15.9 5.5 L16.8 4.2" strokeWidth="0.7" fill="none" />
            <path d="M9.2 10 L13.3 14.5" stroke="var(--unit-detail, transparent)" strokeWidth="0.65" fill="none" opacity="0.72" />
            <path d="M3.4 21.2 H8.3 M14.9 21.2 H19" strokeWidth="1.2" fill="none" />
          </g>
        </symbol>

        {/* Grenadier — broader figure with bearskin cap */}
        <symbol id="silh-grenadier" viewBox="0 0 24 24">
          <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.1 4.7 C8.1 1.9 9.7 0.5 12 0.5 C14.3 0.5 15.9 1.9 15.9 4.7 V6.9 H8.1 Z" strokeWidth="0" />
            <circle cx="12" cy="8.3" r="1.34" strokeWidth="0" />
            <path d="M8.5 9.6 H15.5 L16.5 16.4 H7.5 Z" strokeWidth="0" />
            <path d="M10.3 16.1 V21 M13.8 16.1 V21" strokeWidth="1.9" fill="none" />
            <path d="M8.3 10.7 L6.4 13.8 M15.8 10.6 L17.9 12.9" strokeWidth="1.25" fill="none" />
            <path d="M18.2 4.4 V20.2" strokeWidth="1.15" fill="none" />
            <path d="M18.2 4.4 L19.6 2.9" strokeWidth="0.75" fill="none" />
            <path d="M9.5 10.2 L14.8 15.1 M14.6 10.2 L9.3 15.1" stroke="var(--unit-detail, transparent)" strokeWidth="0.72" fill="none" opacity="0.75" />
            <path d="M3.1 21.3 H11.2 M13 21.3 H16.8" strokeWidth="1.25" fill="none" />
          </g>
        </symbol>

        {/* Light cavalry — compact counter-scale horse and upright rider */}
        <symbol id="silh-light-cavalry" viewBox="0 0 64 44">
          <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.4 28.8 C11.4 21.2 22.2 17.6 36 18.3 C44.6 18.7 51.9 21.8 55.4 27.8 C47.9 33.5 26.8 35.1 10.4 31.9 C8.3 31.5 7.2 30.5 7.4 28.8 Z" strokeWidth="0" />
            <path d="M52.4 22.8 C54.6 16.7 59.9 14.6 62.8 17.8 C65.3 20.5 63.1 24.4 58.3 25.6 L55.5 30.9 L51.2 29 Z" strokeWidth="0" />
            <path d="M55.1 19.7 L61.4 18" strokeWidth="1.55" fill="none" />
            <path d="M7.9 28.2 C4.5 27.1 2.1 24.7 1.4 21.9" strokeWidth="3" fill="none" />
            <path d="M15.4 31.6 L10.1 42.1 M25.8 32.6 L21.6 42.2 M43 31.3 L46.4 42.2 M51.8 29.8 L58.7 41.8" strokeWidth="3.35" fill="none" />
            <path d="M26.8 9.4 C29.5 7.5 36.2 7.2 40.3 9.2 L43.1 21.2 H26 Z" strokeWidth="0" />
            <circle cx="34" cy="6" r="3.35" strokeWidth="0" />
            <path d="M30.2 3.9 C33 2.4 37.7 2.6 40.9 4.4" strokeWidth="1.65" fill="none" />
            <path d="M40.9 13.3 L49 18.6" strokeWidth="2.35" fill="none" />
            <path d="M52.6 2.5 C49 7.9 47.1 13.5 46.8 19.5" strokeWidth="2" fill="none" />
            <path d="M16.7 22.9 C27.3 25.5 40.4 25.5 52.8 22.7" stroke="var(--unit-detail, transparent)" strokeWidth="1.35" fill="none" opacity="0.78" />
            <path d="M31.8 9.4 L35.4 20.7 M27.7 18.3 C31.4 21.7 36.9 22.4 42.4 21.2" stroke="var(--unit-detail, transparent)" strokeWidth="0.95" fill="none" opacity="0.78" />
            <path d="M9.2 42.5 H24.6 M44.5 42.5 H59.8" strokeWidth="2.1" fill="none" />
          </g>
        </symbol>

        {/* Heavy cavalry — heavier mount and cuirassier-style rider */}
        <symbol id="silh-heavy-cavalry" viewBox="0 0 64 44">
          <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.1 29.8 C9.8 20.6 22.1 16.2 37.8 17 C47.8 17.6 55.4 21.5 58.2 28.8 C49.7 35.3 25.3 36.1 9.4 32.5 C7 32 5.8 31 6.1 29.8 Z" strokeWidth="0" />
            <path d="M53.8 22 C56.8 14.9 61.6 14.2 63.5 18 C65 21.1 61.8 24.6 57.3 25.4 L55.9 31.1 L51.8 28.8 Z" strokeWidth="0" />
            <path d="M56.4 18.7 L62.1 17.5" strokeWidth="1.8" fill="none" />
            <path d="M7 29 C4.3 27.4 2.7 24.8 1.8 21.4" strokeWidth="3.6" fill="none" />
            <path d="M15 32 L9.4 42.3 M27.1 32.8 L22.1 42.5 M43.8 31.4 L47.9 42.2 M54 30 L60.7 42.2" strokeWidth="3.85" fill="none" />
            <path d="M27 7.8 C30.2 5.5 37.4 5.4 41.6 7.8 L45.2 21.8 H25.1 Z" strokeWidth="0" />
            <circle cx="35" cy="4.9" r="3.95" strokeWidth="0" />
            <path d="M30.7 2.8 C34.2 0.6 39.6 0.8 43.1 3.3" strokeWidth="1.9" fill="none" />
            <path d="M36.7 1.8 V0.4" strokeWidth="1.8" fill="none" />
            <path d="M42.6 12.5 L51.2 18" strokeWidth="2.65" fill="none" />
            <path d="M52.5 2.2 C49.6 8.1 48.1 13.8 48.4 19.5" strokeWidth="2.35" fill="none" />
            <path d="M15.8 22.5 C29.1 25.8 43 25.3 55.4 22" stroke="var(--unit-detail, transparent)" strokeWidth="1.35" fill="none" opacity="0.78" />
            <path d="M32.4 8.5 L36.2 21.1 M27.1 18 C31.2 21.7 37.4 22.5 44.1 21" stroke="var(--unit-detail, transparent)" strokeWidth="0.95" fill="none" opacity="0.78" />
            <path d="M8.5 42.6 H25 M46.2 42.6 H61.9" strokeWidth="2.25" fill="none" />
          </g>
        </symbol>

        {/* Foot artillery — cannon profile with big spoked wheels */}
        <symbol id="silh-foot-artillery" viewBox="0 0 24 24">
          <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.2 10.8 H19.2 V13.8 H2.2 Z" strokeWidth="0" />
            <rect x="18.5" y="9.7" width="2.8" height="5.2" rx="0.5" strokeWidth="0" />
            <path d="M3.4 13.5 L9.5 13.5 L5.9 19.1 H0.9 Z" strokeWidth="0" />
            <circle cx="8" cy="18.7" r="4" fill="none" strokeWidth="1.55" />
            <path d="M4.3 18.7 H11.7 M8 15 V22.4 M5.3 16 L10.7 21.4 M10.7 16 L5.3 21.4" strokeWidth="0.8" />
            <circle cx="16.4" cy="18.7" r="4" fill="none" strokeWidth="1.55" />
            <path d="M12.7 18.7 H20.1 M16.4 15 V22.4 M13.8 16 L19 21.4 M19 16 L13.8 21.4" strokeWidth="0.8" />
            <path d="M3.2 22.8 H20" strokeWidth="1.05" />
          </g>
        </symbol>

        {/* Horse artillery — compact cannon with limber horse */}
        <symbol id="silh-horse-artillery" viewBox="0 0 24 24">
          <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="11.4" width="10.2" height="2.7" rx="1" strokeWidth="0" />
            <rect x="10.4" y="10.5" width="2.1" height="4.5" rx="0.4" strokeWidth="0" />
            <circle cx="4.5" cy="18.5" r="3.2" fill="none" strokeWidth="1.35" />
            <path d="M1.5 18.5 H7.5 M4.5 15.5 V21.5" strokeWidth="0.85" />
            <circle cx="9.6" cy="18.5" r="3.2" fill="none" strokeWidth="1.35" />
            <path d="M6.6 18.5 H12.6 M9.6 15.5 V21.5" strokeWidth="0.85" />
            <path d="M13.8 14.2 C14.2 12.5 15.9 11.4 18 11.4 H20.6 C21.7 11.4 22.3 12.1 22.5 13 L23.4 11.2 C23.8 10.4 23.4 9.7 22.7 9.5 C21.9 9.4 21.4 9.9 21.1 10.6 L20.5 11.5 L13.8 17 Z" strokeWidth="0" />
            <path d="M15.2 16.8 L14.4 21 M18.2 16.8 L19.2 21" strokeWidth="1.2" />
            <path d="M3.3 22.4 H20.5" strokeWidth="1.05" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export const unitSilhouetteId = (type: UnitType): string => `silh-${type}`;
