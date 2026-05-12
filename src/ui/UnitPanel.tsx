import type { Unit, Morale } from '../engine/types';
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

const MORALE_LABEL: Record<Morale, string> = {
  1: 'Conscript',
  2: 'Veteran',
  3: 'Elite',
};

// Your own units' morale is always visible — you're the commander, you picked
// them. Only the ENEMY's morale is hidden until first contact.
const isOwnSide = (unit: Unit): boolean => unit.side === 'french';

const moraleDisplay = (unit: Unit): string => {
  const reveal = unit.moraleRevealed || isOwnSide(unit);
  return reveal
    ? `${'★'.repeat(unit.morale)} ${MORALE_LABEL[unit.morale]}`
    : '? (revealed when first attacked)';
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
        <Row label="Morale" value={moraleDisplay(unit)} />
        <Row label="Cohesion" value={`${(unit.cohesion ?? 0) >= 0 ? '+' : ''}${unit.cohesion ?? 0}`} />
      </div>
      <p className="mt-2 text-xs italic opacity-70">
        Morale is base quality. Cohesion shifts during battle from wins, losses, damage, and nearby support.
      </p>
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
