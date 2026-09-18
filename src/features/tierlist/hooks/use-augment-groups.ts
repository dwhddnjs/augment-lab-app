import { useAugmentPool } from '@/features/augments/hooks/use-augments';
import { augSlugs } from '@/features/tierlist/tiers';
import type { AugmentGroup, TierRow } from '@/features/tierlist/types';

/** 프리즘 → 골드 → 실버. 등급이 높은 쪽을 먼저 보여준다. */
const RARITIES = ['prismatic', 'gold', 'silver'] as const;

/**
 * 챔피언 행의 추천 증강을 앱 증강 풀과 조인해 희귀도 그룹으로 나눈다(빈 그룹은 뺀다).
 *
 * 칼바람 풀만 쓴다 — 클래식 전용 증강이 추천에 섞이면 앱 뽑기 풀과 어긋난다.
 * 그룹 안은 등급(S→C) 순이다. 행이 이미 승률 내림차순이고 sort 가 안정 정렬이라,
 * 티어로만 비교하면 같은 등급 안에서는 승률 순서가 그대로 남는다.
 */
export function useAugmentGroups(row: TierRow | undefined): AugmentGroup[] {
  const pool = useAugmentPool('aram');
  const byId = new Map(pool.map((a) => [a.id, a]));
  const entries = (row?.augments ?? []).flatMap(([i, , tier]) => {
    const aug = byId.get(augSlugs[i]);
    return aug ? [{ aug, tier }] : [];
  });

  return RARITIES.map((rarity) => ({
    rarity,
    list: entries.filter((e) => e.aug.rarity === rarity).sort((a, b) => a.tier - b.tier),
  })).filter((g) => g.list.length > 0);
}
