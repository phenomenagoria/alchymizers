// Mulberry32 - fast, high-quality 32-bit seeded PRNG
// Never use Math.random() for gameplay - always use this

export function createRng(seed) {
  let state = seed | 0;

  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Random integer in [min, max] inclusive
  function nextInt(min, max) {
    return min + Math.floor(next() * (max - min + 1));
  }

  // Fisher-Yates shuffle (in-place)
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Pick and remove a random element
  function drawFrom(arr) {
    if (arr.length === 0) return null;
    const idx = nextInt(0, arr.length - 1);
    return arr.splice(idx, 1)[0];
  }

  return { next, nextInt, shuffle, drawFrom };
}

// Derive a sub-seed from a base seed + extra values
export function deriveSeed(baseSeed, ...values) {
  let h = baseSeed | 0;
  for (const v of values) {
    h = Math.imul(h ^ v, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}
