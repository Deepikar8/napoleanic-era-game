import { useGame } from '../state/store';
import { getCampaignById, getScenarioById } from '../scenarios';
import { Button, Panel } from './shared';
import type { CampaignId } from '../engine/types';

type Verdict = 'triumph' | 'partial' | 'defeat';

function verdict(state: { campaignId: CampaignId; outcomes: { victor: string }[] } | null): Verdict {
  if (!state) return 'defeat';
  const campaign = getCampaignById(state.campaignId);
  const wins = state.outcomes.filter(o => o.victor === 'french').length;
  if (wins >= campaign.scenarios.length) return 'triumph';
  if (wins >= Math.ceil(campaign.scenarios.length / 2)) return 'partial';
  return 'defeat';
}

export function CampaignEndScreen() {
  const { state, goto } = useGame();
  const campaign = getCampaignById(state?.campaignId ?? 'ulm-austerlitz-1805');
  const v = verdict(state);
  const text = campaign.endText[v];

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="font-serif text-5xl mb-2">{text.title}</h1>
        <p className="text-sm uppercase tracking-wider opacity-60 mb-2">{campaign.title}</p>
        <p className="font-serif text-lg italic opacity-80 mb-6">{text.body}</p>
        <Panel title="Battle results">
          <ul className="text-sm space-y-1">
            {state?.outcomes.map(o => (
              <li key={o.scenarioId} className="flex justify-between gap-2">
                <span className="truncate">{getScenarioById(o.scenarioId)?.title ?? o.scenarioId}</span>
                <span className={o.victor === 'french' ? 'text-french font-semibold whitespace-nowrap' : 'opacity-70 whitespace-nowrap'}>
                  {o.victor} · turn {o.turnsTaken}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="mt-4">
          <Button onClick={() => goto('splash')}>Begin again</Button>
        </div>
      </div>
    </main>
  );
}
