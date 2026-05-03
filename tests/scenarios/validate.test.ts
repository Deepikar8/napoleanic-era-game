import { describe, it, expect } from 'vitest';
import { campaignScenarios } from '../../src/scenarios';
import { inBounds } from '../../src/engine/grid';

describe('scenario validation', () => {
  for (const s of campaignScenarios) {
    describe(s.id, () => {
      it('all units in bounds', () => {
        for (const u of s.units) {
          expect(inBounds(u.position, s.grid)).toBe(true);
        }
      });

      it('unit IDs are unique', () => {
        const ids = s.units.map(u => u.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('no two units share a square', () => {
        const seen = new Set<string>();
        for (const u of s.units) {
          const k = `${u.position.x},${u.position.y}`;
          expect(seen.has(k)).toBe(false);
          seen.add(k);
        }
      });

      it('victory conditions reference real units', () => {
        for (const c of s.victory) {
          if (c.kind === 'eliminate-unit') {
            const id = c.args.unitId as string;
            expect(s.units.some(u => u.id === id)).toBe(true);
          }
        }
      });

      it('all tiles in bounds', () => {
        for (const t of s.tiles) {
          expect(inBounds(t.pos, s.grid)).toBe(true);
        }
      });

      it('has at least one victory condition for each side present', () => {
        const sides = new Set(s.units.map(u => u.side));
        const condFors = new Set(s.victory.map(v => v.for));
        for (const side of sides) {
          expect(condFors.has(side)).toBe(true);
        }
      });
    });
  }
});
