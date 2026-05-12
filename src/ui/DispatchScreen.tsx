import { marked } from 'marked';
import { useGame } from '../state/store';
import { loadDispatch } from '../dispatches/loader';
import { Button, Panel } from './shared';
import { DecisionPicker } from './DecisionPicker';

export function DispatchScreen() {
  const { state, scenario, goto } = useGame();
  if (!state || !scenario) return null;

  const md = loadDispatch(scenario.briefingMd);
  const html = marked.parse(md, { async: false }) as string;

  const decision = scenario.preBattleDecision;
  const decisionTaken = state.decisionsTaken.some(d => d.decisionId === decision?.id);

  return (
    <main className="min-h-full p-6 max-w-3xl mx-auto">
      <Panel>
        <article
          className="prose prose-stone font-serif text-lg leading-relaxed max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Panel>
      {scenario.tacticalHint && (
        <Panel title="Tactical guidance">
          <p className="text-sm leading-relaxed">{scenario.tacticalHint}</p>
        </Panel>
      )}
      {scenario.lesson && (
        <Panel title="Strategy lesson">
          <div className="text-sm leading-relaxed space-y-2">
            <p><strong>{scenario.lesson.principle}</strong></p>
            <p>{scenario.lesson.before}</p>
            <p className="italic opacity-80">{scenario.lesson.during}</p>
          </div>
        </Panel>
      )}
      {decision && !decisionTaken && <DecisionPicker decision={decision} />}
      {(!decision || decisionTaken) && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => goto('battle')}>Continue to battle →</Button>
        </div>
      )}
    </main>
  );
}
