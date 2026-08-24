/**
 * 아레나 규칙 — 진행 순서·경제 수치·카드 추첨. React 를 쓰지 않는 순수 모듈이다.
 * 게임 밸런스를 만지려면 이 파일만 보면 된다(use-arena 는 상태 전이만 담당).
 */
import type { AugmentRarity } from "@/features/augments/types";
import { pickRandom, sampleDistinct, shuffle } from "@/lib/arrays";
import type { ArenaAugment, ArenaPickedAugment, ArenaStep } from "./types";

// ─── 진행 ────────────────────────────────────────────────────────────────────

// 12라운드를 평탄화한 step 흐름. round는 표시용(1~12).
// R1 골드(500)는 진입 시 즉시 보유하므로 step.gold로 지급하지 않는다(초기 gold=500).
export const ARENA_STEPS: ArenaStep[] = [
  { round: 1, kind: "augment" },
  { round: 1, kind: "shop" },
  { round: 2, kind: "prismatic" },
  { round: 3, kind: "augment" },
  { round: 4, kind: "shop", gold: 2500 },
  { round: 5, kind: "augment" },
  { round: 6, kind: "shop", gold: 2500 },
  { round: 7, kind: "augment" },
  { round: 8, kind: "reforge" },
  { round: 9, kind: "shop", gold: 2500 },
  { round: 10, kind: "augment" },
  { round: 11, kind: "shop", gold: 2500 },
  { round: 12, kind: "augment" },
];

export const ARENA_TOTAL_ROUNDS = 12;

/** R1 시작 골드 — 증강 선택 화면부터 이미 보유한다(사실상 신발 1켤레). */
export const ARENA_START_GOLD = 500;

// ─── 재련(R8) ────────────────────────────────────────────────────────────────

// 8라운드 재련(reforge)에 등장하는 제작 증강 id. 나머지 special-augments는
// 카메오(go-h*) 계열이거나 효과 미구현이라 이 3종으로 제한한다.
export const REFORGE_IDS: Set<string> = new Set([
  "crafting-pris-stat-anvil", // 프리즘 능력치 모루 획득
  "crafting-augment-slot", // 증강 슬롯 획득(12라운드 보너스 실버 증강)
  "crafting-sell-augment", // 증강 강화(증강 1개 제거 + 레벨 2개)
]);

// 증강 강화 재련 카드 id — 선택 시 advance 대신 보유 증강 선택 오버레이를 띄운다.
export const ENHANCE_AUGMENT_ID = "crafting-sell-augment";
// 증강 슬롯 획득 재련 카드 id — 12라운드 진입 시 보너스 실버 증강 1장을 부여한다.
export const AUGMENT_SLOT_ID = "crafting-augment-slot";
// 증강 강화로 분배하는 총 레벨 수.
export const ENHANCE_LEVELS = 2;

// 증강 슬롯 한도 — 기본 4개, 재련(증강 슬롯 획득)을 고르면 5개까지.
const BASE_AUGMENT_SLOTS = 4;
const REFORGED_AUGMENT_SLOTS = 5;

export function augmentSlots(reforged: boolean): number {
  return reforged ? REFORGED_AUGMENT_SLOTS : BASE_AUGMENT_SLOTS;
}

// ─── 경제 ────────────────────────────────────────────────────────────────────

// 전설/신발 아이템 보유 한도(상점). 프리즘 아이템은 별도로 센다.
export const MAX_ITEMS = 6;

// 카테고리별 고정 구매가.
export const SHOP_PRICE = {
  boots: 500,
  legendary: 2500,
  legendaryAnvil: 2250,
  prismaticAnvil: 4000,
} as const;

// 판매가 — 하단 트레이에서 팔 때 환원되는 골드(구매가보다 낮다).
// 되돌리기(상점 그리드 재탭)는 구매가 전액을 돌려주므로 이 값과 무관하다.
export const SELL_PRICE = {
  boots: 500,
  legendary: 1500,
  prismatic: 2000,
} as const;

// 프리즘 아이템 판매가(고정) — 상점 구매분·라운드 무료 픽 모두 동일하게 적용한다.
export const PRISMATIC_SELL_PRICE = SELL_PRICE.prismatic;

// ─── 카드 추첨 ───────────────────────────────────────────────────────────────

// round(1~12)가 오를수록 희귀 등급 확률이 높아진다.
function rollRarity(round: number): AugmentRarity {
  let wSilver: number;
  let wGold: number;
  if (round <= 2) {
    wSilver = 0.7;
    wGold = 0.25;
  } else if (round <= 5) {
    wSilver = 0.5;
    wGold = 0.32;
  } else if (round <= 8) {
    wSilver = 0.35;
    wGold = 0.38;
  } else {
    wSilver = 0.25;
    wGold = 0.4;
  }
  const wPrismatic = 1 - wSilver - wGold;
  const r = Math.random();
  if (r < wPrismatic) return "prismatic";
  if (r < wPrismatic + wGold) return "gold";
  return "silver";
}

/** 한 등급을 골라 count장 뽑되, 풀이 부족하면 다른 등급으로 채운다. */
export function drawAugments(
  pool: ArenaAugment[],
  rarity: AugmentRarity,
  count: number,
  used: Set<string> = new Set(),
): ArenaAugment[] {
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

/** 라운드 등급을 굴려 뽑는다 — 증강 step 진입/리롤 공용. */
export function drawForRound(
  pool: ArenaAugment[],
  round: number,
  count: number,
  used: Set<string> = new Set(),
): ArenaAugment[] {
  return drawAugments(pool, rollRarity(round), count, used);
}

// 이미 최대 레벨에 도달한 증강은 더 등장시키지 않는다.
export function maxedIds(picked: ArenaPickedAugment[]): Set<string> {
  return new Set(
    picked
      .filter((p) => p.level >= p.augment.maxLevel)
      .map((p) => p.augment.id),
  );
}

/** 레벨업 여지가 남은 보유 증강. */
export function levelable(picked: ArenaPickedAugment[]): ArenaPickedAugment[] {
  return picked.filter((p) => p.level < p.augment.maxLevel);
}

/**
 * 증강 step 카드 3장 구성.
 *  - 슬롯이 꽉 찼으면: 레벨업 여지가 있는 보유 증강만 노출해 레벨업을 유도한다
 *    (여유 증강이 없으면 만렙 보유 증강이라도 노출해 빈 화면을 막는다).
 *  - 슬롯에 여유가 있으면: 신규 증강 위주이되, 레벨업 가능한 보유 증강이 1개 이상
 *    있으면 그중 랜덤 1장을 반드시 끼워 매 증강턴에 레벨업 기회를 보장한다.
 */
export function buildAugmentCards(
  pool: ArenaAugment[],
  picked: ArenaPickedAugment[],
  round: number,
  maxSlots: number,
): ArenaAugment[] {
  const upgradable = levelable(picked);

  if (picked.length >= maxSlots) {
    const source = upgradable.length > 0 ? upgradable : picked;
    return shuffle(source)
      .slice(0, 3)
      .map((p) => p.augment);
  }

  const used = maxedIds(picked);
  const cards: ArenaAugment[] = [];
  const forced = pickRandom(upgradable);
  if (forced) {
    cards.push(forced.augment);
    used.add(forced.augment.id);
  }
  cards.push(...drawForRound(pool, round, 3 - cards.length, used));
  return shuffle(cards);
}
