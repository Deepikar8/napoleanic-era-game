import type { Unit } from '../engine/types';
import { chebyshev } from '../engine/grid';
import { isInCommand } from '../engine/command';
import { sameTeam } from '../engine/sides';
import { Panel } from './shared';

const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value}`;

const hasAdjacentSupport = (unit: Unit, allUnits: Unit[]): boolean =>
  allUnits.some(other =>
    other.id !== unit.id &&
    sameTeam(other.side, unit.side) &&
    chebyshev(other.position, unit.position) === 1,
  );

export function RulesQuickReference({
  selectedUnit,
  allUnits,
}: {
  selectedUnit: Unit | null;
  allUnits: Unit[];
}) {
  const selectedInCommand = selectedUnit ? isInCommand(selectedUnit, allUnits) : false;
  const selectedSupported = selectedUnit ? hasAdjacentSupport(selectedUnit, allUnits) : false;
  const cohesion = selectedUnit?.cohesion ?? 0;

  return (
    <Panel title="Tactical rules">
      <div className="space-y-2 text-xs">
        {selectedUnit && (
          <div className="rounded border border-ink/20 bg-parchment px-2 py-1.5 font-semibold">
            Selected: {selectedInCommand ? 'in command' : 'out of command'}
            {' · '}
            {selectedSupported ? 'supported +1' : 'no adjacent support'}
            {' · '}
            cohesion {signed(cohesion)}
          </div>
        )}

        <Rule label="Command" detail="Friendly within 2 tiles. Out of command: -1 combat, no win cohesion." />
        <Rule label="Support" detail="Adjacent friendly: +1 combat." />
        <Rule label="Cohesion" detail="-2 to +2. Command recovers shaken units at turn start." />
        <Rule label="Retreat/rout" detail="Open tile away from attacker. Trapped broken units rout." />
        <Rule label="Artillery" detail="Range 3. No return damage when firing." />
      </div>
    </Panel>
  );
}

function Rule({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-2">
      <span className="font-bold text-ink/70">{label}</span>
      <span>{detail}</span>
    </div>
  );
}
