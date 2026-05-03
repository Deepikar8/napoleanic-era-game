import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

export const campaignScenarios: Scenario[] = [
  austerlitz,
];

export const getScenarioByIndex = (i: number): Scenario | undefined =>
  campaignScenarios[i];

export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
