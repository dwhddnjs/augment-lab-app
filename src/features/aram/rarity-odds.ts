import type { AugmentRarity } from '@/features/augments/types';

// Rarity odds for a round of ARAM augments, identical for every round.
// React를 쓰지 않는 순수 모듈이라 scripts/check-rarity-odds.mjs 가 그대로 실행해 분포를 검증한다.
export const RARITY_ODDS: [AugmentRarity, number][] = [
  ['silver', 0.3],
  ['gold', 0.3],
  ['prismatic', 0.4],
];

// Roll a single rarity for the whole round so all cards share one color.
export function rollRarity(): AugmentRarity {
  let r = Math.random();
  for (const [rarity, odds] of RARITY_ODDS) {
    if (r < odds) return rarity;
    r -= odds;
  }
  // Only reachable on floating-point drift at the very top of the range.
  return RARITY_ODDS[RARITY_ODDS.length - 1][0];
}
