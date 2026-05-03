import { useEffect, useState } from 'react';

const KEY = 'tutorial-hint-dismissed-v1';

export function TutorialHint() {
  const [dismissed, setDismissed] = useState(true);   // assume dismissed until we read

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    setDismissed(localStorage.getItem(KEY) === '1');
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore quota */ }
    setDismissed(true);
  };

  return (
    <div className="bg-gilt text-ink rounded p-3 mb-2 flex items-start gap-3 shadow">
      <div className="text-2xl leading-none">💡</div>
      <div className="flex-1 text-sm">
        <div className="font-bold mb-1">How to play a turn</div>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Tap one of your units (blue, with the gold border when picked).</li>
          <li>Tap a green tile to move there, or tap a red-edged enemy to threaten it.</li>
          <li>Tap the same enemy again to attack. Use <strong>End Turn</strong> when done.</li>
        </ol>
        <div className="mt-1 italic opacity-80">Stuck? Tap the <strong>?</strong> button for the rules.</div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-ink/70 hover:text-ink font-bold text-lg leading-none px-1"
        aria-label="Dismiss tutorial hint"
      >×</button>
    </div>
  );
}
