import { useGame } from '../state/store';
import { Button } from './shared';

export function HelpOverlay() {
  const { helpOpen, toggleHelp } = useGame();
  if (!helpOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-6"
         onClick={toggleHelp}>
      <div className="bg-parchment text-ink max-w-2xl w-full rounded shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-2xl">How to Play</h2>
          <Button kind="secondary" onClick={toggleHelp}>Close</Button>
        </header>

        <h3 className="font-bold mt-4">Combat</h3>
        <p>Combat compares <code>strength + terrain + flank + formation + morale</code> on each side. Larger gap is better for the higher side.</p>
        <table className="text-sm border w-full mt-2 mb-3">
          <thead className="bg-parchmentDark"><tr><th className="p-1 text-left">Result gap</th><th className="p-1 text-left">Outcome</th></tr></thead>
          <tbody>
            <tr><td className="p-1">≤ −2</td><td className="p-1">Attacker breaks (−2 strength, retreats)</td></tr>
            <tr><td className="p-1">−1</td><td className="p-1">Attacker repulsed (−1 strength)</td></tr>
            <tr><td className="p-1">0 to +1</td><td className="p-1">Exchange (both lose 1)</td></tr>
            <tr><td className="p-1">+2</td><td className="p-1">Defender retreats</td></tr>
            <tr><td className="p-1">≥ +3</td><td className="p-1">Defender broken (−2 strength)</td></tr>
          </tbody>
        </table>

        <h3 className="font-bold">Terrain (defender bonus)</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Hill / Forest / Town: +1 defence</li>
          <li>River: impassable except at bridges</li>
          <li>Marsh: triple movement cost</li>
        </ul>

        <h3 className="font-bold mt-3">Formations</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Line — +1 in firefights</li>
          <li>Column — +1 movement; −1 in firefights</li>
          <li>Square — +2 vs cavalry, −2 vs artillery</li>
        </ul>

        <h3 className="font-bold mt-3">Morale (hidden)</h3>
        <p className="text-sm">Each unit has a hidden morale of 1 (Conscript), 2 (Veteran), or 3 (Elite). The defender's morale is revealed the first time they're attacked.</p>

        <h3 className="font-bold mt-3">Keyboard shortcuts</h3>
        <ul className="list-disc list-inside text-sm">
          <li><kbd className="px-1 border border-ink/40 rounded text-xs">Space</kbd> — end turn (press once to arm, again to confirm)</li>
          <li><kbd className="px-1 border border-ink/40 rounded text-xs">U</kbd> — undo last action this turn</li>
          <li><kbd className="px-1 border border-ink/40 rounded text-xs">Esc</kbd> — deselect / cancel</li>
          <li><kbd className="px-1 border border-ink/40 rounded text-xs">?</kbd> — open or close this help</li>
        </ul>
      </div>
    </div>
  );
}
