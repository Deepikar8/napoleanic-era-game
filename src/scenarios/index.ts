import { wertingen } from './01-wertingen';
import { schongrabern } from './06-schongrabern';
import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

export const campaignScenarios: Scenario[] = [
  wertingen,    // [0]
  schongrabern, // [1]
  austerlitz,   // [2]
];

export const getScenarioByIndex = (i: number): Scenario | undefined => campaignScenarios[i];
export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
