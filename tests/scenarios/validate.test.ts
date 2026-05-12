import { describe, it, expect } from 'vitest';
import { allScenarios } from '../../src/scenarios';
import { inBounds } from '../../src/engine/grid';

describe('scenario validation', () => {
  for (const s of allScenarios) {
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

      it('victory conditions reference real units (recursive into all-of)', () => {
        const checkRefs = (cond: typeof s.victory[number]): void => {
          if (cond.kind === 'eliminate-unit') {
            const id = cond.args.unitId as string;
            expect(s.units.some(u => u.id === id)).toBe(true);
          } else if (cond.kind === 'all-of') {
            const subs = cond.args.conditions as Array<typeof s.victory[number]>;
            for (const sub of subs) checkRefs(sub);
          }
        };
        for (const c of s.victory) checkRefs(c);
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
