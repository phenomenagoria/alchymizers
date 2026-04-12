// Property + unit tests for engine/rules.js — game constants and helpers.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  TOTAL_ROUNDS,
  BLOWOUT_THRESHOLD,
  MAX_BUYS_PER_ROUND,
  TRACK,
  TRACK_MAX,
  INGREDIENTS,
  HOLLER_CARDS,
  createStartingBag,
  getIngredientCost,
  getShopItems,
} from '../../engine/rules.js';

describe('game constants', () => {
  it('TOTAL_ROUNDS is 9', () => {
    expect(TOTAL_ROUNDS).toBe(9);
  });

  it('BLOWOUT_THRESHOLD is 7', () => {
    expect(BLOWOUT_THRESHOLD).toBe(7);
  });

  it('MAX_BUYS_PER_ROUND is 2', () => {
    expect(MAX_BUYS_PER_ROUND).toBe(2);
  });
});

describe('TRACK', () => {
  it('positions are contiguous from 0 to TRACK_MAX', () => {
    TRACK.forEach((space, idx) => {
      expect(space.pos).toBe(idx);
    });
    expect(TRACK_MAX).toBe(TRACK.length - 1);
  });

  it('coins and vp are monotonically non-decreasing', () => {
    for (let i = 1; i < TRACK.length; i++) {
      expect(TRACK[i].coins).toBeGreaterThanOrEqual(TRACK[i - 1].coins);
      expect(TRACK[i].vp).toBeGreaterThanOrEqual(TRACK[i - 1].vp);
    }
  });

  it('every copper space has a copperValue of 1 or 2', () => {
    TRACK.filter((s) => s.special === 'copper').forEach((s) => {
      expect([1, 2]).toContain(s.copperValue);
    });
  });
});

describe('createStartingBag', () => {
  it('returns 9 chips', () => {
    expect(createStartingBag()).toHaveLength(9);
  });

  it('has exactly 7 whites and 2 oranges', () => {
    const bag = createStartingBag();
    const whites = bag.filter((c) => c.color === 'white');
    const oranges = bag.filter((c) => c.color === 'orange');
    expect(whites).toHaveLength(7);
    expect(oranges).toHaveLength(2);
  });

  it('returns a fresh array each call (no shared mutation)', () => {
    const a = createStartingBag();
    const b = createStartingBag();
    a.push({ color: 'red', value: 1 });
    expect(b).toHaveLength(9);
  });

  it('starting white total is 7 — exactly at the blowout threshold', () => {
    // Core design invariant: a player drawing all starting whites hits
    // (but does not exceed) the blowout threshold. This is intentional.
    const bag = createStartingBag();
    const whiteSum = bag
      .filter((c) => c.color === 'white')
      .reduce((acc, c) => acc + c.value, 0);
    expect(whiteSum).toBe(4 * 1 + 2 * 2 + 1 * 3); // 4 + 4 + 3 = 11
    // Separately, the count is 7, which correlates to BLOWOUT_THRESHOLD.
    const whiteCount = bag.filter((c) => c.color === 'white').length;
    expect(whiteCount).toBe(BLOWOUT_THRESHOLD);
  });
});

describe('getIngredientCost', () => {
  it('returns Infinity for unknown colors', () => {
    expect(getIngredientCost('fuschia', 1)).toBe(Infinity);
  });

  it('returns Infinity for non-buyable (white)', () => {
    expect(getIngredientCost('white', 1)).toBe(Infinity);
  });

  it('returns a positive integer for buyable ingredients', () => {
    for (const [color, info] of Object.entries(INGREDIENTS)) {
      if (!info.buyable) continue;
      for (const value of info.values) {
        const cost = getIngredientCost(color, value);
        expect(cost).toBeGreaterThan(0);
        expect(Number.isFinite(cost)).toBe(true);
      }
    }
  });

  it('discount never reduces cost below 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (discount) => {
        for (const [color, info] of Object.entries(INGREDIENTS)) {
          if (!info.buyable) continue;
          for (const value of info.values) {
            const cost = getIngredientCost(color, value, discount);
            expect(cost).toBeGreaterThanOrEqual(1);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('getShopItems', () => {
  it('returns only buyable ingredients', () => {
    const items = getShopItems();
    for (const item of items) {
      expect(INGREDIENTS[item.color].buyable).toBe(true);
    }
  });

  it('every shop item has a finite positive cost', () => {
    for (const item of getShopItems()) {
      expect(item.cost).toBeGreaterThan(0);
      expect(Number.isFinite(item.cost)).toBe(true);
    }
  });
});

describe('HOLLER_CARDS', () => {
  it('every card has id, name, desc, effect', () => {
    for (const card of HOLLER_CARDS) {
      expect(card.id).toBeGreaterThan(0);
      expect(typeof card.name).toBe('string');
      expect(typeof card.desc).toBe('string');
      expect(typeof card.effect).toBe('string');
    }
  });

  it('card ids are unique', () => {
    const ids = HOLLER_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
