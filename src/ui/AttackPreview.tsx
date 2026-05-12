import type { Unit, Scenario } from '../engine/types';
import { Panel } from './shared';
import { previewAttack } from '../engine/preview';
import { isArtilleryType } from '../engine/attack-range';
import { sameTeam } from '../engine/sides';
import { chebyshev } from '../engine/grid';
import { isInCommand } from '../engine/command';

export function AttackPreview({
  attacker, defender, allUnits, tiles,
}: {
  attacker: Unit | null; defender: Unit | null;
  allUnits: Unit[]; tiles: Scenario['tiles'];
}) {
  if (!attacker || !defender) return null;
  const p = previewAttack(attacker, defender, allUnits, tiles);
  const isArtilleryAttack = isArtilleryType(attacker.type);
  const supportBonus = (unit: Unit): number =>
    allUnits.some(o => o.id !== unit.id && sameTeam(o.side, unit.side) && chebyshev(o.position, unit.position) === 1)
      ? 1
      : 0;
  const attackerCohesion = attacker.cohesion ?? 0;
  const defenderCohesion = defender.cohesion ?? 0;
  const attackerSupport = supportBonus(attacker);
  const defenderSupport = supportBonus(defender);
  const attackerCommand = isInCommand(attacker, allUnits) ? 0 : -1;
  const defenderCommand = isInCommand(defender, allUnits) ? 0 : -1;
  const attackerBase = attacker.strength + attacker.morale;
  const attackerMods = p.attackerScore - attackerBase;
  const defenderBase = defender.strength + defender.morale;
  const defenderMods = p.defenderScore - defenderBase;
  const modText = (value: number): string => `${value >= 0 ? '+' : '-'} ${Math.abs(value)} mods`;
  const dScoreDisplay = p.defenderRevealed
    ? `${defenderBase}${defenderMods === 0 ? '' : ` ${modText(defenderMods)}`} = ${p.defenderScore}`
    : `${p.defenderScore - defender.morale} + ? morale`;

  return (
    <Panel title="Attack preview">
      <div className="text-sm space-y-1">
        <div className="flex justify-between"><span>Attacker</span>
          <span className="font-semibold">
            {attackerBase}{attackerMods === 0 ? '' : ` ${modText(attackerMods)}`} = {p.attackerScore}
          </span>
        </div>
        {(attackerCohesion !== 0 || attackerSupport !== 0 || attackerCommand !== 0) && (
          <div className="text-xs text-ink/70">
            Attacker modifiers: cohesion {attackerCohesion >= 0 ? '+' : ''}{attackerCohesion}, support +{attackerSupport}, command {attackerCommand}
          </div>
        )}
        <div className="flex justify-between"><span>Defender</span>
          <span className="font-semibold">{dScoreDisplay}</span>
        </div>
        {(defenderCohesion !== 0 || defenderSupport !== 0 || defenderCommand !== 0) && (
          <div className="text-xs text-ink/70">
            Defender modifiers: cohesion {defenderCohesion >= 0 ? '+' : ''}{defenderCohesion}, support +{defenderSupport}, command {defenderCommand}
          </div>
        )}
        <div className="flex justify-between pt-1 border-t border-ink/20">
          <span className="text-ink/60">Predicted</span>
          <span className="font-bold">{p.defenderRevealed ? p.predictedResult : 'depends on hidden morale'}</span>
        </div>
        {isArtilleryAttack && (
          <div className="text-xs italic text-ink/70">
            Artillery fires at range and takes no return damage.
          </div>
        )}
      </div>
    </Panel>
  );
}
