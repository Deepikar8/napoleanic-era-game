import { useGame } from '../state/store';
import { campaigns } from '../scenarios';
import { Button, Panel } from './shared';

export function CampaignMenu() {
  const { state, startNewRun, goto } = useGame();

  return (
    <main className="min-h-full p-6 max-w-3xl mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-3xl">Campaigns</h2>
        <Button kind="secondary" onClick={() => goto('splash')}>Back</Button>
      </header>
      {campaigns.map(campaign => {
        const reachedIndex = state?.campaignId === campaign.id ? state.scenarioIndex : -1;
        return (
          <Panel key={campaign.id} title={campaign.title}>
            <p className="text-sm mb-2">{campaign.subtitle}</p>
            <p className="text-xs italic opacity-75 mb-3">{campaign.thesis}</p>
            <div className="space-y-2">
              {campaign.scenarios.map((s, i) => {
                const locked = i > reachedIndex + 1;
                return (
                  <div key={s.id} className="flex items-center justify-between border-b border-ink/20 last:border-0 py-2 gap-3">
                    <div>
                      <div className="font-bold">{i + 1}. {s.title}</div>
                      <div className="text-xs opacity-70">
                        {s.lesson?.principle ?? `${s.units.length} units · ${s.grid.width}×${s.grid.height}`}
                      </div>
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
        );
      })}
    </main>
  );
}
