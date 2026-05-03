import { useGame } from '../state/store';
import { Button, Panel } from './shared';
import { checkVictory } from '../engine';

export function BattleEndScreen() {
  const { state, scenario, advanceAfterBattle, goto } = useGame();
  if (!state || !scenario) return null;
  const v = checkVictory(state, scenario.victory);
  const banner = v.kind === 'decided' ? v.victor.toUpperCase() : 'Stalemate';
  const reason = v.kind === 'decided' ? v.reason : 'Turn limit reached';

  return (
    <main className="min-h-full flex items-center justify-center p-6 bg-parchment text-ink">
      <div className="max-w-md w-full text-center">
        <div className="font-serif text-5xl mb-1">{banner}</div>
        <p className="italic opacity-80 mb-6">{reason}</p>
        <Panel title="Battle summary">
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>Battle</span><span className="font-semibold">{scenario.title}</span></div>
            <div className="flex justify-between"><span>Turns taken</span><span className="font-semibold">{state.turn}</span></div>
            <div className="flex justify-between"><span>Events logged</span><span className="font-semibold">{state.log.length}</span></div>
          </div>
        </Panel>
        <div className="mt-4 flex gap-2 justify-center">
          <Button kind="secondary" onClick={() => goto('campaign-menu')}>Campaign Menu</Button>
          <Button onClick={advanceAfterBattle}>Continue</Button>
        </div>
      </div>
    </main>
  );
}
