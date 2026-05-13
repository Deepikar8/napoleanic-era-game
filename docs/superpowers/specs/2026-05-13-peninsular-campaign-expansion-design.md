# Peninsular Campaign Expansion Design

## Goal

Expand the Peninsular War campaign from three to six battles while keeping the campaign focused on strategy learning. The new battles should teach why the Anglo-Portuguese and Spanish coalition increasingly succeeded against France: disciplined defense, terrain leverage, operational patience, and punishing overextension.

## Campaign Additions

Add three battles after Talavera:

1. Vimeiro, 1808
   - Lesson: disciplined line defense can absorb and punish French attack columns.
   - Player side: British/Portuguese.
   - Shape: hold ridge and village positions, use artillery and support, and avoid an early pursuit.

2. Busaco, 1810
   - Lesson: a tactical victory can serve an operational withdrawal.
   - Player side: British/Portuguese.
   - Shape: defend the ridge, preserve cohesion, and force French losses before they can turn the line.

3. Salamanca, 1812
   - Lesson: an overextended enemy can be defeated by rapid concentration at one point.
   - Player side: British/Portuguese.
   - Shape: exploit a stretched French line, break one wing, and keep attackers in command.

The existing Peninsular battles remain unchanged in order and framing:

- Bailen: overextension and trapped retreat.
- Somosierra: tempo and shock through a defended pass.
- Talavera: prepared defense and costly frontal attacks.

## Engine And UI Model

Add an optional `playerSide` field to `Scenario`. It defaults to `french` so the existing 1805 campaign and the first three Peninsular battles continue behaving as they do now.

For Vimeiro, Busaco, and Salamanca, set `playerSide: 'british'`. Because the existing coalition model already lets coalition partners act together, British player control also allows Portuguese units to act during the player turn.

The UI and store should use `scenario.playerSide` instead of hardcoded French assumptions for:

- player objective chips,
- whether selected units are treated as own units,
- when solo AI should run,
- human-facing side labels and animation captions where appropriate.

The AI should control the non-player team. In these new battles that means France acts as the AI side.

## Scenario Content

Each new battle includes:

- a scenario file in `src/scenarios`,
- briefing and post-battle dispatch markdown files,
- `lesson.before`, `lesson.during`, and `lesson.after`,
- a tactical hint,
- victory conditions for both player and AI,
- terrain and unit layouts that express the lesson without requiring new terrain types.

Victory conditions should stay short and readable. Preferred patterns:

- player: hold key terrain, preserve strength, or reduce French strength below a threshold,
- AI: capture key terrain or survive long enough after inflicting major damage.

## Balance Target

Keep battles comparable in length to the current Peninsular scenarios:

- Vimeiro: 7-8 turns.
- Busaco: 8-9 turns.
- Salamanca: about 8 turns.

The campaign should feel like six distinct strategy lessons rather than a long simulation of every Peninsular War phase.

## Tests And Verification

Update or add tests for:

- scenario validation across all six Peninsular battles,
- `playerSide` default behavior,
- player-side objective filtering,
- AI turn triggering when the player side is coalition,
- replay/save behavior remaining compatible when older scenarios lack `playerSide`.

Run the normal verification suite:

- `npm run build`
- `npm run lint`
- `npm test`

