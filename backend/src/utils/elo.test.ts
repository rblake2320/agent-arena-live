import { describe, expect, it } from 'vitest';
import { calculateElo } from './elo.js';

describe('calculateElo', () => {
  it('equal ratings, A wins: A gains K/2, B loses K/2', () => {
    const result = calculateElo(1200, 1200, 'A', 32);
    expect(result.newRatingA).toBe(1216);
    expect(result.newRatingB).toBe(1184);
    expect(result.scoreA).toBe(1);
    expect(result.scoreB).toBe(0);
  });

  it('equal ratings, draw: no change', () => {
    const result = calculateElo(1500, 1500, 'draw', 32);
    expect(result.newRatingA).toBe(1500);
    expect(result.newRatingB).toBe(1500);
  });

  it('underdog win moves ratings more than favorite win', () => {
    const upset = calculateElo(1200, 1600, 'A', 32);
    const expected = calculateElo(1200, 1600, 'B', 32);
    const upsetSwing = upset.newRatingA - 1200;
    const expectedSwing = 1600 - expected.newRatingB === 0 ? 0 : Math.abs(expected.newRatingB - 1600);
    expect(upsetSwing).toBeGreaterThan(expectedSwing);
    // 400-point gap → expected score ~0.909 for favorite
    expect(upset.newRatingA).toBe(1229); // 1200 + 32 * (1 - 0.0909…)
    expect(upset.newRatingB).toBe(1571);
  });

  it('is zero-sum apart from rounding', () => {
    for (const [a, b, outcome] of [
      [1200, 1350, 'A'],
      [1800, 1400, 'B'],
      [1234, 2100, 'draw'],
    ] as const) {
      const r = calculateElo(a, b, outcome);
      const delta = r.newRatingA - a + (r.newRatingB - b);
      expect(Math.abs(delta)).toBeLessThanOrEqual(1);
    }
  });

  it('respects a custom K factor', () => {
    const result = calculateElo(1200, 1200, 'A', 64);
    expect(result.newRatingA).toBe(1232);
    expect(result.newRatingB).toBe(1168);
  });
});
