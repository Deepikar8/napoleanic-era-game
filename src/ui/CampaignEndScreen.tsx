import { useGame } from '../state/store';
import { campaignScenarios } from '../scenarios';
import { Button, Panel } from './shared';

type Verdict = 'triumph' | 'partial' | 'defeat';

function verdict(state: { outcomes: { victor: string }[] } | null): Verdict {
  if (!state) return 'defeat';
  const wins = state.outcomes.filter(o => o.victor === 'french').length;
  if (wins >= campaignScenarios.length) return 'triumph';
  if (wins >= Math.ceil(campaignScenarios.length / 2)) return 'partial';
  return 'defeat';
}

const TEXT: Record<Verdict, { title: string; body: string }> = {
  triumph: {
    title: 'Historical Triumph',
    body: 'The campaign ends as it did in 1805. Mack capitulates at Ulm; Kutuzov is shattered at Austerlitz. The Holy Roman Empire dissolves within months. France is supreme on the Continent.',
  },
  partial: {
    title: 'Partial Victory',
    body: 'You have won the war, but at higher cost than history records. The Coalition retires to lick its wounds; Vienna falls but a Russian army survives intact, ready to fight again.',
  },
  defeat: {
    title: 'Alt-History Reverse',
    body: 'In this version of 1805, the Grande Armée\'s gamble fails. Napoleon retreats over the Rhine. Talleyrand is already drafting the abdication.',
  },
};

export function CampaignEndScreen() {
  const { state, goto } = useGame();
  const v = verdict(state);
  const text = TEXT[v];

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="font-serif text-5xl mb-2">{text.title}</h1>
        <p className="font-serif text-lg italic opacity-80 mb-6">{text.body}</p>
        <Panel title="Battle results">
          <ul className="text-sm space-y-1">
            {state?.outcomes.map(o => (
              <li key={o.scenarioId} className="flex justify-between">
                <span>{o.scenarioId}</span>
                <span className={o.victor === 'french' ? 'text-french font-semibold' : 'opacity-70'}>
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
