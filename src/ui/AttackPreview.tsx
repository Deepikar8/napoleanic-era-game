import type { Unit } from '../engine/types';
import { Panel } from './shared';

export function AttackPreview({ attacker, defender }: { attacker: Unit | null; defender: Unit | null }) {
  if (!attacker || !defender) return null;
  return (
    <Panel title="Attack preview">
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-ink/60">Attacker</span>
          <span className="font-semibold">{attacker.name ?? attacker.id} · {attacker.strength}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Defender</span>
          <span className="font-semibold">{defender.name ?? defender.id} · {defender.strength}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Morale</span>
          <span>{defender.moraleRevealed ? '★'.repeat(defender.morale) : '?'}</span>
        </div>
        <div className="text-xs italic opacity-70 pt-1">
          Click the highlighted enemy to confirm the attack.
        </div>
      </div>
    </Panel>
  );
}
