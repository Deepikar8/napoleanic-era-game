import { useState } from 'react';
import type { GameState, Pos, Scenario, Side, TerrainKind, Unit } from '../engine/types';
import { posEq, posKey } from '../engine/types';
import { chebyshev } from '../engine/grid';
import { legalMoves } from '../engine/movement';
import { unitSilhouetteId } from '../art/unit-silhouettes';

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

export function BattleBoard(p: BattleBoardProps) {
  const { scenario, state, selectedUnitId, hoveredEnemyId } = p;
  const cellSize = 48;
  const w = scenario.grid.width * cellSize;
  const h = scenario.grid.height * cellSize;

  const [tooltipPos, setTooltipPos] = useState<Pos | null>(null);

  const selected = selectedUnitId
    ? state.units.find(u => u.id === selectedUnitId) ?? null
    : null;

  const COALITION: Side[] = ['austrian', 'russian'];
  const canAct = (side: Side) =>
    state.currentSide === 'french' ? side === 'french' : COALITION.includes(side);
  const sameTeam = (a: Side, b: Side) =>
    (a === 'french' && b === 'french') ||
    (COALITION.includes(a) && COALITION.includes(b));

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

  return (
    <div className="w-full mx-auto" style={{ maxWidth: 'min(100%, 80vh)' }}>
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto bg-parchmentDark border border-ink/40">
      {/* Tiles */}
      {Array.from({ length: scenario.grid.height }, (_, y) =>
        Array.from({ length: scenario.grid.width }, (_, x) => {
          const ter = scenario.tiles.find(t => posEq(t.pos, { x, y }))?.terrain ?? 'plain';
          const isMove = moveSet.has(posKey({ x, y }));
          const fill = isMove ? '#b8d8b8' : TERRAIN_FILL[ter];
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
              onMouseEnter={() => { if (!selected) setTooltipPos({ x, y }); }}
              onMouseLeave={() => { if (!selected) setTooltipPos(prev => prev && prev.x === x && prev.y === y ? null : prev); }}
              style={{ cursor: isMove ? 'pointer' : 'default' }}
            />
          );
        })
      )}

      {/* Units */}
      {state.units.map(u => {
        const cx = u.position.x * cellSize;
        const cy = u.position.y * cellSize;
        const isSelected = u.id === selectedUnitId;
        const isHighlighted = !!p.highlightUnitIds?.includes(u.id);
        const isAttackable = enemySet.has(u.id);
        const isSpent = canAct(u.side) && u.hasActed === true && u.hasMoved === true;
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
            onMouseEnter={() => !canAct(u.side) && p.onHoverEnemy(u.id)}
            onMouseLeave={() => p.onHoverEnemy(null)}
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
              stroke={isSelected || isHighlighted ? '#d4a017' : 'rgba(0,0,0,0.3)'}
              strokeWidth={isSelected || isHighlighted ? 3 : 1.2}
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

      {/* Terrain tooltip */}
      {tooltipPos && (() => {
        const ter = scenario.tiles.find(t => posEq(t.pos, tooltipPos))?.terrain ?? 'plain';
        const info = TERRAIN_INFO[ter];
        const occupant = state.units.find(u => posEq(u.position, tooltipPos));
        const tipW = 160; const tipH = occupant ? 56 : 40;
        // place tooltip above the cell when possible, else below
        const placeAbove = tooltipPos.y > 0;
        const tx = Math.min(Math.max(tooltipPos.x * cellSize + cellSize / 2 - tipW / 2, 2), w - tipW - 2);
        const ty = placeAbove
          ? tooltipPos.y * cellSize - tipH - 4
          : tooltipPos.y * cellSize + cellSize + 4;
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
              <text x={tx + 8} y={ty + 46} fontSize="9" fill="#d4a017">
                {occupant.name ?? occupant.id} · {occupant.side}
              </text>
            )}
          </g>
        );
      })()}
    </svg>
    </div>
  );
}
