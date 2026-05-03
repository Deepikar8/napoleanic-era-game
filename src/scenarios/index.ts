import { wertingen } from './01-wertingen';
import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

export const campaignScenarios: Scenario[] = [
  wertingen,    // [0]
  austerlitz,   // [1] — rest of the campaign filled in Phase 3
];

export const getScenarioByIndex = (i: number): Scenario | undefined => campaignScenarios[i];
export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
