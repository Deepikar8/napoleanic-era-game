import { useEffect, useState } from 'react';
import type { Side } from './engine/types';
import { useGame } from './state/store';
import { Splash } from './ui/Splash';
import { CampaignMenu } from './ui/CampaignMenu';
import { BattleEndScreen } from './ui/BattleEndScreen';
import { ReplayViewer } from './ui/ReplayViewer';
import { DispatchScreen } from './ui/DispatchScreen';
import { HelpOverlay } from './ui/HelpOverlay';
import { CampaignEndScreen } from './ui/CampaignEndScreen';
import { ErrorToast } from './ui/ErrorToast';
import { TutorialHint } from './ui/TutorialHint';
import { BattleBoard } from './ui/BattleBoard';
import { UnitPanel } from './ui/UnitPanel';
import { AttackPreview } from './ui/AttackPreview';
import { BattleLog } from './ui/BattleLog';
import { Button } from './ui/shared';
import { UnitSpriteDefs } from './art/unit-silhouettes';
import { checkVictory } from './engine';

export default function App() {
  const screen = useGame(s => s.screen);

  let body;
  switch (screen) {
    case 'splash':         body = <Splash />; break;
    case 'campaign-menu':  body = <CampaignMenu />; break;
    case 'battle':         body = <BattleScreen />; break;
    case 'battle-end':     body = <BattleEndScreen />; break;
    case 'replay':         body = <ReplayViewer />; break;
    case 'dispatch':       body = <DispatchScreen />; break;
    case 'campaign-end':   body = <CampaignEndScreen />; break;
    default:               body = <Splash />;
  }
  return (<>{body}<HelpOverlay /><ErrorToast /></>);
}

function BattleScreen() {
  const {
    state, scenario, selectedUnitId, hoveredEnemyId,
    selectUnit, hoverEnemy, doMove, doAttack, doFormation, doEndTurn, undo,
    saveCurrent, toggleHelp, showDetails, toggleDetails,
  } = useGame();

  useEffect(() => { saveCurrent(); }, [state?.turn, state?.currentSide]);

  const [endTurnArmed, setEndTurnArmed] = useState(false);
  useEffect(() => { setEndTurnArmed(false); }, [state?.turn, state?.currentSide]);
  useEffect(() => {
    if (!endTurnArmed) return;
    const t = setTimeout(() => setEndTurnArmed(false), 4000);
    return () => clearTimeout(t);
  }, [endTurnArmed]);

  if (!state || !scenario) return <Splash />;

  const COALITION: Side[] = ['austrian', 'russian'];
  const sideCanAct = (side: Side) =>
    state.currentSide === 'french' ? side === 'french' : COALITION.includes(side);
  const unspentCount = state.units.filter(u => sideCanAct(u.side) && !u.hasActed).length;
  const onEndTurn = () => {
    if (endTurnArmed) { setEndTurnArmed(false); doEndTurn(); }
    else setEndTurnArmed(true);
  };

  const selected = selectedUnitId ? state.units.find(u => u.id === selectedUnitId) ?? null : null;
  const hoveredEnemy = hoveredEnemyId ? state.units.find(u => u.id === hoveredEnemyId) ?? null : null;
  const v = checkVictory(state, scenario.victory);

  return (
    <div className="min-h-full p-4 grid grid-cols-[1fr_320px] gap-4">
      <UnitSpriteDefs />
      <div className="flex flex-col">
        <header className="flex items-center justify-between mb-2 bg-ink text-parchment px-3 py-2 rounded">
          <div>
            <span className="font-bold uppercase">{state.currentSide}</span>
            <span className="ml-3 text-sm">Turn {state.turn} / {scenario.turnLimit ?? '∞'}</span>
          </div>
          <div className="text-xs opacity-80">{scenario.title}</div>
        </header>
        <TutorialHint />
        <BattleBoard
          scenario={scenario}
          state={state}
          selectedUnitId={selectedUnitId}
          hoveredEnemyId={hoveredEnemyId}
          showDetails={showDetails}
          onSelectUnit={selectUnit}
          onMoveTo={doMove}
          onAttack={doAttack}
          onHoverEnemy={hoverEnemy}
        />
        <div className="mt-3 flex gap-2 items-center">
          <Button onClick={undo} kind="secondary">Undo</Button>
          <Button onClick={toggleHelp} kind="secondary">?</Button>
          <Button onClick={toggleDetails} kind="secondary">{showDetails ? 'Hide details' : 'Show details'}</Button>
          <div className="flex-1" />
          {selected && (
            <>
              <Button onClick={() => doFormation('line')}   kind="secondary">Line</Button>
              <Button onClick={() => doFormation('column')} kind="secondary">Column</Button>
              <Button onClick={() => doFormation('square')} kind="secondary">Square</Button>
            </>
          )}
          <Button onClick={onEndTurn} kind={endTurnArmed ? 'danger' : 'primary'}>
            {endTurnArmed
              ? (unspentCount > 0 ? `End anyway? (${unspentCount} unspent)` : 'Confirm end turn')
              : 'End Turn'}
          </Button>
        </div>
      </div>
      <aside>
        <UnitPanel unit={selected} />
        <AttackPreview
          attacker={selected} defender={hoveredEnemy}
          allUnits={state.units} tiles={scenario.tiles}
        />
        <BattleLog events={state.log} />
        {v.kind === 'decided' && (
          <div className="bg-gilt text-ink p-3 rounded mt-3 text-sm">
            Victory: <strong>{v.victor}</strong> — {v.reason}
          </div>
        )}
      </aside>
    </div>
  );
}
