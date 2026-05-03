import { useMemo, useState } from 'react';
import { BattleBoard } from './ui/BattleBoard';
import { UnitPanel } from './ui/UnitPanel';
import { AttackPreview } from './ui/AttackPreview';
import { BattleLog } from './ui/BattleLog';
import { Button } from './ui/shared';
import { UnitSpriteDefs } from './art/unit-silhouettes';
import { austerlitz } from './scenarios/07-austerlitz';
import {
  beginBattle, moveUnit, attack, changeFormation, endTurn,
  checkVictory,
} from './engine';
import type { GameState, Pos } from './engine/types';

export default function App() {
  const [history, setHistory] = useState<GameState[]>(() => [beginBattle(austerlitz)]);
  const state = history[history.length - 1];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);

  const victory = useMemo(() => checkVictory(state, austerlitz.victory), [state]);

  const push = (next: GameState) => setHistory(h => [...h, next]);
  const undo = () => setHistory(h => (h.length > 1 ? h.slice(0, -1) : h));

  const selected = selectedId ? state.units.find(u => u.id === selectedId) ?? null : null;
  const hoveredEnemy = hoveredEnemyId ? state.units.find(u => u.id === hoveredEnemyId) ?? null : null;

  const handleMove = (to: Pos) => {
    if (!selectedId) return;
    try {
      const next = moveUnit(state, selectedId, to,
        { tiles: austerlitz.tiles, grid: austerlitz.grid }).state;
      push(next);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAttack = (defenderId: string) => {
    if (!selectedId) return;
    try {
      const next = attack(state, selectedId, defenderId).state;
      push(next);
      setSelectedId(null);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleEndTurn = () => {
    push(endTurn(state).state);
    setSelectedId(null);
  };

  const handleFormation = (to: 'line' | 'column' | 'square') => {
    if (!selectedId) return;
    try { push(changeFormation(state, selectedId, to).state); } catch (e) { console.warn(e); }
  };

  return (
    <div className="min-h-full p-4 grid grid-cols-[1fr_320px] gap-4">
      <UnitSpriteDefs />
      <div className="flex flex-col">
        <header className="flex items-center justify-between mb-2 bg-ink text-parchment px-3 py-2 rounded">
          <div>
            <span className="font-bold uppercase">{state.currentSide}</span>
            <span className="ml-3 text-sm">Turn {state.turn} / {austerlitz.turnLimit ?? '∞'}</span>
          </div>
          <div className="text-xs opacity-80">
            {victory.kind === 'decided'
              ? <span className="text-gilt font-bold">Victory: {victory.victor} — {victory.reason}</span>
              : <span>{austerlitz.title}</span>}
          </div>
        </header>
        <BattleBoard
          scenario={austerlitz}
          state={state}
          selectedUnitId={selectedId}
          hoveredEnemyId={hoveredEnemyId}
          onSelectUnit={setSelectedId}
          onMoveTo={handleMove}
          onAttack={handleAttack}
          onHoverEnemy={setHoveredEnemyId}
        />
        <div className="mt-3 flex gap-2 items-center">
          <Button onClick={undo} kind="secondary" disabled={history.length === 1}>Undo</Button>
          <div className="flex-1" />
          {selected && (
            <>
              <Button onClick={() => handleFormation('line')}   kind="secondary">Line</Button>
              <Button onClick={() => handleFormation('column')} kind="secondary">Column</Button>
              <Button onClick={() => handleFormation('square')} kind="secondary">Square</Button>
            </>
          )}
          <Button onClick={handleEndTurn}>End Turn</Button>
        </div>
      </div>
      <aside>
        <UnitPanel unit={selected} />
        <AttackPreview attacker={selected} defender={hoveredEnemy} />
        <BattleLog events={state.log} />
      </aside>
    </div>
  );
}
