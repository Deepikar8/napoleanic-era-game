import { useState } from 'react';
import { useGame } from '../state/store';
import { Button, Panel } from './shared';
import { BattleBoard } from './BattleBoard';
import { UnitSpriteDefs } from '../art/unit-silhouettes';
import { replayUpTo, eventUnitIds } from '../engine/replay';
import type { BattleEvent } from '../engine/types';

const describe = (e: BattleEvent): string => {
  switch (e.kind) {
    case 'turn-started':       return `Turn ${e.turn} — ${e.side} to act`;
    case 'turn-ended':         return `Turn ${e.turn} — ${e.side} ended`;
    case 'unit-moved':         return `${e.unitId} moved (${e.from.x},${e.from.y}) → (${e.to.x},${e.to.y})`;
    case 'formation-changed':  return `${e.unitId}: ${e.from} → ${e.to}`;
    case 'attack-resolved':    return `Attack ${e.attackerId} → ${e.defenderId}: ${e.result} (${e.attackerScore} vs ${e.defenderScore})`;
    case 'morale-revealed':    return `${e.unitId} morale revealed: ${'★'.repeat(e.morale)}`;
    case 'unit-eliminated':    return `${e.unitId} eliminated`;
    case 'unit-retreated':     return `${e.unitId} retreated`;
    case 'victory':            return `Victory: ${e.side} (${e.reason})`;
  }
};

export function ReplayViewer() {
  const { state, scenario, goto } = useGame();
  const [i, setI] = useState(0);
  if (!state || !scenario) {
    return (
      <main className="min-h-full p-6 max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-3xl">Replay</h2>
          <Button kind="secondary" onClick={() => goto('splash')}>Back</Button>
        </header>
        <Panel><p className="text-sm opacity-70">No run to replay yet. Play a battle first.</p></Panel>
      </main>
    );
  }

  const events = state.log;
  const safeI = events.length === 0 ? 0 : Math.min(Math.max(i, 0), events.length - 1);
  const replayedState = replayUpTo(scenario, state.decisionsTaken, events, safeI);
  const involved = events[safeI] ? eventUnitIds(events[safeI]) : [];

  return (
    <main className="min-h-full p-6 max-w-4xl mx-auto">
      <UnitSpriteDefs />
      <header className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-3xl">Replay — {scenario.title}</h2>
        <Button kind="secondary" onClick={() => goto('splash')}>Back</Button>
      </header>

      <Panel title={`Event ${safeI + 1} / ${events.length || 0}`}>
        <div className="font-mono text-sm bg-parchment p-3 rounded min-h-[3em]">
          {events[safeI] ? describe(events[safeI]) : '— no events —'}
        </div>
        <div className="flex gap-2 mt-3">
          <Button kind="secondary" onClick={() => setI(Math.max(0, safeI - 1))}>◀ Back</Button>
          <Button onClick={() => setI(Math.min(events.length - 1, safeI + 1))}>Forward ▶</Button>
          <div className="flex-1" />
          <Button kind="secondary" onClick={() => setI(0)}>⏮ Start</Button>
          <Button kind="secondary" onClick={() => setI(events.length - 1)}>End ⏭</Button>
        </div>
      </Panel>

      <Panel title="Board at this event">
        <BattleBoard
          scenario={scenario}
          state={replayedState}
          selectedUnitId={null}
          hoveredEnemyId={null}
          highlightUnitIds={involved}
          showDetails={false}
          onSelectUnit={() => {}}
          onMoveTo={() => {}}
          onAttack={() => {}}
          onHoverEnemy={() => {}}
        />
      </Panel>

      <Panel title="Full log">
        <div className="text-sm font-mono leading-relaxed max-h-72 overflow-y-auto bg-parchment p-2 rounded">
          {events.map((e, k) => (
            <div
              key={k}
              className={`px-1 cursor-pointer hover:bg-gilt/20 ${k === safeI ? 'bg-gilt/40 font-bold' : ''}`}
              onClick={() => setI(k)}
            >{describe(e)}</div>
          ))}
        </div>
      </Panel>
    </main>
  );
}
