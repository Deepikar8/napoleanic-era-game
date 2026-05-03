import { useState } from 'react';
import { useGame } from '../state/store';
import { Button, Panel } from './shared';
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
  const { state, goto } = useGame();
  const [i, setI] = useState(0);
  const events = state?.log ?? [];

  return (
    <main className="min-h-full p-6 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-3xl">Replay</h2>
        <Button kind="secondary" onClick={() => goto('splash')}>Back</Button>
      </header>
      <Panel title={`Event ${i + 1} / ${events.length || 0}`}>
        <div className="font-mono text-sm bg-parchment p-3 rounded min-h-[3em]">
          {events[i] ? describe(events[i]) : '— no events —'}
        </div>
        <div className="flex gap-2 mt-3">
          <Button kind="secondary" onClick={() => setI(Math.max(0, i - 1))}>◀ Back</Button>
          <Button onClick={() => setI(Math.min(events.length - 1, i + 1))}>Forward ▶</Button>
        </div>
      </Panel>
      <Panel title="Full log">
        <div className="text-xs font-mono leading-relaxed max-h-72 overflow-y-auto bg-parchment p-2 rounded">
          {events.map((e, k) => (
            <div key={k} className={k === i ? 'bg-gilt/30 px-1' : 'px-1'}>{describe(e)}</div>
          ))}
        </div>
      </Panel>
    </main>
  );
}
