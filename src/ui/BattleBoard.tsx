import { useEffect, useRef, useState } from 'react';
import type { GameState, Pos, Scenario, TerrainKind, Unit, VictoryCondition } from '../engine/types';
import { posEq, posKey } from '../engine/types';
import { chebyshev } from '../engine/grid';
import { legalMoves } from '../engine/movement';
import { isOnActiveSide, sameTeam } from '../engine/sides';
import { unitSilhouetteId } from '../art/unit-silhouettes';

interface ObjectiveMarker { pos: Pos; kind: 'capture' | 'hold'; met: boolean; }

// Flatten the victory tree (handles all-of) into a list of tile-based French objectives.
function frenchObjectiveTiles(state: GameState, conds: VictoryCondition[]): ObjectiveMarker[] {
  const out: ObjectiveMarker[] = [];
  const walk = (c: VictoryCondition) => {
    if (c.for !== 'french') return;
    if (c.kind === 'capture-tile') {
      const pos = c.args.pos as Pos;
      const met = state.units.some(u => u.side === 'french' && posEq(u.position, pos));
      out.push({ pos, kind: 'capture', met });
    } else if (c.kind === 'hold-tile-for-turns') {
      const pos = c.args.pos as Pos;
      const turns = c.args.turns as number;
      const standing = state.units.some(u => u.side === 'french' && posEq(u.position, pos));
      out.push({ pos, kind: 'hold', met: standing && state.turn > turns });
    } else if (c.kind === 'all-of') {
      const subs = c.args.conditions as VictoryCondition[];
      for (const s of subs) walk(s);
    }
  };
  for (const c of conds) walk(c);
  return out;
}

const TERRAIN_FILL: Record<string, string> = {
  plain: '#e8dfc3', forest: '#6b8a4a', hill: '#c4a878',
  town: '#a08868', river: '#5a7a9a', bridge: '#caa770',
  marsh: '#7a8a5a', road: '#d8c89a',
};

const SIDE_FILL: Record<Unit['side'], string> = {
  french: '#2c5aa0', austrian: '#ece4d0', russian: '#4a7a4a',
};
const SIDE_TEXT: Record<Unit['side'], string> = {
  french: '#ffffff', austrian: '#2a2018', russian: '#ffffff',
};

const TYPE_BADGE: Record<Unit['type'], { code: string; bg: string; fg: string }> = {
  'line-infantry':   { code: 'LI', bg: '#5a4a30', fg: '#f5f0e6' },
  'light-infantry':  { code: 'Li', bg: '#7a6a40', fg: '#f5f0e6' },
  'grenadier':       { code: 'Gr', bg: '#3a2a10', fg: '#f5f0e6' },
  'light-cavalry':   { code: 'LC', bg: '#a04040', fg: '#f5f0e6' },
  'heavy-cavalry':   { code: 'HC', bg: '#702020', fg: '#f5f0e6' },
  'foot-artillery':  { code: 'FA', bg: '#2a3a5a', fg: '#f5f0e6' },
  'horse-artillery': { code: 'HA', bg: '#1a2a4a', fg: '#f5f0e6' },
};

const TERRAIN_INFO: Record<TerrainKind, { name: string; effect: string }> = {
  plain:  { name: 'Plain',  effect: 'No bonus' },
  forest: { name: 'Forest', effect: '+1 defence · doubles move cost' },
  hill:   { name: 'Hill',   effect: '+1 defence' },
  town:   { name: 'Town',   effect: '+1 defence' },
  river:  { name: 'River',  effect: 'Impassable except at bridges' },
  bridge: { name: 'Bridge', effect: 'Crossable; no defence bonus' },
  marsh:  { name: 'Marsh',  effect: 'Triple move cost' },
  road:   { name: 'Road',   effect: 'Faster movement' },
};

function facingTriangle(f: 'N' | 'E' | 'S' | 'W', size: number): string {
  const m = size / 2; const t = 4;
  switch (f) {
    case 'N': return `${m - t},0 ${m + t},0 ${m},${-t}`;
    case 'E': return `${size},${m - t} ${size},${m + t} ${size + t},${m}`;
    case 'S': return `${m - t},${size} ${m + t},${size} ${m},${size + t}`;
    case 'W': return `0,${m - t} 0,${m + t} ${-t},${m}`;
  }
}

export interface BattleBoardProps {
  scenario: Scenario;
  state: GameState;
  selectedUnitId: string | null;
  hoveredEnemyId: string | null;
  showDetails?: boolean;
  highlightUnitIds?: string[];
  onSelectUnit: (id: string | null) => void;
  onMoveTo: (to: Pos) => void;
  onAttack: (defenderId: string) => void;
  onHoverEnemy: (id: string | null) => void;
}

interface CombatEffect {
  id: number;
  kind: 'damage' | 'eliminated' | 'morale-reveal';
  pos: Pos;
  /** Damage: loss amount. Morale-reveal: morale 1-3. */
  detail?: number;
}

export function BattleBoard(p: BattleBoardProps) {
  const { scenario, state, selectedUnitId, hoveredEnemyId } = p;
  const cellSize = 48;
  const w = scenario.grid.width * cellSize;
  const h = scenario.grid.height * cellSize;

  const [tooltipPos, setTooltipPos] = useState<Pos | null>(null);

  // Combat-feedback effects: diff state.units vs previous frame, render
  // ephemeral overlays for damage / elimination / morale-reveal.
  const prevUnitsRef = useRef(state.units);
  const fxIdRef = useRef(0);
  const [effects, setEffects] = useState<CombatEffect[]>([]);

  useEffect(() => {
    const prev = prevUnitsRef.current;
    if (prev === state.units) return;
    const newFx: CombatEffect[] = [];

    for (const u of state.units) {
      const prevU = prev.find(p => p.id === u.id);
      if (!prevU) continue;
      // Strength loss → damage flash + loss marker
      if (prevU.strength > u.strength) {
        newFx.push({
          id: ++fxIdRef.current,
          kind: 'damage', pos: u.position,
          detail: prevU.strength - u.strength,
        });
      }
      // Morale newly revealed
      if (!prevU.moraleRevealed && u.moraleRevealed) {
        newFx.push({
          id: ++fxIdRef.current,
          kind: 'morale-reveal', pos: u.position, detail: u.morale,
        });
      }
    }
    // Eliminated → render at last-known position
    for (const prevU of prev) {
      if (!state.units.find(u => u.id === prevU.id)) {
        newFx.push({
          id: ++fxIdRef.current,
          kind: 'eliminated', pos: prevU.position,
        });
      }
    }

    if (newFx.length > 0) {
      setEffects(cur => [...cur, ...newFx]);
      // Auto-prune after the longest animation duration finishes.
      const ids = new Set(newFx.map(f => f.id));
      setTimeout(() => {
        setEffects(cur => cur.filter(f => !ids.has(f.id)));
      }, 1500);
    }
    prevUnitsRef.current = state.units;
  }, [state.units]);

  const selected = selectedUnitId
    ? state.units.find(u => u.id === selectedUnitId) ?? null
    : null;

  const canAct = (side: Unit['side']) => isOnActiveSide(side, state.currentSide);

  const moves = selected && canAct(selected.side) && !selected.hasMoved
    ? legalMoves(selected, state.units, scenario)
    : [];
  const moveSet = new Set(moves.map(posKey));

  // Only treat enemies as "attackable" when the selected unit can actually
  // attack this turn AND the target is on the opposing team. Coalition
  // partners (austrian + russian) count as same team.
  const adjacentEnemies = selected && canAct(selected.side) && !selected.hasActed
    ? state.units.filter(u =>
        !sameTeam(u.side, selected.side) &&
        chebyshev(u.position, selected.position) === 1)
    : [];
  const enemySet = new Set(adjacentEnemies.map(u => u.id));

  const objectives = frenchObjectiveTiles(state, scenario.victory);

  return (
    <div className="w-full mx-auto" style={{ maxWidth: 'min(100%, 80vh)' }}>
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto bg-parchmentDark border border-ink/40">
      <defs>
        {/* Terrain patterns. Each renders the base colour plus a small motif
            that tiles every 8–12 user-units. 'plain' has no pattern — kept as
            a flat fill so units stand out cleanly. */}
        <pattern id="terrain-forest" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="#6b8a4a"/>
          <circle cx="2.5" cy="3" r="1.6" fill="#3d5a2a"/>
          <circle cx="7" cy="7" r="1.4" fill="#3d5a2a"/>
        </pattern>
        <pattern id="terrain-hill" patternUnits="userSpaceOnUse" width="14" height="7">
          <rect width="14" height="7" fill="#c4a878"/>
          <path d="M 0 4.5 Q 7 2 14 4.5" stroke="#8a6a40" strokeWidth="0.8" fill="none"/>
          <path d="M 0 7   Q 7 4.5 14 7"  stroke="#8a6a40" strokeWidth="0.6" fill="none" opacity="0.6"/>
        </pattern>
        <pattern id="terrain-town" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="#a08868"/>
          <rect x="1.2" y="3.5" width="2.6" height="3.5" fill="#5a4830"/>
          <polygon points="1.2,3.5 2.5,2.2 3.8,3.5" fill="#5a4830"/>
          <rect x="5.5" y="2.5" width="2.4" height="4.5" fill="#5a4830"/>
          <polygon points="5.5,2.5 6.7,1.4 7.9,2.5" fill="#5a4830"/>
        </pattern>
        <pattern id="terrain-river" patternUnits="userSpaceOnUse" width="14" height="7">
          <rect width="14" height="7" fill="#5a7a9a"/>
          <path d="M 0 3.5 Q 3.5 1.5 7 3.5 T 14 3.5" stroke="#a8c0d8" strokeWidth="0.7" fill="none"/>
          <path d="M 0 6   Q 3.5 4 7 6     T 14 6"   stroke="#a8c0d8" strokeWidth="0.5" fill="none" opacity="0.7"/>
        </pattern>
        <pattern id="terrain-bridge" patternUnits="userSpaceOnUse" width="6" height="6">
          <rect width="6" height="6" fill="#caa770"/>
          <line x1="1.5" y1="0" x2="1.5" y2="6" stroke="#7a5a30" strokeWidth="0.7"/>
          <line x1="3"   y1="0" x2="3"   y2="6" stroke="#7a5a30" strokeWidth="0.7"/>
          <line x1="4.5" y1="0" x2="4.5" y2="6" stroke="#7a5a30" strokeWidth="0.7"/>
        </pattern>
        <pattern id="terrain-marsh" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#7a8a5a"/>
          <circle cx="2"   cy="2"   r="0.7" fill="#4a5a30"/>
          <circle cx="6"   cy="3.5" r="0.5" fill="#4a5a30"/>
          <circle cx="3.5" cy="6"   r="0.6" fill="#4a5a30"/>
          <circle cx="7"   cy="7"   r="0.4" fill="#4a5a30"/>
        </pattern>
        <pattern id="terrain-road" patternUnits="userSpaceOnUse" width="12" height="12">
          <rect width="12" height="12" fill="#d8c89a"/>
          <line x1="6" y1="0" x2="6" y2="12" stroke="#9a8050" strokeWidth="0.7" strokeDasharray="2.5 2.5"/>
        </pattern>
      </defs>
      {/* Tiles */}
      {Array.from({ length: scenario.grid.height }, (_, y) =>
        Array.from({ length: scenario.grid.width }, (_, x) => {
          const ter = scenario.tiles.find(t => posEq(t.pos, { x, y }))?.terrain ?? 'plain';
          const isMove = moveSet.has(posKey({ x, y }));
          const fill = isMove
            ? '#b8d8b8'
            : ter === 'plain' ? TERRAIN_FILL.plain : `url(#terrain-${ter})`;
          return (
            <rect
              key={`${x},${y}`}
              x={x * cellSize} y={y * cellSize}
              width={cellSize} height={cellSize}
              fill={fill}
              stroke="#8a7a5a" strokeWidth={0.5}
              onClick={() => {
                if (selected && isMove) { p.onMoveTo({ x, y }); setTooltipPos(null); }
                else if (selected) { p.onSelectUnit(null); setTooltipPos(null); }
                else setTooltipPos(prev => prev && prev.x === x && prev.y === y ? null : { x, y });
              }}
              onMouseEnter={() => setTooltipPos({ x, y })}
              onMouseLeave={() => setTooltipPos(prev => prev && prev.x === x && prev.y === y ? null : prev)}
              style={{ cursor: isMove ? 'pointer' : 'default' }}
            />
          );
        })
      )}

      {/* French objective markers — drawn between tiles and units so units sit on top */}
      {objectives.map((o, idx) => {
        const cx = o.pos.x * cellSize + cellSize / 2;
        const cy = o.pos.y * cellSize + cellSize / 2;
        const fillColor = o.met ? '#3a8a3a' : '#d4a017';
        const strokeColor = o.met ? '#1f4a1f' : '#7a5a08';
        return (
          <g key={`obj-${idx}`} pointerEvents="none" className={o.met ? '' : 'animate-objective'}>
            {/* Outer ring — laurel-style */}
            <circle cx={cx} cy={cy} r={cellSize * 0.42}
                    fill="none" stroke={strokeColor} strokeWidth={1.5}
                    strokeDasharray="3 3" opacity={0.85} />
            {/* Flag pole + flag */}
            <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 8}
                  stroke={strokeColor} strokeWidth={1.5} />
            <polygon
              points={`${cx},${cy - 14} ${cx + 12},${cy - 10} ${cx},${cy - 6}`}
              fill={fillColor} stroke={strokeColor} strokeWidth={0.8}
            />
            {/* Tick when met */}
            {o.met && (
              <text x={cx} y={cy + 5} textAnchor="middle"
                    fontSize="13" fontWeight="700" fill="#1f4a1f">
                ✓
              </text>
            )}
          </g>
        );
      })}

      {/* Units */}
      {state.units.map(u => {
        const cx = u.position.x * cellSize;
        const cy = u.position.y * cellSize;
        const isSelected = u.id === selectedUnitId;
        const isHighlighted = !!p.highlightUnitIds?.includes(u.id);
        const isAttackable = enemySet.has(u.id);
        const isSpent = canAct(u.side) && u.hasActed === true && u.hasMoved === true;
        const isReady = canAct(u.side) && !isSpent;   // active side, still has actions
        const onClick = () => {
          if (!isAttackable) { p.onSelectUnit(u.id); return; }
          if (hoveredEnemyId === u.id) p.onAttack(u.id);
          else p.onHoverEnemy(u.id);
        };
        return (
          <g
            key={u.id}
            transform={`translate(${cx + 4}, ${cy + 4})`}
            onClick={onClick}
            onMouseEnter={() => {
              setTooltipPos(u.position);
              if (!canAct(u.side)) p.onHoverEnemy(u.id);
            }}
            onMouseLeave={() => {
              setTooltipPos(prev => prev && prev.x === u.position.x && prev.y === u.position.y ? null : prev);
              p.onHoverEnemy(null);
            }}
            style={{ cursor: 'pointer', opacity: isSpent ? 0.45 : 1 }}
          >
            {isAttackable && (
              <rect width={cellSize - 8} height={cellSize - 8} rx="3"
                fill="#d8a8a8" stroke="#a04040" strokeWidth={2} />
            )}
            <rect
              width={cellSize - 8} height={cellSize - 8}
              rx="3"
              fill={SIDE_FILL[u.side]}
              stroke={
                isSelected || isHighlighted ? '#d4a017'        // gold — selected / highlighted
                : isReady                    ? '#3a8a3a'        // green — active side, can still act
                                             : 'rgba(0,0,0,0.3)'
              }
              strokeWidth={isSelected || isHighlighted ? 3 : isReady ? 2.4 : 1.2}
            />
            <g transform={`translate(${(cellSize - 8) * 0.1}, ${(cellSize - 8) * 0.1}) scale(${(cellSize - 8) * 0.032})`}
               style={{ color: SIDE_TEXT[u.side] }}>
              <use href={`#${unitSilhouetteId(u.type)}`} width={24} height={24} />
            </g>
            {/* Unit-type badge — top-left, always visible */}
            <rect x={2} y={2} width={16} height={11}
                  fill={TYPE_BADGE[u.type].bg} stroke="#1a120a" strokeWidth={0.6} rx="2" />
            <text x={10} y={10.5} textAnchor="middle"
                  fontSize="8" fontWeight="700" fill={TYPE_BADGE[u.type].fg}>
              {TYPE_BADGE[u.type].code}
            </text>
            {/* Strength badge — bottom-right */}
            <rect x={cellSize - 22} y={cellSize - 22} width={14} height={12}
                  fill="#d4a017" stroke="#2a2018" strokeWidth={0.6} rx="2" />
            <text x={cellSize - 15} y={cellSize - 13} textAnchor="middle"
                  fontSize="9" fontWeight="700" fill="#2a2018">
              {u.strength}
            </text>
            {/* Morale stars — top-right corner. Always shown for your own
                units; hidden for enemies until first attack. */}
            {(u.moraleRevealed || u.side === 'french') && (
              <text
                x={cellSize - 11} y={11}
                textAnchor="end"
                fontSize="9" fontWeight="700"
                fill="#d4a017"
                stroke="#1a120a" strokeWidth={0.4}
                paintOrder="stroke"
              >
                {'★'.repeat(u.morale)}
              </text>
            )}
            {p.showDetails && (
              <>
                {/* Formation glyph */}
                <text x={4} y={cellSize - 12} fontSize="11" fontWeight="700" fill={SIDE_TEXT[u.side]}>
                  {u.formation === 'line' ? '—' : u.formation === 'column' ? '⋮' : '▢'}
                </text>
                {/* Facing triangle on the front edge */}
                <polygon
                  points={facingTriangle(u.facing, cellSize - 8)}
                  fill={SIDE_TEXT[u.side]} opacity={0.7}
                />
              </>
            )}
          </g>
        );
      })}

      {/* Combat feedback overlays — damage flash, loss markers, eliminations, morale reveals */}
      {effects.map(fx => {
        const cx = fx.pos.x * cellSize;
        const cy = fx.pos.y * cellSize;
        const centerX = cx + cellSize / 2;
        const centerY = cy + cellSize / 2;
        if (fx.kind === 'damage') {
          return (
            <g key={fx.id} pointerEvents="none">
              {/* Red flash on the cell */}
              <rect
                x={cx + 2} y={cy + 2}
                width={cellSize - 4} height={cellSize - 4}
                rx={3}
                fill="#c03020" opacity={0.55}
                className="animate-damage-flash"
              />
              {/* Floating loss marker */}
              <text
                x={centerX} y={cy + 18}
                textAnchor="middle"
                fontSize="14" fontWeight="900"
                fill="#a01010" stroke="#fff" strokeWidth={1.2} paintOrder="stroke"
                className="animate-float-up"
              >
                −{fx.detail}
              </text>
            </g>
          );
        }
        if (fx.kind === 'eliminated') {
          return (
            <g key={fx.id} pointerEvents="none" className="animate-eliminate">
              <rect
                x={cx + 4} y={cy + 4}
                width={cellSize - 8} height={cellSize - 8}
                rx={3}
                fill="#1a120a" opacity={0.9}
                stroke="#a01010" strokeWidth={2}
              />
              <text
                x={centerX} y={centerY + 5}
                textAnchor="middle"
                fontSize="20" fontWeight="900" fill="#a01010"
              >
                ✕
              </text>
            </g>
          );
        }
        // morale-reveal
        return (
          <g key={fx.id} pointerEvents="none" className="animate-morale-reveal">
            <text
              x={centerX} y={cy - 4}
              textAnchor="middle"
              fontSize="14" fontWeight="900"
              fill="#d4a017" stroke="#1a120a" strokeWidth={1.2} paintOrder="stroke"
            >
              {'★'.repeat(fx.detail ?? 1)}
            </text>
          </g>
        );
      })}

      {/* Tile + unit tooltip */}
      {tooltipPos && (() => {
        const ter = scenario.tiles.find(t => posEq(t.pos, tooltipPos))?.terrain ?? 'plain';
        const info = TERRAIN_INFO[ter];
        const occupant = state.units.find(u => posEq(u.position, tooltipPos));
        const tipW = 180;
        const tipH = occupant ? 84 : 40;
        const placeAbove = tooltipPos.y > 0;
        const tx = Math.min(Math.max(tooltipPos.x * cellSize + cellSize / 2 - tipW / 2, 2), w - tipW - 2);
        const ty = placeAbove
          ? tooltipPos.y * cellSize - tipH - 4
          : tooltipPos.y * cellSize + cellSize + 4;
        // Own (French) morale is always shown; enemy morale stays '?' until probed.
        const moraleStr = occupant
          ? ((occupant.moraleRevealed || occupant.side === 'french')
              ? '★'.repeat(occupant.morale) : '?')
          : '';
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={tipW} height={tipH} rx={4}
                  fill="#2a2018" stroke="#d4a017" strokeWidth={1} opacity={0.95} />
            <text x={tx + 8} y={ty + 14} fontSize="11" fontWeight="700" fill="#f5f0e6">
              {info.name}
            </text>
            <text x={tx + 8} y={ty + 28} fontSize="9" fill="#f5f0e6" opacity={0.85}>
              {info.effect}
            </text>
            {occupant && (
              <>
                <line x1={tx + 6} y1={ty + 36} x2={tx + tipW - 6} y2={ty + 36} stroke="#d4a017" strokeWidth={0.5} opacity={0.6} />
                <text x={tx + 8} y={ty + 50} fontSize="10" fontWeight="700" fill="#d4a017">
                  {occupant.name ?? occupant.id} ({occupant.side})
                </text>
                <text x={tx + 8} y={ty + 64} fontSize="9" fill="#f5f0e6">
                  {TYPE_BADGE[occupant.type].code} · {occupant.formation} · {occupant.facing}
                </text>
                <text x={tx + 8} y={ty + 78} fontSize="9" fill="#f5f0e6">
                  Strength {occupant.strength}/4 · Morale {moraleStr}
                </text>
              </>
            )}
          </g>
        );
      })()}
    </svg>
    </div>
  );
}
