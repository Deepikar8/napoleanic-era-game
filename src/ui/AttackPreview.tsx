import type { Unit, Scenario } from '../engine/types';
import { Panel } from './shared';
import { previewAttack } from '../engine/preview';

export function AttackPreview({
  attacker, defender, allUnits, tiles,
}: {
  attacker: Unit | null; defender: Unit | null;
  allUnits: Unit[]; tiles: Scenario['tiles'];
}) {
  if (!attacker || !defender) return null;
  const p = previewAttack(attacker, defender, allUnits, tiles);
  const dScoreDisplay = p.defenderRevealed
    ? p.defenderScore.toString()
    : `${p.defenderScore - defender.morale} + ?morale`;

  return (
    <Panel title="Attack preview">
      <div className="text-sm space-y-1">
        <div className="flex justify-between"><span>Attacker</span>
          <span className="font-semibold">{attacker.strength} + {attacker.morale} = {p.attackerScore}</span>
        </div>
        <div className="flex justify-between"><span>Defender</span>
          <span className="font-semibold">{dScoreDisplay}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-ink/20">
          <span className="text-ink/60">Predicted</span>
          <span className="font-bold">{p.defenderRevealed ? p.predictedResult : 'depends on hidden morale'}</span>
        </div>
      </div>
    </Panel>
  );
}
