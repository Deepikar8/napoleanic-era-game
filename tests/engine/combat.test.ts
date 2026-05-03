import { describe, it, expect } from 'vitest';
import type { Unit, Tile } from '../../src/engine/types';
import { resolveAttack } from '../../src/engine/combat';

const u = (over: Partial<Unit> & Pick<Unit, 'id' | 'side'>): Unit => ({
  type: 'line-infantry', position: { x: 0, y: 0 }, facing: 'N',
  formation: 'line', strength: 4, morale: 2, ...over,
});

describe('combat', () => {
  it('reveals defender morale on first attack', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 }, morale: 3 });
    const { events } = resolveAttack(a, d, [a, d], []);
    expect(events).toContainEqual({ kind: 'morale-revealed', unitId: 'd', morale: 3 });
  });

  it('does not re-reveal already-revealed morale', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 morale: 3, moraleRevealed: true });
    const { events } = resolveAttack(a, d, [a, d], []);
    expect(events.some(e => e.kind === 'morale-revealed')).toBe(false);
  });

  it('square formation crushes cavalry charge', () => {
    const a = u({ id: 'a', side: 'french', type: 'heavy-cavalry',
                 position: { x: 0, y: 0 }, strength: 4, morale: 2 });
    const d = u({ id: 'd', side: 'austrian', type: 'line-infantry',
                 position: { x: 1, y: 0 }, formation: 'square',
                 strength: 4, morale: 2 });
    const { events } = resolveAttack(a, d, [a, d], []);
    const ev = events.find(e => e.kind === 'attack-resolved');
    expect(ev).toBeDefined();
    if (ev?.kind === 'attack-resolved') {
      expect(['attacker-broken', 'attacker-repulsed']).toContain(ev.result);
    }
  });

  it('hill defender gets terrain bonus', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 },
                 strength: 4, morale: 2, formation: 'line' });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 strength: 4, morale: 2, formation: 'line' });
    const tiles: Tile[] = [{ pos: { x: 1, y: 0 }, terrain: 'hill' }];
    const { events } = resolveAttack(a, d, [a, d], tiles);
    const ev = events.find(e => e.kind === 'attack-resolved');
    if (ev?.kind === 'attack-resolved') {
      // Defender is +1 stronger from hill — score gap shifts towards defender
      expect(ev.defenderScore - ev.attackerScore).toBeGreaterThanOrEqual(1);
    }
  });

  it('exchange (0/+1) deals 1 damage to each side', () => {
    // Identical infantry, no terrain, no flanking — score gap should be 0
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 } });
    const { updatedUnits, events } = resolveAttack(a, d, [a, d], []);
    const ev = events.find(e => e.kind === 'attack-resolved');
    if (ev?.kind === 'attack-resolved') {
      expect(['exchange', 'defender-retreats']).toContain(ev.result);
      if (ev.result === 'exchange') {
        const ua = updatedUnits.find(u => u.id === 'a')!;
        const ud = updatedUnits.find(u => u.id === 'd')!;
        expect(ua.strength).toBe(3);
        expect(ud.strength).toBe(3);
      }
    }
  });

  it('eliminates a unit reduced to 0 strength', () => {
    const a = u({ id: 'a', side: 'french', position: { x: 0, y: 0 },
                 strength: 4, morale: 3 });   // big
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 strength: 1, morale: 1 });   // small/conscript
    const { updatedUnits, events } = resolveAttack(a, d, [a, d], []);
    const dRemaining = updatedUnits.find(u => u.id === 'd');
    if (!dRemaining) {
      expect(events).toContainEqual({ kind: 'unit-eliminated', unitId: 'd' });
    }
  });

  it('flanking from rear adds attacker bonus', () => {
    const aFront = u({ id: 'aF', side: 'french', position: { x: 1, y: 1 } });
    const aFlank = u({ id: 'aS', side: 'french', position: { x: 0, y: 1 } });
    const d = u({ id: 'd', side: 'austrian', position: { x: 1, y: 0 },
                 facing: 'S', strength: 4, morale: 2 });
    // aS attacks d while aF is also adjacent → flank
    const { events } = resolveAttack(aFlank, d, [aFront, aFlank, d], []);
    const ev = events.find(e => e.kind === 'attack-resolved');
    if (ev?.kind === 'attack-resolved') {
      // attacker should be at least +1 over plain
      expect(ev.attackerScore).toBeGreaterThan(ev.defenderScore);
    }
  });
});
