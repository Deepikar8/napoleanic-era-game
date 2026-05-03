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
      const prev = s.state;
      if (!prev) return {};
      const opt = decision.options[i];
      const newDecisions = [...prev.decisionsTaken, { decisionId: decision.id, optionIndex: i }];
      // Accumulate the chosen option's downstream patches into pendingPatches.
      // beginBattle of a future scenario will consume the entry for its id.
      const newPending: typeof prev.pendingPatches = { ...prev.pendingPatches };
      if (opt.downstreamPatches) {
        for (const [scenarioId, patch] of Object.entries(opt.downstreamPatches)) {
          newPending[scenarioId] = [...(newPending[scenarioId] ?? []), patch];
        }
      }
      const patched = applyPatch(scenario, opt.patch);
      const fresh = beginBattle(patched, newDecisions, newPending);
      fresh.scenarioIndex = prev.scenarioIndex;
      fresh.outcomes = prev.outcomes;
      // beginBattle strips this scenario's pendingPatches entry; restore the
      // accumulated map for future scenarios.
      const carryForward: typeof newPending = { ...newPending };
      delete carryForward[patched.id];
      fresh.pendingPatches = carryForward;
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
