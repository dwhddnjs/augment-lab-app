/**
 * 칼바람 드래프트 뽑기·전환 규칙. React 의존이 없는 순수 모듈이라 scripts/check-transmute.ts 가 그대로 실행한다.
 */
import type { Augment, AugmentRarity } from '@/features/augments/types';
import { sampleDistinct } from '@/lib/arrays';

/**
 * 전환 증강 — 고르면 자신은 빌드에 들어가지 않고 효과만 낸다. 얻은 증강엔 transmuted 가 붙는다.
 * 전환 증강끼리는 서로를 주지 않는다(전환: 골드가 전환: 프리즘을 주는 식의 연쇄를 막는다).
 * rarity 가 없으면 등급 무관이다.
 */
const GRANTS: Record<string, { rarity?: AugmentRarity; count: number }> = {
  'transmute-gold': { rarity: 'gold', count: 1 },
  'transmute-prismatic': { rarity: 'prismatic', count: 1 },
  'transmute-chaos': { count: 2 },
};
/** 판도라의 상자 — 지금까지 얻은 증강을 같은 개수의 무작위 프리즘 증강으로 모두 바꾼다. */
export const PANDORA_ID = 'pandora-s-box';
const TRANSMUTE_IDS = new Set([...Object.keys(GRANTS), PANDORA_ID]);

/** `count` 개를 한 등급에서 뽑는다. 그 등급이 모자라면 나머지는 등급 무관으로 채워 라운드가 비지 않게 한다. */
export function drawOfRarity(pool: Augment[], rarity: AugmentRarity, count: number): Augment[] {
  const used = new Set<string>();
  const result = sampleDistinct(
    pool.filter((a) => a.rarity === rarity),
    count,
    used,
  );
  if (result.length < count) {
    result.push(...sampleDistinct(pool, count - result.length, used));
  }
  return result;
}

/**
 * 카드로 뽑을 수 있는 증강. exclude(이미 얻은 것·남아 있는 카드)를 빼고,
 * 판도라는 바꿀 증강이 없을 때(1라운드) 빼 둔다 — 고르는 순간 빈 픽이 된다.
 */
export function cardPool(all: Augment[], exclude: Iterable<string>, picked: readonly Augment[]): Augment[] {
  const out = new Set(exclude);
  if (picked.length === 0) out.add(PANDORA_ID);
  return all.filter((a) => !out.has(a.id));
}

/**
 * 고른 카드를 빌드에 반영한다. 일반 증강은 그대로 들어가고, 전환 증강은 자신 대신 얻은 증강이,
 * 판도라는 지금까지 얻은 증강 수만큼의 프리즘이 빌드를 통째로 대신한다.
 * exclude 는 새로 얻을 수 없는 id(이미 얻은 것·이번 라운드 카드)다.
 * granted 는 새로 얻은 증강 — 호출부가 taken 에 넣어 다시 카드로 나오지 않게 한다.
 */
export function applyPick(
  chosen: Augment,
  picked: Augment[],
  all: Augment[],
  exclude: ReadonlySet<string>,
): { picked: Augment[]; granted: Augment[] } {
  const isPandora = chosen.id === PANDORA_ID;
  const grant = GRANTS[chosen.id];
  if (!grant && !isPandora) return { picked: [...picked, chosen], granted: [] };

  const pool = all.filter((a) => !exclude.has(a.id) && !TRANSMUTE_IDS.has(a.id));
  const granted = isPandora
    ? drawOfRarity(pool, 'prismatic', picked.length)
    : grant.rarity
      ? drawOfRarity(pool, grant.rarity, grant.count)
      : sampleDistinct(pool, grant.count, new Set());
  const marked = granted.map((a) => ({ ...a, transmuted: true }));
  return { picked: isPandora ? marked : [...picked, ...marked], granted };
}
