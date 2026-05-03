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

        <h3 className="font-bold mt-4">Turns &amp; ending your turn</h3>
        <p className="text-sm">Each battle has a <strong>turn limit</strong> — shown in the top bar as <em>Turn X / Y</em>. One turn is one round where each side gets to move and attack with their units.</p>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>On your turn, every unit can <strong>move</strong> once and <strong>attack/change formation</strong> once. A unit that has done both fades out.</li>
          <li>Hit <strong>End Turn</strong> when you're done. The button asks for confirmation — and warns you if you have units that haven't acted yet (<em>"Confirm? 3 units haven't acted yet"</em> means you'd be wasting their turn). Tap again to confirm, or anywhere else to cancel.</li>
          <li>If the turn limit runs out, victory conditions decide who wins. <em>Survive to turn N</em> means the defender wins if no one has lost first; a hit-and-hold goal needs you to capture the tile <em>before</em> the limit.</li>
          <li>Look at the small chips above the board — they show your French objectives and how close you are to each.</li>
        </ul>

        <h3 className="font-bold mt-4">Combat — who can attack whom</h3>
        <p className="text-sm">Any unit can attack any adjacent enemy. The only requirements:</p>
        <ul className="list-disc list-inside text-sm">
          <li>Target must be on the next square (the 8 squares around you).</li>
          <li>It's your side's turn AND the unit hasn't already attacked.</li>
          <li>Target is on the other team. (Austria + Russia count as one team — they can't attack each other.)</li>
        </ul>

        <p className="text-sm mt-3">Combat compares <code>strength + terrain + flank + formation + morale</code> on each side. Larger gap is better for the higher side.</p>
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

        <h3 className="font-bold mt-3">Matchups cheatsheet</h3>
        <table className="text-sm border w-full mt-2 mb-3">
          <thead className="bg-parchmentDark">
            <tr>
              <th className="p-1 text-left">If you're attacking…</th>
              <th className="p-1 text-left">Best formation</th>
              <th className="p-1 text-left">Avoid</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-1">Infantry (LI / Li / Gr)</td>
              <td className="p-1"><strong>Line</strong> (+1 in firefights)</td>
              <td className="p-1">Column (−1)</td>
            </tr>
            <tr>
              <td className="p-1">Cavalry (LC / HC)</td>
              <td className="p-1"><strong>Square</strong> (+2 vs cavalry)</td>
              <td className="p-1">Line/column — they get a +1 charge against you</td>
            </tr>
            <tr>
              <td className="p-1">Artillery (FA / HA)</td>
              <td className="p-1">Line or column</td>
              <td className="p-1"><strong>Square</strong> (−2 vs artillery)</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs italic opacity-80">Cavalry attackers also get +1 when charging non-square infantry. Hover an enemy or check the AttackPreview panel — it shows the predicted gap before you commit.</p>

        <h3 className="font-bold mt-3">Terrain (defender bonus)</h3>
        <ul className="list-disc list-inside text-sm">
          <li>Hill / Forest / Town: +1 defence</li>
          <li>River: impassable except at bridges</li>
          <li>Marsh: triple movement cost</li>
        </ul>

        <h3 className="font-bold mt-3">Formations</h3>
        <ul className="list-disc list-inside text-sm">
          <li><strong>Line</strong> — +1 in firefights with infantry</li>
          <li><strong>Column</strong> — +1 movement; −1 in firefights with infantry</li>
          <li><strong>Square</strong> — +2 vs cavalry, −2 vs artillery (no firefight bonus)</li>
        </ul>
        <p className="text-xs italic opacity-80 mt-1">Change formation by selecting your unit and tapping Line / Column / Square in the action bar. Changing formation uses the unit's action for the turn.</p>

        <h3 className="font-bold mt-3">Morale (hidden)</h3>
        <p className="text-sm">Each unit has a hidden morale of 1 (Conscript), 2 (Veteran), or 3 (Elite). The defender's morale is revealed the first time they're attacked.</p>

        <h3 className="font-bold mt-3">Solo mode &amp; AI difficulty</h3>
        <p className="text-sm">When <strong>Play solo</strong> is on (set on the splash), the computer plays the Coalition during their turns. Three difficulty levels:</p>
        <ul className="list-disc list-inside text-sm mt-1">
          <li><strong>Easy</strong> — AI attacks any enemy it touches, never forms square. Will throw weak units away.</li>
          <li><strong>Normal</strong> — AI uses combat math, skips losing fights, and forms square against cavalry.</li>
          <li><strong>Hard</strong> — Normal plus: only attacks if predicted to <em>win</em>, and on the move targets the weakest enemy it can reach (flanking).</li>
        </ul>

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
