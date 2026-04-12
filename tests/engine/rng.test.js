// Property tests for engine/rng.js — the Mulberry32 PRNG.
// Determinism is a P2P-sync invariant; this suite guards it.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createRng, deriveSeed } from '../../engine/rng.js';

describe('createRng', () => {
  it('next() returns values in [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng = createRng(seed);
        for (let i = 0; i < 100; i++) {
          const v = rng.next();
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThan(1);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('same seed produces the same sequence (determinism)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const a = createRng(seed);
        const b = createRng(seed);
        for (let i = 0; i < 50; i++) {
          expect(a.next()).toBe(b.next());
        }
      }),
      { numRuns: 500 },
    );
  });

  it('nextInt(min, max) stays within bounds inclusive', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (seed, min, spread) => {
          const max = min + spread;
          const rng = createRng(seed);
          for (let i = 0; i < 100; i++) {
            const v = rng.nextInt(min, max);
            expect(v).toBeGreaterThanOrEqual(min);
            expect(v).toBeLessThanOrEqual(max);
            expect(Number.isInteger(v)).toBe(true);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('shuffle is a permutation (preserves multiset)', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.integer(), { minLength: 0, maxLength: 20 }),
        (seed, arr) => {
          const original = [...arr];
          const rng = createRng(seed);
          const shuffled = rng.shuffle([...arr]);
          expect(shuffled).toHaveLength(original.length);
          expect([...shuffled].sort((a, b) => a - b))
            .toEqual([...original].sort((a, b) => a - b));
        },
      ),
      { numRuns: 500 },
    );
  });

  it('drawFrom on empty array returns null', () => {
    const rng = createRng(1);
    expect(rng.drawFrom([])).toBeNull();
  });

  it('drawFrom removes the drawn element', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.integer(), { minLength: 1, maxLength: 10 }),
        (seed, arr) => {
          const rng = createRng(seed);
          const initialLength = arr.length;
          const drawn = rng.drawFrom(arr);
          expect(drawn).not.toBeNull();
          expect(arr.length).toBe(initialLength - 1);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe('deriveSeed', () => {
  it('same inputs produce same derived seed', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.integer(), { maxLength: 5 }),
        (base, vals) => {
          expect(deriveSeed(base, ...vals)).toBe(deriveSeed(base, ...vals));
        },
      ),
      { numRuns: 500 },
    );
  });

  it('different extras produce different derived seeds (high prob)', () => {
    // Not strictly guaranteed by hash functions, but on 32-bit the
    // collision rate is low enough to be a sanity check.
    const a = deriveSeed(42, 1);
    const b = deriveSeed(42, 2);
    expect(a).not.toBe(b);
  });
});
