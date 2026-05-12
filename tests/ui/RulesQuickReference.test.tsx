import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RulesQuickReference } from '../../src/ui/RulesQuickReference';
import type { Unit } from '../../src/engine/types';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry',
  position: { x: 0, y: 0 },
  facing: 'N',
  formation: 'line',
  strength: 4,
  morale: 2,
  cohesion: 0,
  ...over,
});

describe('RulesQuickReference', () => {
  it('summarizes the current tactical rules', () => {
    render(<RulesQuickReference selectedUnit={null} allUnits={[]} />);

    expect(screen.getByText(/Friendly within 2 tiles/i)).toBeInTheDocument();
    expect(screen.getByText(/Adjacent friendly/i)).toBeInTheDocument();
    expect(screen.getByText(/Open tile away/i)).toBeInTheDocument();
    expect(screen.getByText(/Range 3/i)).toBeInTheDocument();
  });

  it('shows selected-unit command and support context', () => {
    const selected = u({ id: 'fr1', side: 'french', position: { x: 1, y: 1 }, cohesion: -1 });
    const commandFriend = u({ id: 'fr2', side: 'french', position: { x: 1, y: 3 } });
    const supportFriend = u({ id: 'fr3', side: 'french', position: { x: 2, y: 1 } });

    render(
      <RulesQuickReference
        selectedUnit={selected}
        allUnits={[selected, commandFriend, supportFriend]}
      />,
    );

    expect(screen.getByText(/Selected: in command/i)).toBeInTheDocument();
    expect(screen.getByText(/supported \+1/i)).toBeInTheDocument();
    expect(screen.getByText(/cohesion -1/i)).toBeInTheDocument();
  });
});
