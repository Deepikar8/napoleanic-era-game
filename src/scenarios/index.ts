import { wertingen } from './01-wertingen';
import { haslach } from './02-haslach';
import { elchingen } from './03-elchingen';
import { ulm } from './04-ulm';
import { krems } from './05-krems';
import { schongrabern } from './06-schongrabern';
import { austerlitz } from './07-austerlitz';
import { bailen } from './08-bailen';
import { somosierra } from './09-somosierra';
import { talavera } from './10-talavera';
import { vimeiro } from './11-vimeiro';
import { busaco } from './12-busaco';
import type { Campaign, CampaignId, Scenario } from '../engine/types';

export const ulmAusterlitzScenarios: Scenario[] = [
  wertingen, haslach, elchingen, ulm, krems, schongrabern, austerlitz,
].map(s => ({ ...s, campaignId: 'ulm-austerlitz-1805' }));

export const peninsularWarScenarios: Scenario[] = [
  bailen, somosierra, talavera, vimeiro, busaco,
];

export const campaigns: Campaign[] = [
  {
    id: 'ulm-austerlitz-1805',
    title: '1805: Ulm to Austerlitz',
    subtitle: 'A classic Napoleonic campaign of speed, concentration, and decisive battle.',
    theme: 'Operational speed and concentration',
    thesis: 'The Grande Armee wins by moving faster than the Coalition can coordinate, then concentrating at the decisive point.',
    scenarios: ulmAusterlitzScenarios,
    endText: {
      triumph: {
        title: 'Historical Triumph',
        body: 'The campaign ends as it did in 1805. Mack capitulates at Ulm; Kutuzov is shattered at Austerlitz. The Holy Roman Empire dissolves within months. France is supreme on the Continent.',
      },
      partial: {
        title: 'Partial Victory',
        body: 'You have won the war, but at higher cost than history records. The Coalition retires to lick its wounds; Vienna falls but a Russian army survives intact, ready to fight again.',
      },
      defeat: {
        title: 'Alt-History Reverse',
        body: 'In this version of 1805, the Grande Armee\'s gamble fails. Napoleon retreats over the Rhine.',
      },
    },
  },
  {
    id: 'peninsular-war-1808',
    title: 'The Spanish Ulcer: Peninsular War',
    subtitle: 'A strategy-learning campaign about overextension, terrain, coalition defense, and logistics.',
    theme: 'Tactical victories under strategic strain',
    thesis: 'France can win battles in Spain, but the war punishes isolation, bad supply, and attacks that ignore terrain and local resistance.',
    scenarios: peninsularWarScenarios,
    endText: {
      triumph: {
        title: 'Strategic Breakthrough',
        body: 'You have done what France historically struggled to do: turn tactical strength into durable control. Roads stay open, defenses crack, and the campaign remains coherent.',
      },
      partial: {
        title: 'Costly Advance',
        body: 'You win ground, but every success costs cohesion and time. Spain is not conquered so much as temporarily pushed aside.',
      },
      defeat: {
        title: 'The Ulcer Deepens',
        body: 'The campaign consumes French strength without producing strategic decision. The lesson is brutal: battlefield courage cannot fix overextension.',
      },
    },
  },
];

// Backwards-compatible default used by existing tests and older UI paths.
export const campaignScenarios: Scenario[] = ulmAusterlitzScenarios;
export const allScenarios: Scenario[] = campaigns.flatMap(c => c.scenarios);
export const getCampaignById = (id: CampaignId): Campaign =>
  campaigns.find(c => c.id === id) ?? campaigns[0];
export const getCampaignScenarios = (id: CampaignId): Scenario[] =>
  getCampaignById(id).scenarios;
export const getScenarioByIndex = (i: number): Scenario | undefined => campaignScenarios[i];
export const getScenarioById = (id: string): Scenario | undefined =>
  allScenarios.find(s => s.id === id);
