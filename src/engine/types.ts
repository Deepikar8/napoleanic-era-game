// All engine types. Pure data, JSON-safe.

export type Side = 'french' | 'austrian' | 'russian';

export type UnitType =
  | 'line-infantry' | 'light-infantry' | 'grenadier'
  | 'light-cavalry' | 'heavy-cavalry'
  | 'foot-artillery' | 'horse-artillery';

export type Formation = 'line' | 'column' | 'square';

export type Facing = 'N' | 'E' | 'S' | 'W';

export type TerrainKind =
  | 'plain' | 'forest' | 'town' | 'hill'
  | 'river' | 'bridge' | 'marsh' | 'road';

export type Strength = 1 | 2 | 3 | 4;
export type Morale = 1 | 2 | 3;

export interface Pos { x: number; y: number; }
export const posEq = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;
export const posKey = (p: Pos) => `${p.x},${p.y}`;

export interface Unit {
  id: string;
  name?: string;
  side: Side;
  type: UnitType;
  position: Pos;
  facing: Facing;
  formation: Formation;
  strength: Strength;
  morale: Morale;
  moraleRevealed?: boolean;     // engine sets true after first attack on this unit
  hasMoved?: boolean;           // reset at start-of-turn
  hasActed?: boolean;           // reset at start-of-turn
}

export interface Tile {
  pos: Pos;
  terrain: TerrainKind;
}

export type VictoryConditionKind =
  | 'eliminate-unit'        // args: { unitId: string }
  | 'hold-tile-for-turns'   // args: { pos: Pos; turns: number }
  | 'capture-tile'          // args: { pos: Pos }
  | 'reduce-side-strength'  // args: { side: Side; threshold: number }
  | 'survive-turns';        // args: { turns: number }

export interface VictoryCondition {
  for: Side;
  kind: VictoryConditionKind;
  args: Record<string, unknown>;
}

export type AiGeneralRule = 'aggressive' | 'defensive' | 'fixed';

export interface AiTrigger {
  whenTurn?: number;                                       // fires at start of this turn
  whenSideStrengthBelow?: { side: Side; threshold: number };
  do: AiAction[];                                          // hand-coded actions
}

export type AiAction =
  | { kind: 'move'; unitId: string; to: Pos }
  | { kind: 'attack'; unitId: string; targetId: string }
  | { kind: 'change-formation'; unitId: string; to: Formation };

export interface AiScript {
  generalRule: AiGeneralRule;
  triggers: AiTrigger[];
}

// Decisions are pre-battle modifiers chosen by the player after a dispatch.
export interface Decision {
  id: string;                  // unique within campaign — referenced from saves
  promptMd: string;
  options: DecisionOption[];
}

export interface DecisionOption {
  label: string;
  patch: ScenarioPatch;
}

export interface ScenarioPatch {
  unitsAdded?: Unit[];
  unitsRemovedByIds?: string[];
  unitOverrides?: Array<{ id: string } & Partial<Omit<Unit, 'id'>>>;
  tilesOverridden?: Tile[];
  victoryOverride?: VictoryCondition[];
  turnLimitOverride?: number;
}

export interface Scenario {
  id: string;
  title: string;
  briefingMd: string;          // filename (without .md) under src/dispatches
  grid: { width: number; height: number };
  tiles: Tile[];               // sparse — non-plain only
  units: Unit[];
  victory: VictoryCondition[];
  turnLimit?: number;
  ai: AiScript;
  preBattleDecision?: Decision;
  postBattleDispatch?: string; // filename under src/dispatches
}

// Events emitted by every state-changing engine call. Cumulative array forms the replay log.
export type BattleEvent =
  | { kind: 'turn-started'; turn: number; side: Side }
  | { kind: 'unit-moved'; unitId: string; from: Pos; to: Pos; cost: number }
  | { kind: 'formation-changed'; unitId: string; from: Formation; to: Formation }
  | { kind: 'attack-resolved'; attackerId: string; defenderId: string;
      result: 'attacker-broken' | 'attacker-repulsed' | 'exchange'
            | 'defender-retreats' | 'defender-broken';
      attackerLoss: number; defenderLoss: number;
      attackerScore: number; defenderScore: number; }
  | { kind: 'morale-revealed'; unitId: string; morale: Morale }
  | { kind: 'unit-eliminated'; unitId: string }
  | { kind: 'unit-retreated'; unitId: string; from: Pos; to: Pos }
  | { kind: 'turn-ended'; turn: number; side: Side }
  | { kind: 'victory'; side: Side; reason: string };

export type GamePhase = 'orders' | 'end-of-turn';

export interface GameState {
  schemaVersion: 1;
  campaignId: 'ulm-austerlitz-1805';
  scenarioIndex: number;
  scenarioId: string;
  units: Unit[];
  currentSide: Side;
  turn: number;
  phase: GamePhase;
  selectedUnitId: string | null;
  log: BattleEvent[];
  decisionsTaken: { decisionId: string; optionIndex: number }[];
  outcomes: { scenarioId: string; victor: Side; turnsTaken: number }[];
  pendingDecisionId: string | null;
}

export type VictoryStatus =
  | { kind: 'in-progress' }
  | { kind: 'decided'; victor: Side; reason: string };
