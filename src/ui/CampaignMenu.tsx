import { useGame } from '../state/store';
import { campaignScenarios } from '../scenarios';
import { Button, Panel } from './shared';

export function CampaignMenu() {
  const { state, startNewRun, goto } = useGame();
  const reachedIndex = state?.scenarioIndex ?? -1;

  return (
    <main className="min-h-full p-6 max-w-2xl mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-3xl">1805 — Campaign</h2>
        <Button kind="secondary" onClick={() => goto('splash')}>Back</Button>
      </header>
      <Panel>
        <div className="space-y-2">
          {campaignScenarios.map((s, i) => {
            const locked = i > reachedIndex + 1;
            return (
              <div key={s.id} className="flex items-center justify-between border-b border-ink/20 last:border-0 py-2">
                <div>
                  <div className="font-bold">{i + 1}. {s.title}</div>
                  <div className="text-xs opacity-70">{s.units.length} units · {s.grid.width}×{s.grid.height}</div>
                </div>
                <Button
                  disabled={locked}
                  kind="secondary"
                  onClick={() => startNewRun(s)}
                >
                  {locked ? 'Locked' : 'Restart from here'}
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>
    </main>
  );
}
