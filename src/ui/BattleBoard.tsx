import type { GameState, Pos, Scenario, Side, Unit } from '../engine/types';
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

  const selected = selectedUnitId
    ? state.units.find(u => u.id === selectedUnitId) ?? null
    : null;

  const COALITION: Side[] = ['austrian', 'russian'];
  const canAct = (side: Side) =>
    state.currentSide === 'french' ? side === 'french' : COALITION.includes(side);

  const moves = selected && canAct(selected.side) && !selected.hasMoved
    ? legalMoves(selected, state.units, scenario)
    : [];
  const moveSet = new Set(moves.map(posKey));

  const adjacentEnemies = selected
    ? state.units.filter(u =>
        u.side !== selected.side &&
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
                if (selected && isMove) p.onMoveTo({ x, y });
                else p.onSelectUnit(null);
              }}
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
              stroke={isSelected ? '#d4a017' : 'rgba(0,0,0,0.3)'}
              strokeWidth={isSelected ? 3 : 1.2}
            />
            <g transform={`translate(${(cellSize - 8) * 0.1}, ${(cellSize - 8) * 0.1}) scale(${(cellSize - 8) * 0.032})`}
               style={{ color: SIDE_TEXT[u.side] }}>
              <use href={`#${unitSilhouetteId(u.type)}`} />
            </g>
            <rect x={cellSize - 22} y={cellSize - 22} width={14} height={12}
                  fill="#d4a017" stroke="#2a2018" strokeWidth={0.6} rx="2" />
            <text x={cellSize - 15} y={cellSize - 13} textAnchor="middle"
                  fontSize="9" fontWeight="700" fill="#2a2018">
              {u.strength}
            </text>
            {/* Formation glyph */}
            <text x={4} y={cellSize - 12} fontSize="11" fontWeight="700" fill={SIDE_TEXT[u.side]}>
              {u.formation === 'line' ? '—' : u.formation === 'column' ? '⋮' : '▢'}
            </text>
            {/* Facing triangle on the front edge */}
            <polygon
              points={facingTriangle(u.facing, cellSize - 8)}
              fill={SIDE_TEXT[u.side]} opacity={0.7}
            />
          </g>
        );
      })}
    </svg>
    </div>
  );
}
