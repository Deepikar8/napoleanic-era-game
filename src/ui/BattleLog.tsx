import type { BattleEvent } from '../engine/types';
import { Panel } from './shared';

const formatEvent = (e: BattleEvent): string => {
  switch (e.kind) {
    case 'turn-started':       return `Turn ${e.turn} — ${e.side} to act`;
    case 'turn-ended':         return `Turn ${e.turn} — ${e.side} ended`;
    case 'unit-moved':         return `${e.unitId} moved to (${e.to.x},${e.to.y})`;
    case 'formation-changed':  return `${e.unitId}: ${e.from} → ${e.to}`;
    case 'attack-resolved':    return `Attack ${e.attackerId} → ${e.defenderId}: ${e.result} (${e.attackerScore} vs ${e.defenderScore})`;
    case 'morale-revealed':    return `${e.unitId} morale revealed: ${'★'.repeat(e.morale)}`;
    case 'unit-eliminated':    return `${e.unitId} eliminated`;
    case 'unit-retreated':     return `${e.unitId} retreated`;
    case 'victory':            return `Victory: ${e.side} (${e.reason})`;
  }
};

export function BattleLog({ events }: { events: BattleEvent[] }) {
  return (
    <Panel title="Battle log">
      <div className="text-sm leading-relaxed max-h-48 overflow-y-auto bg-parchment p-2 rounded">
        {[...events].reverse().slice(0, 40).map((e, i) => (
          <div key={`event-${events.length - 1 - i}`} className="border-b border-ink/10 py-0.5 last:border-0">{formatEvent(e)}</div>
        ))}
      </div>
    </Panel>
  );
}
