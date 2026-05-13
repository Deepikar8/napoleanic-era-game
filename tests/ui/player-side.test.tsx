import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/app';
import { beginBattle } from '../../src/engine';
import type { Scenario } from '../../src/engine/types';
import { useGame } from '../../src/state/store';

const playerSideScenario: Scenario = {
  id: 'player-side-ui',
  campaignId: 'peninsular-war-1808',
  playerSide: 'british',
  title: 'Player Side UI',
  briefingMd: 'test',
  grid: { width: 4, height: 4 },
  tiles: [],
  units: [
    {
      id: 'fr-line',
      side: 'french',
      type: 'line-infantry',
      position: { x: 0, y: 1 },
      facing: 'E',
      formation: 'line',
      strength: 4,
      morale: 2,
    },
    {
      id: 'br-line',
      side: 'british',
      type: 'line-infantry',
      position: { x: 3, y: 1 },
      facing: 'W',
      formation: 'line',
      strength: 4,
      morale: 2,
    },
  ],
  victory: [
    { for: 'british', kind: 'survive-turns', label: 'Hold the ridge', args: { turns: 3 } },
    { for: 'french', kind: 'capture-tile', label: 'French capture ridge', args: { pos: { x: 3, y: 1 } } },
  ],
  ai: { generalRule: 'defensive', triggers: [] },
};

describe('player-side UI', () => {
  beforeEach(() => {
    const state = beginBattle(playerSideScenario);
    useGame.setState({
      runId: 'test-run',
      state,
      scenario: playerSideScenario,
      history: [state],
      screen: 'battle',
      selectedUnitId: null,
      hoveredEnemyId: null,
      helpOpen: false,
      solo: false,
      muted: true,
      showDetails: true,
      aiDifficulty: 'normal',
      errorMessage: null,
      isAnimating: false,
      animatingHighlightIds: [],
      animatingMessage: null,
    });
  });

  it('shows objectives for the configured player side', () => {
    render(<App />);

    expect(screen.getByText(/Hold the ridge/i)).toBeInTheDocument();
    expect(screen.queryByText(/French capture ridge/i)).not.toBeInTheDocument();
  });
});
