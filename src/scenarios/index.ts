import { wertingen } from './01-wertingen';
import { haslach } from './02-haslach';
import { elchingen } from './03-elchingen';
import { ulm } from './04-ulm';
import { krems } from './05-krems';
import { schongrabern } from './06-schongrabern';
import { austerlitz } from './07-austerlitz';
import type { Scenario } from '../engine/types';

export const campaignScenarios: Scenario[] = [
  wertingen, haslach, elchingen, ulm, krems, schongrabern, austerlitz,
];
export const getScenarioByIndex = (i: number): Scenario | undefined => campaignScenarios[i];
export const getScenarioById = (id: string): Scenario | undefined =>
  campaignScenarios.find(s => s.id === id);
