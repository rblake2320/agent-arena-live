export type MatchOutcome = 'A' | 'B' | 'draw';

export interface EloResult {
  newRatingA: number;
  newRatingB: number;
  scoreA: number;
  scoreB: number;
}

// Standard ELO: expected score from a 400-point logistic curve, ratings move
// by K * (actual - expected). Zero-sum apart from independent rounding.
export function calculateElo(
  ratingA: number,
  ratingB: number,
  outcome: MatchOutcome,
  kFactor = 32
): EloResult {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const scoreA = outcome === 'A' ? 1 : outcome === 'draw' ? 0.5 : 0;
  const scoreB = 1 - scoreA;

  return {
    newRatingA: Math.round(ratingA + kFactor * (scoreA - expectedA)),
    newRatingB: Math.round(ratingB + kFactor * (scoreB - expectedB)),
    scoreA,
    scoreB,
  };
}
