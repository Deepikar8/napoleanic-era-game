import { useEffect, useRef, useState } from 'react';
import { useGame } from './state/store';
import { isOnActiveSide, sameTeam } from './engine/sides';
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
import { UnitReference } from './ui/UnitReference';
import { AttackPreview } from './ui/AttackPreview';
import { BattleLog } from './ui/BattleLog';
import { Button } from './ui/shared';
import { UnitSpriteDefs } from './art/unit-silhouettes';
import { checkVictory, summarizeVictory, legalMoves, canAttackUnit } from './engine';

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
    isAnimating, animatingHighlightIds, animatingMessage,
  } = useGame();

  useEffect(() => { saveCurrent(); }, [state?.turn, state?.currentSide]);

  const [endTurnArmed, setEndTurnArmed] = useState(false);
  useEffect(() => { setEndTurnArmed(false); }, [state?.turn, state?.currentSide]);
  useEffect(() => {
    if (!endTurnArmed) return;
    const t = setTimeout(() => setEndTurnArmed(false), 4000);
    return () => clearTimeout(t);
  }, [endTurnArmed]);

  // Keyboard shortcuts: Space=end turn, U=undo, Esc=deselect, ?=help
  const armedRef = useRef(false);
  armedRef.current = endTurnArmed;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const g = useGame.getState();
      if (g.isAnimating || !g.state || !g.scenario || g.screen !== 'battle') return;

      if (e.key === ' ') {
        e.preventDefault();
        if (armedRef.current) { setEndTurnArmed(false); g.doEndTurn(); }
        else setEndTurnArmed(true);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        g.undo();
      } else if (e.key === 'Escape') {
        g.selectUnit(null);
        setEndTurnArmed(false);
      } else if (e.key === '?' || e.key === '/') {
        g.toggleHelp();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!state || !scenario) return <Splash />;

  const sideCanAct = (side: typeof state.currentSide) => isOnActiveSide(side, state.currentSide);
  const hasAustrian = scenario.units.some(u => u.side === 'austrian');
  const hasRussian = scenario.units.some(u => u.side === 'russian');
  const sideLabel = state.currentSide === 'french'
    ? 'french'
    : (hasAustrian && hasRussian ? 'coalition' : state.currentSide);
  // Count units that *actually* still have an action available — has any legal
  // move target OR has an adjacent enemy it could attack. A unit that moved to
  // an empty square with no enemies in reach should not count, even though
  // hasActed is still false.
  const actionableCount = state.units.filter(u => {
    if (!sideCanAct(u.side)) return false;
    const canStillMove = !u.hasMoved && legalMoves(u, state.units, scenario).length > 0;
    if (canStillMove) return true;
    if (!u.hasActed) {
      const hasEnemyInRange = state.units.some(o =>
        !sameTeam(o.side, u.side) && canAttackUnit(u, o));
      if (hasEnemyInRange) return true;
    }
    return false;
  }).length;
  const onEndTurn = () => {
    if (endTurnArmed) { setEndTurnArmed(false); doEndTurn(); }
    else setEndTurnArmed(true);
  };

  const selected = selectedUnitId ? state.units.find(u => u.id === selectedUnitId) ?? null : null;
  const hoveredEnemy = hoveredEnemyId ? state.units.find(u => u.id === hoveredEnemyId) ?? null : null;
  const v = checkVictory(state, scenario.victory);
  const objectives = summarizeVictory(state, scenario.victory).filter(o => o.for === 'french');

  return (
    <div className="battle-screen min-h-full p-4 grid grid-cols-1 md:grid-cols-[1fr_22rem] gap-4">
      <UnitSpriteDefs />
      <div className="flex flex-col">
        <header className="flex items-center justify-between mb-2 bg-ink text-parchment px-3 py-2 rounded">
          <div>
            <span className="font-bold uppercase">{sideLabel}</span>
            <span className="ml-3 text-sm">Turn {state.turn} of {scenario.turnLimit ?? '∞'}</span>
          </div>
          <div className="text-xs opacity-80">{scenario.title}</div>
        </header>
        {objectives.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {objectives.map((o, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded border ${o.met ? 'bg-gilt text-ink border-gilt' : 'bg-parchmentDark text-ink border-ink/30'}`}
              >
                {o.label}
              </span>
            ))}
          </div>
        )}
        <TutorialHint />
        <BattleBoard
          scenario={scenario}
          state={state}
          selectedUnitId={selectedUnitId}
          hoveredEnemyId={hoveredEnemyId}
          showDetails={showDetails}
          highlightUnitIds={animatingHighlightIds}
          onSelectUnit={selectUnit}
          onMoveTo={doMove}
          onAttack={doAttack}
          onHoverEnemy={hoverEnemy}
        />
        {isAnimating && (
          <div className="mt-2 self-center bg-ink text-parchment px-4 py-2 rounded shadow text-sm font-semibold pointer-events-none max-w-md text-center">
            {animatingMessage ?? `${sideLabel === 'coalition' ? 'Coalition' : sideLabel.charAt(0).toUpperCase() + sideLabel.slice(1)} is moving…`}
          </div>
        )}
        <div className="mt-3 flex gap-2 items-center">
          <Button onClick={undo} kind="secondary" disabled={isAnimating}>Undo</Button>
          <Button onClick={toggleHelp} kind="secondary" disabled={isAnimating}>?</Button>
          <Button onClick={toggleDetails} kind="secondary" disabled={isAnimating}>{showDetails ? 'Hide details' : 'Show details'}</Button>
          <div className="flex-1" />
          {/* Formation buttons — only when YOUR unit is selected and could
              still take an action this turn. Disabled when the unit has
              already moved+attacked. Current formation highlighted as primary. */}
          {selected && sideCanAct(selected.side) && !isAnimating && (() => {
            const cantChange = !!selected.hasActed;
            return (
              <>
                <span className="text-sm text-parchment opacity-70 mr-1 self-center">Formation:</span>
                {(['line', 'column', 'square'] as const).map(f => (
                  <Button
                    key={f}
                    onClick={() => doFormation(f)}
                    kind={selected.formation === f ? 'primary' : 'secondary'}
                    disabled={cantChange || selected.formation === f}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </>
            );
          })()}
          <Button onClick={onEndTurn} kind={endTurnArmed ? 'danger' : 'primary'} disabled={isAnimating}>
            {endTurnArmed
              ? (actionableCount > 0
                  ? `Confirm? ${actionableCount} ${actionableCount === 1 ? 'unit can' : 'units can'} still move or attack`
                  : 'Confirm end turn')
              : 'End Turn'}
          </Button>
        </div>
      </div>
      <aside>
        <UnitPanel unit={selected} />
        <UnitReference />
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
