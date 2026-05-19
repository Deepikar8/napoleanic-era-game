import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BattleBoard } from '../../src/ui/BattleBoard';
import { wertingen } from '../../src/scenarios/01-wertingen';
import type { GameState, Scenario } from '../../src/engine/types';

const scenario: Scenario = {
  ...wertingen,
  units: wertingen.units.map((unit, index) => {
    if (index === 0) return { ...unit, formation: 'line' };
    if (index === 1) return { ...unit, formation: 'column' };
    if (index === 2) return { ...unit, formation: 'square' };
    return unit;
  }),
};

const state: GameState = {
  schemaVersion: 1,
  campaignId: 'ulm-austerlitz-1805',
  scenarioIndex: 0,
  scenarioId: scenario.id,
  units: scenario.units,
  currentSide: 'french',
  turn: 1,
  phase: 'orders',
  selectedUnitId: null,
  log: [],
  decisionsTaken: [],
  outcomes: [],
  pendingDecisionId: null,
  pendingPatches: {},
  triggersFired: [],
};

describe('BattleBoard', () => {
  it('renders compact markers for every formation when details are visible', () => {
    render(
      <BattleBoard
        scenario={scenario}
        state={state}
        selectedUnitId={null}
        hoveredEnemyId={null}
        showDetails
        onSelectUnit={vi.fn()}
        onMoveTo={vi.fn()}
        onAttack={vi.fn()}
        onHoverEnemy={vi.fn()}
      />,
    );

    expect(screen.getAllByLabelText('Formation: line')).not.toHaveLength(0);
    expect(screen.getByLabelText('Formation: column')).toBeInTheDocument();
    expect(screen.getByLabelText('Formation: square')).toBeInTheDocument();
  });

  it('hides default line markers when details are not visible', () => {
    render(
      <BattleBoard
        scenario={scenario}
        state={state}
        selectedUnitId={null}
        hoveredEnemyId={null}
        onSelectUnit={vi.fn()}
        onMoveTo={vi.fn()}
        onAttack={vi.fn()}
        onHoverEnemy={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Formation: line')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Formation: column')).toBeInTheDocument();
    expect(screen.getByLabelText('Formation: square')).toBeInTheDocument();
  });

  it('keeps formation glyphs inside their compact badges', () => {
    const { container } = render(
      <BattleBoard
        scenario={scenario}
        state={state}
        selectedUnitId={null}
        hoveredEnemyId={null}
        showDetails
        onSelectUnit={vi.fn()}
        onMoveTo={vi.fn()}
        onAttack={vi.fn()}
        onHoverEnemy={vi.fn()}
      />,
    );

    for (const formation of ['column', 'square']) {
      const marker = container.querySelector(`[aria-label="Formation: ${formation}"]`);
      const badge = marker?.querySelector('rect');
      const glyph = marker?.querySelector('path');
      expect(marker).not.toBeNull();
      expect(badge).not.toBeNull();
      expect(glyph).not.toBeNull();

      const badgeX = Number(badge!.getAttribute('x'));
      const badgeRight = badgeX + Number(badge!.getAttribute('width'));
      const strokeWidth = Number(glyph!.getAttribute('stroke-width'));
      const pathMaxX = Math.max(
        ...Array.from(glyph!.getAttribute('d')!.matchAll(/[MH]\s*([0-9.]+)/g), match => Number(match[1])),
      );
      const transformX = Number(glyph!.getAttribute('transform')!.match(/translate\(([0-9.]+)/)?.[1] ?? 0);

      expect(transformX + pathMaxX + strokeWidth / 2).toBeLessThanOrEqual(badgeRight);
    }
  });

  it('shows cohesion markers directly on affected units', () => {
    render(
      <BattleBoard
        scenario={scenario}
        state={{
          ...state,
          units: state.units.map((unit, index) => {
            if (index === 0) return { ...unit, cohesion: 1 };
            if (index === 1) return { ...unit, cohesion: -1 };
            return unit;
          }),
        }}
        selectedUnitId={null}
        hoveredEnemyId={null}
        onSelectUnit={vi.fn()}
        onMoveTo={vi.fn()}
        onAttack={vi.fn()}
        onHoverEnemy={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Cohesion +1')).toBeInTheDocument();
    expect(screen.getByLabelText('Cohesion -1')).toBeInTheDocument();
  });

  it('shows morale stars for the configured player team, not always France', () => {
    const britishPlayerScenario: Scenario = {
      ...scenario,
      playerSide: 'british',
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
          morale: 3,
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
    };
    const britishPlayerState: GameState = {
      ...state,
      campaignId: 'peninsular-war-1808',
      scenarioId: britishPlayerScenario.id,
      units: britishPlayerScenario.units,
      currentSide: 'british',
    };

    render(
      <BattleBoard
        scenario={britishPlayerScenario}
        state={britishPlayerState}
        selectedUnitId={null}
        hoveredEnemyId={null}
        showDetails
        onSelectUnit={vi.fn()}
        onMoveTo={vi.fn()}
        onAttack={vi.fn()}
        onHoverEnemy={vi.fn()}
      />,
    );

    expect(screen.getByText('★★')).toBeInTheDocument();
    expect(screen.queryByText('★★★')).not.toBeInTheDocument();
  });
});
