import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameState, Pos, Scenario, TerrainKind, Unit, VictoryCondition } from '../engine/types';
import { posEq, posKey } from '../engine/types';
import { legalMoves } from '../engine/movement';
import { canAttackUnit } from '../engine/attack-range';
import { isOnActiveSide, isOnPlayerTeam, sameTeam } from '../engine/sides';
import { unitSilhouetteId } from '../art/unit-silhouettes';
import { getCampaignBoardSkin } from '../art/campaign-skins';
import { getUnitRasterIcon, UNIT_COUNTER_ICON_LAYOUT } from '../art/unit-art';
import { isInCommand } from '../engine/command';

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

const TERRAIN_PATTERN: Record<TerrainKind, string> = {
  plain: 'url(#terrain-plain)',
  forest: 'url(#terrain-forest)',
  hill: 'url(#terrain-hill)',
  town: 'url(#terrain-town)',
  river: 'url(#terrain-river)',
  bridge: 'url(#terrain-bridge)',
  marsh: 'url(#terrain-marsh)',
  road: 'url(#terrain-road)',
};

const COUNTER_FILL: Record<Unit['side'], string> = {
  french: 'url(#counter-french)',
  austrian: 'url(#counter-austrian)',
  russian: 'url(#counter-russian)',
  spanish: 'url(#counter-spanish)',
  british: 'url(#counter-british)',
  portuguese: 'url(#counter-portuguese)',
};
const SIDE_TEXT: Record<Unit['side'], string> = {
  french: '#ffffff',
  austrian: '#2a2018',
  russian: '#ffffff',
  spanish: '#2a2018',
  british: '#ffffff',
  portuguese: '#ffffff',
};
const SIDE_ICON_DETAIL: Record<Unit['side'], string> = {
  french: '#2f5f9f',
  austrian: '#f5edd6',
  russian: '#365f3d',
  spanish: '#f5edd6',
  british: '#8f2b1e',
  portuguese: '#315f42',
};

const TYPE_CODE: Record<Unit['type'], string> = {
  'line-infantry': 'LI',
  'light-infantry': 'Li',
  'grenadier': 'Gr',
  'light-cavalry': 'LC',
  'heavy-cavalry': 'HC',
  'foot-artillery': 'FA',
  'horse-artillery': 'HA',
};

const FORMATION_ICON_PATH: Record<Unit['formation'], string> = {
  line: 'M1.4 6.5 H4.8',
  column: 'M3.1 2.7 V10.3',
  square: 'M1.2 3.6 H5 V9.4 H1.2 Z',
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
  kind: 'damage' | 'eliminated' | 'morale-reveal' | 'cohesion';
  pos: Pos;
  /** Damage: loss amount. Morale-reveal: morale 1-3. Cohesion: delta. */
  detail?: number;
}

export function BattleBoard(p: BattleBoardProps) {
  const { scenario, state, selectedUnitId, hoveredEnemyId } = p;
  const cellSize = 48;
  const w = scenario.grid.width * cellSize;
  const h = scenario.grid.height * cellSize;
  const skin = getCampaignBoardSkin(state.campaignId);
  const terrainTextureEntries = Object.entries(skin.terrainTextures) as Array<[TerrainKind, string]>;

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
      if ((prevU.cohesion ?? 0) !== (u.cohesion ?? 0)) {
        newFx.push({
          id: ++fxIdRef.current,
          kind: 'cohesion', pos: u.position,
          detail: (u.cohesion ?? 0) - (prevU.cohesion ?? 0),
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
      // Auto-prune after the longest animation duration finishes. We don't
      // clear this in cleanup: doing so would cancel the prune if state.units
      // changes again within 1500ms, leaving effects stuck in state forever.
      // Modern React doesn't warn about setState in late timers, and a
      // setEffects() on an unmounted component is a no-op.
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

  // Keyboard navigation. Default cursor at the first own-side unit;
  // arrow keys move it; Enter/Space activates whatever is on the tile.
  const firstOwnUnit = state.units.find(u => canAct(u.side));
  const [cursor, setCursor] = useState<Pos>(
    firstOwnUnit ? firstOwnUnit.position : { x: 0, y: 0 },
  );
  const [svgFocused, setSvgFocused] = useState(false);

  const moves = selected && canAct(selected.side) && !selected.hasMoved
    ? legalMoves(selected, state.units, scenario)
    : [];
  const moveSet = new Set(moves.map(posKey));

  // Only treat enemies as "attackable" when the selected unit can actually
  // attack this turn AND the target is on the opposing team. Coalition
  // partners (austrian + russian) count as same team.
  const attackableEnemies = selected && canAct(selected.side) && !selected.hasActed
    ? state.units.filter(u =>
        !sameTeam(u.side, selected.side) &&
        canAttackUnit(selected, u))
    : [];
  const enemySet = new Set(attackableEnemies.map(u => u.id));

  const objectives = frenchObjectiveTiles(state, scenario.victory);
  const canSeeMorale = (unit: Unit): boolean =>
    unit.moraleRevealed || isOnPlayerTeam(unit.side, scenario.playerSide);

  const terrainOverlay = (kind: TerrainKind, x: number, y: number) => {
    const ox = x * cellSize;
    const oy = y * cellSize;
    const cx = ox + cellSize / 2;
    const cy = oy + cellSize / 2;
    switch (kind) {
      case 'hill':
        return (
          <g pointerEvents="none" opacity={0.72}>
            <path d={`M${ox + 7} ${oy + 30} Q${cx} ${oy + 14} ${ox + 41} ${oy + 30}`}
                  fill="none" stroke="#6b4c29" strokeWidth={1.3} />
            <path d={`M${ox + 9} ${oy + 37} Q${cx} ${oy + 24} ${ox + 39} ${oy + 37}`}
                  fill="none" stroke="#6b4c29" strokeWidth={1} opacity={0.78} />
          </g>
        );
      case 'road':
        return (
          <g pointerEvents="none" opacity={0.82}>
            <path d={`M${cx} ${oy - 4} C${cx - 5} ${oy + 12} ${cx + 6} ${oy + 29} ${cx} ${oy + 52}`}
                  fill="none" stroke="#6d4c2a" strokeWidth={3.4} opacity={0.34} />
            <path d={`M${cx} ${oy - 4} C${cx - 5} ${oy + 12} ${cx + 6} ${oy + 29} ${cx} ${oy + 52}`}
                  fill="none" stroke="#2f2518" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.52} />
          </g>
        );
      case 'river':
        return (
          <g pointerEvents="none" opacity={0.9}>
            <path d={`M${ox - 2} ${cy - 7} Q${ox + 12} ${cy - 15} ${ox + 25} ${cy - 6} T${ox + 51} ${cy - 7} L${ox + 51} ${cy + 9} Q${ox + 37} ${cy + 16} ${ox + 24} ${cy + 8} T${ox - 2} ${cy + 9} Z`}
                  fill="#557891" opacity={0.9} />
            <path d={`M${ox + 1} ${cy} Q${ox + 13} ${cy - 7} ${ox + 24} ${cy} T${ox + 48} ${cy}`}
                  fill="none" stroke="#d2e1e8" strokeWidth={1.2} opacity={0.78} />
          </g>
        );
      case 'bridge':
        return (
          <g pointerEvents="none" opacity={0.94}>
            <rect x={ox + 16} y={oy + 3} width={16} height={42} rx={1}
                  fill="#9a6f3a" stroke="#4a3219" strokeWidth={0.8} />
            {[9, 16, 23, 30, 37].map(offset => (
              <line key={offset} x1={ox + 17} y1={oy + offset} x2={ox + 31} y2={oy + offset}
                    stroke="#4a3219" strokeWidth={0.8} />
            ))}
          </g>
        );
      case 'marsh':
        return (
          <g pointerEvents="none" opacity={0.78}>
            {[8, 18, 29, 39].map((mx, i) => (
              <path key={mx} d={`M${ox + mx} ${oy + 36 - (i % 2) * 10} q3 -8 6 0 M${ox + mx + 3} ${oy + 36 - (i % 2) * 10} v-12`}
                    fill="none" stroke="#2f4425" strokeWidth={1.1} strokeLinecap="round" />
            ))}
          </g>
        );
      default:
        return null;
    }
  };

  // Keyboard handler: arrows move cursor; Enter/Space activate.
  // Activation = whatever a click on that cell would do (move, attack, select).
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)) {
      e.preventDefault();
      e.stopPropagation();
      setCursor(prev => {
        let { x, y } = prev;
        if (k === 'ArrowUp')    y = Math.max(0, y - 1);
        if (k === 'ArrowDown')  y = Math.min(scenario.grid.height - 1, y + 1);
        if (k === 'ArrowLeft')  x = Math.max(0, x - 1);
        if (k === 'ArrowRight') x = Math.min(scenario.grid.width  - 1, x + 1);
        return { x, y };
      });
      return;
    }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      e.stopPropagation();
      // Replicate click semantics for the cursor cell.
      const onTile = state.units.find(u => posEq(u.position, cursor));
      const isMove = moveSet.has(posKey(cursor));
      if (onTile) {
        const isAttackable = enemySet.has(onTile.id);
        if (!isAttackable) { p.onSelectUnit(onTile.id); return; }
        if (hoveredEnemyId === onTile.id) p.onAttack(onTile.id);
        else p.onHoverEnemy(onTile.id);
      } else {
        if (selected && isMove) { p.onMoveTo(cursor); }
        else if (selected) { p.onSelectUnit(null); }
      }
    }
  };

  return (
    <div className="battle-board-frame w-full mx-auto" style={{ maxWidth: 'min(100%, 80vh)' }}>
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="battle-board-svg w-full h-auto bg-parchmentDark border border-ink/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gilt"
      tabIndex={0}
      role="grid"
      aria-label={`Battle board, ${scenario.grid.width} by ${scenario.grid.height}. Use arrow keys to move the cursor, Enter to act.`}
      onKeyDown={onKey}
      onFocus={() => setSvgFocused(true)}
      onBlur={() => setSvgFocused(false)}
    >
      <defs>
        {/* Campaign-skin texture patterns. Gameplay remains data-driven; these
            image fills only change presentation. */}
        <filter id="paper-grain" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="18" result="noise" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.14" />
          </feComponentTransfer>
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>

        <filter id="counter-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1.8" dy="2.4" stdDeviation="1.4" floodColor={skin.counter.shadow} floodOpacity="0.52" />
          <feDropShadow dx="-0.4" dy="-0.5" stdDeviation="0.45" floodColor="#fff4cd" floodOpacity="0.18" />
        </filter>

        <linearGradient id="counter-french" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#386bb4" />
          <stop offset="55%" stopColor="#2c5aa0" />
          <stop offset="100%" stopColor="#173a78" />
        </linearGradient>
        <linearGradient id="counter-austrian" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7df" />
          <stop offset="62%" stopColor="#ece4d0" />
          <stop offset="100%" stopColor="#c8b99a" />
        </linearGradient>
        <linearGradient id="counter-russian" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5d8d55" />
          <stop offset="58%" stopColor="#4a7a4a" />
          <stop offset="100%" stopColor="#2f5735" />
        </linearGradient>
        <linearGradient id="counter-spanish" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff3cf" />
          <stop offset="60%" stopColor="#e8d39b" />
          <stop offset="100%" stopColor="#c6a45d" />
        </linearGradient>
        <linearGradient id="counter-british" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b74333" />
          <stop offset="58%" stopColor="#8f2b1e" />
          <stop offset="100%" stopColor="#5f1d16" />
        </linearGradient>
        <linearGradient id="counter-portuguese" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c8a5b" />
          <stop offset="58%" stopColor="#315f42" />
          <stop offset="100%" stopColor="#203f2d" />
        </linearGradient>

        {terrainTextureEntries.map(([kind, href]) => (
          <pattern key={kind} id={`terrain-${kind}`} patternUnits="userSpaceOnUse" width="48" height="48">
            <image href={href} width="48" height="48" preserveAspectRatio="xMidYMid slice" />
          </pattern>
        ))}
        <pattern id="terrain-move" patternUnits="userSpaceOnUse" width="12" height="12">
          <rect width="12" height="12" fill="#b8d8b8" />
          <path d="M0 12 L12 0" stroke="#6f9a62" strokeWidth="0.7" opacity="0.35" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={skin.paperTint} />
      <image
        href={skin.boardTexture}
        width={w}
        height={h}
        preserveAspectRatio="xMidYMid slice"
        opacity={0.9}
      />
      <rect
        x={1} y={1}
        width={w - 2} height={h - 2}
        fill="none"
        stroke={skin.borderColor}
        strokeWidth={2.2}
        pointerEvents="none"
      />
      {/* Tiles */}
      {Array.from({ length: scenario.grid.height }, (_, y) =>
        Array.from({ length: scenario.grid.width }, (_, x) => {
          const ter = scenario.tiles.find(t => posEq(t.pos, { x, y }))?.terrain ?? 'plain';
          const isMove = moveSet.has(posKey({ x, y }));
          const fill = isMove ? 'url(#terrain-move)' : ter === 'plain' ? 'transparent' : TERRAIN_PATTERN[ter];
          return (
            <g
              key={`${x},${y}`}
              onClick={() => {
                if (selected && isMove) { p.onMoveTo({ x, y }); setTooltipPos(null); }
                else if (selected) { p.onSelectUnit(null); setTooltipPos(null); }
                else setTooltipPos(prev => prev && prev.x === x && prev.y === y ? null : { x, y });
              }}
              onMouseEnter={() => setTooltipPos({ x, y })}
              onMouseLeave={() => setTooltipPos(prev => prev && prev.x === x && prev.y === y ? null : prev)}
              style={{ cursor: isMove ? 'pointer' : 'default' }}
            >
              <rect
                x={x * cellSize} y={y * cellSize}
                width={cellSize} height={cellSize}
                fill={fill}
                stroke={skin.gridColor}
                strokeWidth={0.5}
                opacity={isMove ? 1 : ter === 'plain' ? 0.72 : 0.9}
              />
              {!isMove && terrainOverlay(ter, x, y)}
            </g>
          );
        })
      )}

      {Array.from({ length: scenario.grid.height + 1 }, (_, y) =>
        Array.from({ length: scenario.grid.width + 1 }, (_, x) => (
          <circle
            key={`grid-dot-${x},${y}`}
            cx={x * cellSize}
            cy={y * cellSize}
            r={1.8}
            fill="none"
            stroke={skin.gridIntersectionColor}
            strokeWidth={0.62}
            opacity={0.52}
            pointerEvents="none"
          />
        ))
      )}

      {/* Keyboard focus cursor — rendered between tiles and objectives so it
          sits below the unit silhouette but above the terrain. Only visible
          when the SVG actually has keyboard focus. */}
      {svgFocused && (
        <rect
          x={cursor.x * cellSize + 1}
          y={cursor.y * cellSize + 1}
          width={cellSize - 2}
          height={cellSize - 2}
          fill="none"
          stroke="#d4a017"
          strokeWidth={2}
          strokeDasharray="3 2"
          pointerEvents="none"
        />
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
        const icon = UNIT_COUNTER_ICON_LAYOUT[u.type];
        const rasterIcon = getUnitRasterIcon(u.type, u.side);
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
              rx="4"
              fill={COUNTER_FILL[u.side]}
              filter="url(#counter-shadow)"
              stroke={
                isSelected || isHighlighted ? skin.counter.highlight        // gold — selected / highlighted
                : isReady                    ? '#3a8a3a'        // green — active side, can still act
                                             : skin.counter.inactiveStroke
              }
              strokeWidth={isSelected || isHighlighted ? 3 : isReady ? 2.4 : 1.2}
            />
            <rect
              x={1.2} y={1.2}
              width={cellSize - 10.4} height={(cellSize - 10.4) / 2}
              rx="3"
              fill="#fff8d8"
              opacity={u.side === 'austrian' || u.side === 'spanish' ? 0.22 : 0.12}
              pointerEvents="none"
            />
            <rect
              x={1.2} y={1.2}
              width={cellSize - 10.4} height={cellSize - 10.4}
              rx="3"
              fill="none"
              stroke={skin.counter.bevel}
              strokeWidth={0.85}
              opacity={0.48}
              pointerEvents="none"
            />
            <path
              d={`M4 ${cellSize - 11} H${cellSize - 17} M${cellSize - 10} 5 V${cellSize - 17}`}
              stroke="#1a120a"
              strokeWidth={0.7}
              opacity={0.26}
              pointerEvents="none"
            />
            {rasterIcon ? (
              <image
                href={rasterIcon}
                x={icon.x}
                y={icon.y}
                width={icon.width}
                height={icon.height}
                preserveAspectRatio="xMidYMid meet"
                pointerEvents="none"
              />
            ) : (
              <g transform={`translate(${icon.x}, ${icon.y}) scale(${icon.scale})`}
                 style={{
                   color: SIDE_TEXT[u.side],
                   '--unit-detail': SIDE_ICON_DETAIL[u.side],
                 } as CSSProperties}>
                <use href={`#${unitSilhouetteId(u.type)}`} width={icon.width} height={icon.height} />
              </g>
            )}
            {/* Strength badge — bottom-right */}
            <rect x={cellSize - 22} y={cellSize - 22} width={14} height={12}
                  fill="#d4a017" stroke="#2a2018" strokeWidth={0.6} rx="2" />
            <text x={cellSize - 15} y={cellSize - 13} textAnchor="middle"
                  fontSize="9" fontWeight="700" fill="#2a2018">
              {u.strength}
            </text>
            {/* Morale stars: dedicated top strip so they do not cover unit art. */}
            {canSeeMorale(u) && (
              <g pointerEvents="none">
                <rect
                  x={3.5} y={2.3}
                  width={Math.min(26, 8.4 * u.morale + 2)}
                  height={8.4}
                  rx={2}
                  fill="#1a120a"
                  opacity={0.22}
                />
                <text
                  x={5} y={9}
                  textAnchor="start"
                  fontSize="8" fontWeight="700"
                  fill="#d4a017"
                  stroke="#1a120a" strokeWidth={0.35}
                  paintOrder="stroke"
                >
                  {'★'.repeat(u.morale)}
                </text>
              </g>
            )}
            {(p.showDetails || u.formation !== 'line') && (
              <g
                role="img"
                aria-label={`Formation: ${u.formation}`}
                pointerEvents="none"
              >
                <rect
                  x={0.7}
                  y={14.4}
                  width={5.3}
                  height={17.5}
                  rx={1.5}
                  fill="#1a120a"
                  opacity={isSelected || isHighlighted ? 0.68 : 0.42}
                />
                <path
                  d={FORMATION_ICON_PATH[u.formation]}
                  transform="translate(0.35 17.6)"
                  fill={u.formation === 'square' ? 'none' : '#f7ecd0'}
                  stroke="#f7ecd0"
                  strokeWidth={u.formation === 'square' ? 1.1 : 1.15}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.95}
                />
              </g>
            )}
            {(u.cohesion ?? 0) !== 0 && (
              <g
                role="img"
                aria-label={`Cohesion ${(u.cohesion ?? 0) > 0 ? '+' : ''}${u.cohesion ?? 0}`}
                pointerEvents="none"
              >
                <rect
                  x={3}
                  y={cellSize - 22}
                  width={16}
                  height={12}
                  rx={2}
                  fill={(u.cohesion ?? 0) > 0 ? '#2f6f3e' : '#8f2b1e'}
                  stroke="#f7ecd0"
                  strokeWidth={0.75}
                />
                <text
                  x={11}
                  y={cellSize - 13}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="900"
                  fill="#fff7df"
                  stroke="#1a120a"
                  strokeWidth={0.35}
                  paintOrder="stroke"
                >
                  {(u.cohesion ?? 0) > 0 ? '+' : ''}{u.cohesion ?? 0}
                </text>
              </g>
            )}
            {!isInCommand(u, state.units) && (
              <g role="img" aria-label="Out of command" pointerEvents="none">
                <circle
                  cx={cellSize - 9}
                  cy={cellSize / 2}
                  r={4.5}
                  fill="#8f2b1e"
                  stroke="#f7ecd0"
                  strokeWidth={0.7}
                />
                <text
                  x={cellSize - 9}
                  y={cellSize / 2 + 2.8}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="900"
                  fill="#fff7df"
                >
                  !
                </text>
              </g>
            )}
            {p.showDetails && (
              <>
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
        if (fx.kind === 'cohesion') {
          const delta = fx.detail ?? 0;
          return (
            <g key={fx.id} pointerEvents="none" className="animate-cohesion-shift">
              <rect
                x={centerX - 19}
                y={cy + 1}
                width={38}
                height={13}
                rx={3}
                fill={delta > 0 ? '#2f6f3e' : '#8f2b1e'}
                stroke="#f7ecd0"
                strokeWidth={0.8}
                opacity={0.94}
              />
              <text
                x={centerX}
                y={cy + 11}
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fill="#fff7df"
                stroke="#1a120a"
                strokeWidth={0.35}
                paintOrder="stroke"
              >
                {delta > 0 ? '+' : ''}{delta} coh
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
        const tipH = occupant ? 98 : 40;
        const placeAbove = tooltipPos.y > 0;
        const tx = Math.min(Math.max(tooltipPos.x * cellSize + cellSize / 2 - tipW / 2, 2), w - tipW - 2);
        const ty = placeAbove
          ? tooltipPos.y * cellSize - tipH - 4
          : tooltipPos.y * cellSize + cellSize + 4;
        // Own-side morale is always shown; enemy morale stays '?' until probed.
        const moraleStr = occupant
          ? (canSeeMorale(occupant)
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
                  {TYPE_CODE[occupant.type]} · {occupant.formation} · {occupant.facing}
                </text>
                <text x={tx + 8} y={ty + 78} fontSize="9" fill="#f5f0e6">
                  Strength {occupant.strength}/4 · Morale {moraleStr}
                </text>
                <text x={tx + 8} y={ty + 92} fontSize="9" fill="#f5f0e6">
                  {isInCommand(occupant, state.units) ? 'In command' : 'Out of command'}
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
