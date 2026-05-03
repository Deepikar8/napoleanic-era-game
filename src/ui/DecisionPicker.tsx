import { marked } from 'marked';
import { useGame } from '../state/store';
import type { Decision } from '../engine/types';
import { Button, Panel } from './shared';
import { applyPatch, beginBattle } from '../engine';

export function DecisionPicker({ decision }: { decision: Decision }) {
  const { state, scenario, goto } = useGame();
  if (!state || !scenario) return null;

  const promptHtml = marked.parse(decision.promptMd, { async: false }) as string;

  const choose = (i: number) => {
    useGame.setState(s => {
      const newDecisions = [...s.state!.decisionsTaken, { decisionId: decision.id, optionIndex: i }];
      const patched = applyPatch(scenario, decision.options[i].patch);
      const fresh = beginBattle(patched, newDecisions);
      fresh.scenarioIndex = s.state!.scenarioIndex;
      fresh.outcomes = s.state!.outcomes;
      return { state: fresh, scenario: patched, history: [fresh] };
    });
    goto('battle');
  };

  return (
    <Panel title="Your decision">
      <div className="prose prose-stone max-w-none mb-3"
           dangerouslySetInnerHTML={{ __html: promptHtml }} />
      <div className="space-y-2">
        {decision.options.map((o, i) => (
          <div key={i}><Button onClick={() => choose(i)} kind="secondary">{o.label}</Button></div>
        ))}
      </div>
    </Panel>
  );
}
