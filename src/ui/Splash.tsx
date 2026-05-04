import { useEffect, useState } from 'react';
import { useGame } from '../state/store';
import { localStorageBackend, type SavedRun } from '../state/save';
import { Button } from './shared';
import { campaignScenarios, getScenarioById } from '../scenarios';

export function Splash() {
  const {
    startNewRun, loadRun, goto, solo, setSolo, muted, setMuted,
    aiDifficulty, setAiDifficulty,
  } = useGame();
  const [runs, setRuns] = useState<SavedRun[]>([]);

  useEffect(() => { setRuns(localStorageBackend.list()); }, []);

  const onContinue = () => {
    const last = runs[0];
    if (!last) return;
    const scenario = getScenarioById(last.state.scenarioId) ?? campaignScenarios[0];
    loadRun(last.runId, scenario);
  };

  return (
    <main className="min-h-full flex items-center justify-center bg-parchment text-ink">
      <div className="max-w-xl w-full text-center px-6">
        <h1 className="font-serif text-5xl mb-1">1805</h1>
        <p className="font-serif text-xl italic mb-8 opacity-80">A Napoleonic Campaign</p>
        <div className="space-y-3">
          <div><Button onClick={() => startNewRun(campaignScenarios[0])}>New Campaign</Button></div>
          {runs.length > 0 && (() => {
            const last = runs[0];
            const sc = getScenarioById(last.state.scenarioId);
            const label = sc ? sc.title : last.state.scenarioId;
            return (
              <div><Button onClick={onContinue} kind="secondary">Continue: {label} · turn {last.state.turn}</Button></div>
            );
          })()}
          <div><Button onClick={() => goto('campaign-menu')} kind="secondary">Campaign Menu</Button></div>
          <div><Button onClick={() => goto('replay')} kind="secondary">Replay last run</Button></div>
          <label className="flex items-center justify-center gap-2 text-base pt-2 cursor-pointer select-none">
            <input type="checkbox" checked={solo} onChange={e => setSolo(e.target.checked)} />
            <span>Play solo (AI runs the Coalition)</span>
          </label>
          <fieldset className="flex items-center justify-center gap-3 text-base flex-wrap" disabled={!solo}>
            <legend className="contents">
              <span className={solo ? '' : 'opacity-50'}>AI difficulty:</span>
            </legend>
            {(['easy', 'normal', 'hard'] as const).map(d => (
              <label key={d} className={`cursor-pointer select-none ${solo ? '' : 'opacity-50'}`}>
                <input
                  type="radio"
                  name="difficulty"
                  checked={aiDifficulty === d}
                  onChange={() => setAiDifficulty(d)}
                  disabled={!solo}
                />
                {' '}{d.charAt(0).toUpperCase() + d.slice(1)}
              </label>
            ))}
          </fieldset>
          <label className="flex items-center justify-center gap-2 text-base cursor-pointer select-none">
            <input type="checkbox" checked={muted} onChange={e => setMuted(e.target.checked)} />
            <span>Mute (no drum or fife sounds)</span>
          </label>
        </div>
        <p className="mt-10 text-xs opacity-50">v1.14.6</p>
      </div>
    </main>
  );
}
