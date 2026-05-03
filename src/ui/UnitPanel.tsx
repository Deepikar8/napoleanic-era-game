import type { Unit } from '../engine/types';
import { Panel } from './shared';

const TYPE_LABEL: Record<Unit['type'], string> = {
  'line-infantry': 'Line Infantry',
  'light-infantry': 'Light Infantry',
  'grenadier': 'Grenadier',
  'light-cavalry': 'Light Cavalry',
  'heavy-cavalry': 'Heavy Cavalry',
  'foot-artillery': 'Foot Artillery',
  'horse-artillery': 'Horse Artillery',
};

export function UnitPanel({ unit }: { unit: Unit | null }) {
  if (!unit) return <Panel title="No unit selected"><p className="text-sm opacity-60">Tap a unit on the board.</p></Panel>;
  return (
    <Panel title="Selected unit">
      <div className="text-sm space-y-1">
        <Row label="Type" value={TYPE_LABEL[unit.type]} />
        {unit.name && <Row label="Name" value={unit.name} />}
        <Row label="Side" value={unit.side} />
        <Row label="Formation" value={unit.formation} />
        <Row label="Strength" value={`${unit.strength} / 4`} />
        <Row label="Morale" value={unit.moraleRevealed ? '★'.repeat(unit.morale) : '?'} />
      </div>
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
