/**
 * useArena — 아레나 12라운드 진행 엔진.
 *
 * 12라운드를 평탄화한 step 흐름으로 진행한다(R1은 증강 + 신발 상점 2 step).
 * 칼바람 useDraft 패턴(현재 카드 state + advance 시 다음 카드 생성)을 따르되,
 * 골드 경제·증강 레벨업·프리즘/모루/재련 누적 상태를 추가로 관리한다.
 */
import { useCallback, useMemo, useState } from "react";

import type { AugmentRarity } from "@/features/augments/types";
import {
  MAX_AUGMENT_LEVEL,
  type ArenaAugment,
  type ArenaPickedAugment,
  type ArenaSpecialAugment,
  type ArenaStep,
  type PrismaticItem,
} from "@/features/arena/types";
import { useArenaAugments } from "./use-arena-augments";
import { usePrismaticItems, useSpecialAugments } from "./use-arena-items";

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

// 8라운드 재련(reforge)에 등장하는 제작 증강 id. 나머지 special-augments는
// 카메오(go-h*) 계열이거나 효과 미구현이라 이 3종으로 제한한다.
const REFORGE_IDS: Set<string> = new Set([
  "crafting-pris-stat-anvil", // 프리즘 능력치 모루 획득
  "crafting-augment-slot", // 증강 슬롯 획득(12라운드 보너스 실버 증강)
  "crafting-sell-augment", // 증강 강화(증강 1개 제거 + 레벨 2개)
]);

// 증강 강화 재련 카드 id — 선택 시 advance 대신 보유 증강 선택 오버레이를 띄운다.
export const ENHANCE_AUGMENT_ID = "crafting-sell-augment";
// 증강 슬롯 획득 재련 카드 id — 12라운드 진입 시 보너스 실버 증강 1장을 부여한다.
const AUGMENT_SLOT_ID = "crafting-augment-slot";
// 증강 강화로 분배하는 총 레벨 수.
const ENHANCE_LEVELS = 2;

// 프리즘 아이템 판매가(고정) — 상점 구매분·라운드 무료 픽 모두 동일하게 적용한다.
export const PRISMATIC_SELL_PRICE = 2000;

// ─── 카드 추첨 유틸 ───────────────────────────────────────────────────────────

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

export function sampleDistinct<T extends { id: string }>(
  pool: T[],
  count: number,
  used: Set<string>,
): T[] {
  const available = pool.filter((a) => !used.has(a.id));
  const result: T[] = [];
  while (result.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    const [chosen] = available.splice(idx, 1);
    result.push(chosen);
    used.add(chosen.id);
  }
  return result;
}

// 한 등급을 골라 count장 뽑되, 풀이 부족하면 다른 등급으로 채운다.
function drawAugments(
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

// 이미 최대 레벨에 도달한 증강은 더 등장시키지 않는다.
function maxedIds(picked: ArenaPickedAugment[]): Set<string> {
  return new Set(
    picked
      .filter((p) => p.level >= MAX_AUGMENT_LEVEL[p.augment.rarity])
      .map((p) => p.augment.id),
  );
}

export interface ArenaState {
  // 진행
  step: ArenaStep;
  stepIndex: number;
  round: number;
  totalRounds: number;
  done: boolean;

  // 누적
  gold: number;
  pickedAugments: ArenaPickedAugment[];
  itemIds: string[];
  prismaticIds: string[];
  shardIds: string[];
  reforgeIds: string[];

  // 현재 step 선택지
  augmentCards: ArenaAugment[];
  prismaticCards: PrismaticItem[];
  reforgeCards: ArenaSpecialAugment[];
  rerolled: boolean[];

  // 액션
  pickAugment: (augment: ArenaAugment) => void;
  rerollAugment: (idx: number) => void;
  pickPrismatic: (item: PrismaticItem) => void;
  rerollPrismatic: (idx: number) => void;
  pickReforge: (special: ArenaSpecialAugment) => void;
  /** 증강 강화 — removeId 증강 제거 + 남은 증강에 총 2레벨 랜덤 분배 후 다음 step. */
  enhanceAugment: (removeId: string) => void;
  /**
   * shop: 골드가 충분하면 cost 차감 후 누적, 성공 시 true.
   * sellValue 미지정 시 cost와 동일(일반 구매). 모루는 cost≠sellValue(예: 2250 구매/1500 판매).
   */
  buyItem: (itemId: string, cost: number, sellValue?: number) => boolean;
  /** 되돌리기 — 구매가 전액 환원 후 보유에서 제거(상점 그리드에서 보유 아이템 재탭). */
  undoItem: (itemId: string) => void;
  /** 판매 — 기록된 판매가만큼만 골드 환원 후 보유에서 제거(하단 트레이 탭). */
  sellItem: (itemId: string) => void;
  buyShard: (shardId: string, price: number) => boolean;
  buyPrismaticItem: (
    item: PrismaticItem,
    cost: number,
    sellValue?: number,
  ) => boolean;
  /** 프리즘 판매 — 기록된 판매가만큼 골드 환원 후 보유에서 제거(하단 트레이 탭). */
  sellPrismatic: (id: string) => void;
  /** shop 종료(구매 없이 스킵 포함) → 다음 step. */
  endShop: () => void;
}

export function useArena(): ArenaState {
  const allAugments = useArenaAugments();
  const allPrismatics = usePrismaticItems();
  const allSpecials = useSpecialAugments();

  const [stepIndex, setStepIndex] = useState(0);
  // R1 시작과 동시에 500골드 보유(증강 선택 화면부터 표시). 이후 shop step은 step.gold로 추가 지급.
  const [gold, setGold] = useState(500);
  const [pickedAugments, setPickedAugments] = useState<ArenaPickedAugment[]>(
    [],
  );
  const [itemIds, setItemIds] = useState<string[]>([]);
  // 아이템별 구매가(buy)·판매가(sell)를 기록한다. 되돌리기는 구매가 전액, 판매는 판매가만 환원.
  const [itemPrices, setItemPrices] = useState<
    Record<string, { buy: number; sell: number }>
  >({});
  const [prismaticIds, setPrismaticIds] = useState<string[]>([]);
  // 상점 프리즘 모루로 산 프리즘 아이템의 구매가/판매가. 라운드 무료 픽은 기록하지 않는다.
  const [prismaticPrices, setPrismaticPrices] = useState<
    Record<string, { buy: number; sell: number }>
  >({});
  const [shardIds, setShardIds] = useState<string[]>([]);
  const [reforgeIds, setReforgeIds] = useState<string[]>([]);
  // 증강 슬롯 획득 재련을 골랐는지 — 12라운드 진입 시 보너스 실버 증강을 1장 부여한다.
  const [augmentSlotGranted, setAugmentSlotGranted] = useState(false);

  const [augmentCards, setAugmentCards] = useState<ArenaAugment[]>(() =>
    drawAugments(allAugments, rollRarity(1), 3),
  );
  const [prismaticCards, setPrismaticCards] = useState<PrismaticItem[]>([]);
  const [reforgeCards, setReforgeCards] = useState<ArenaSpecialAugment[]>([]);
  const [rerolled, setRerolled] = useState<boolean[]>([false, false, false]);

  const [done, setDone] = useState(false);

  const step = ARENA_STEPS[Math.min(stepIndex, ARENA_STEPS.length - 1)];

  // 다음 step으로 진행하며 해당 step의 골드 지급 + 선택지 생성.
  const advance = useCallback(
    (nextPicked: ArenaPickedAugment[], nextPrismaticIds: string[]) => {
      const nextIndex = stepIndex + 1;
      if (nextIndex >= ARENA_STEPS.length) {
        setDone(true);
        setStepIndex(nextIndex);
        return;
      }
      const next = ARENA_STEPS[nextIndex];
      if (next.gold) setGold((g) => g + next.gold!);
      setRerolled([false, false, false]);

      if (next.kind === "augment") {
        const used = maxedIds(nextPicked);
        // 증강 슬롯 보너스: 12라운드 진입 시 랜덤 실버 증강 1장을 보유에 자동 추가.
        // (12라운드 직전은 항상 11라운드 shop의 endShop 경로라 setPickedAugments 중첩 없음.)
        if (next.round === 12 && augmentSlotGranted) {
          const bonusUsed = new Set(nextPicked.map((p) => p.augment.id));
          const [bonus] = drawAugments(allAugments, "silver", 1, bonusUsed);
          if (bonus) {
            setPickedAugments((prev) => [...prev, { augment: bonus, level: 1 }]);
          }
        }
        setAugmentCards(
          drawAugments(allAugments, rollRarity(next.round), 3, used),
        );
      } else if (next.kind === "prismatic") {
        const used = new Set(nextPrismaticIds);
        setPrismaticCards(sampleDistinct(allPrismatics, 3, used));
      } else if (next.kind === "reforge") {
        const reforgePool = allSpecials.filter((s) => REFORGE_IDS.has(s.id));
        setReforgeCards(sampleDistinct(reforgePool, 3, new Set()));
      }
      setStepIndex(nextIndex);
    },
    [stepIndex, allAugments, allPrismatics, allSpecials, augmentSlotGranted],
  );

  const pickAugment = useCallback(
    (augment: ArenaAugment) => {
      setPickedAugments((prev) => {
        const existing = prev.find((p) => p.augment.id === augment.id);
        let next: ArenaPickedAugment[];
        if (existing) {
          const max = MAX_AUGMENT_LEVEL[augment.rarity];
          next = prev.map((p) =>
            p.augment.id === augment.id
              ? { ...p, level: Math.min(p.level + 1, max) }
              : p,
          );
        } else {
          next = [...prev, { augment, level: 1 }];
        }
        advance(next, prismaticIds);
        return next;
      });
    },
    [advance, prismaticIds],
  );

  const rerollAugment = useCallback(
    (idx: number) => {
      if (rerolled[idx]) return;
      const used = maxedIds(pickedAugments);
      const excludeIds = new Set([
        ...used,
        ...augmentCards.filter((_, i) => i !== idx).map((a) => a.id),
      ]);
      const pool = allAugments.filter((a) => !excludeIds.has(a.id));
      const [replacement] = drawAugments(pool, augmentCards[idx].rarity, 1);
      if (!replacement) return;
      setAugmentCards((prev) => {
        const nextCards = [...prev];
        nextCards[idx] = replacement;
        return nextCards;
      });
      setRerolled((prev) => {
        const nextR = [...prev];
        nextR[idx] = true;
        return nextR;
      });
    },
    [rerolled, pickedAugments, augmentCards, allAugments],
  );

  const pickPrismatic = useCallback(
    (item: PrismaticItem) => {
      setPrismaticIds((prev) => {
        const next = prev.includes(item.id) ? prev : [...prev, item.id];
        advance(pickedAugments, next);
        return next;
      });
      // 라운드 무료 픽도 판매 가능하도록 판매가를 기록(구매가는 0).
      setPrismaticPrices((prev) => ({
        ...prev,
        [item.id]: { buy: 0, sell: PRISMATIC_SELL_PRICE },
      }));
    },
    [advance, pickedAugments],
  );

  const rerollPrismatic = useCallback(
    (idx: number) => {
      if (rerolled[idx]) return;
      const excludeIds = new Set([
        ...prismaticIds,
        ...prismaticCards.filter((_, i) => i !== idx).map((p) => p.id),
      ]);
      const pool = allPrismatics.filter((p) => !excludeIds.has(p.id));
      const [replacement] = sampleDistinct(pool, 1, new Set());
      if (!replacement) return;
      setPrismaticCards((prev) => {
        const nextCards = [...prev];
        nextCards[idx] = replacement;
        return nextCards;
      });
      setRerolled((prev) => {
        const nextR = [...prev];
        nextR[idx] = true;
        return nextR;
      });
    },
    [rerolled, prismaticIds, prismaticCards, allPrismatics],
  );

  const pickReforge = useCallback(
    (special: ArenaSpecialAugment) => {
      setReforgeIds((prev) => [...prev, special.id]);
      if (special.id === AUGMENT_SLOT_ID) setAugmentSlotGranted(true);
      advance(pickedAugments, prismaticIds);
    },
    [advance, pickedAugments, prismaticIds],
  );

  // 증강 강화 — removeId 증강을 제거하고, 남은 증강 중 레벨업 여지가 있는 것들에
  // 총 ENHANCE_LEVELS(2)만큼 1레벨씩 랜덤 분배한다(각 증강 최대 레벨 한도 내).
  const enhanceAugment = useCallback(
    (removeId: string) => {
      // 증강 강화도 재련 기록에 남겨 drawer '재련' 섹션에 표시한다.
      setReforgeIds((prev) =>
        prev.includes(ENHANCE_AUGMENT_ID)
          ? prev
          : [...prev, ENHANCE_AUGMENT_ID],
      );
      setPickedAugments((prev) => {
        const remaining = prev.filter((p) => p.augment.id !== removeId);
        // 분배 대상: 현재 레벨 < 최대 레벨인 증강(여유 capacity 보유).
        const caps = remaining.map(
          (p) => MAX_AUGMENT_LEVEL[p.augment.rarity] - p.level,
        );
        const totalCap = caps.reduce((s, c) => s + c, 0);
        let toDistribute = Math.min(ENHANCE_LEVELS, totalCap);
        const levels = remaining.map((p) => p.level);
        while (toDistribute > 0) {
          const eligible = caps
            .map((_, i) => i)
            .filter((i) => caps[i] > 0);
          if (eligible.length === 0) break;
          const i = eligible[Math.floor(Math.random() * eligible.length)];
          levels[i] += 1;
          caps[i] -= 1;
          toDistribute -= 1;
        }
        const next = remaining.map((p, i) => ({ ...p, level: levels[i] }));
        advance(next, prismaticIds);
        return next;
      });
    },
    [advance, prismaticIds],
  );

  const buyItem = useCallback(
    (itemId: string, cost: number, sellValue?: number) => {
      if (gold < cost || itemIds.includes(itemId)) return false;
      setGold((g) => g - cost);
      setItemIds((prev) => [...prev, itemId]);
      setItemPrices((prev) => ({
        ...prev,
        [itemId]: { buy: cost, sell: sellValue ?? cost },
      }));
      return true;
    },
    [gold, itemIds],
  );

  // 보유 아이템 제거 공통 — refundKind에 따라 구매가(되돌리기)/판매가(판매)를 환원.
  const removeItem = useCallback(
    (itemId: string, refundKind: "buy" | "sell") => {
      if (!itemIds.includes(itemId)) return;
      const refund = itemPrices[itemId]?.[refundKind] ?? 0;
      setGold((g) => g + refund);
      setItemIds((prev) => prev.filter((id) => id !== itemId));
      setItemPrices((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    },
    [itemIds, itemPrices],
  );

  const undoItem = useCallback(
    (itemId: string) => removeItem(itemId, "buy"),
    [removeItem],
  );
  const sellItem = useCallback(
    (itemId: string) => removeItem(itemId, "sell"),
    [removeItem],
  );

  const buyShard = useCallback(
    (shardId: string, price: number) => {
      if (gold < price) return false;
      setGold((g) => g - price);
      setShardIds((prev) => [...prev, shardId]);
      return true;
    },
    [gold],
  );

  const buyPrismaticItem = useCallback(
    (item: PrismaticItem, cost: number, sellValue?: number) => {
      if (gold < cost || prismaticIds.includes(item.id)) return false;
      setGold((g) => g - cost);
      setPrismaticIds((prev) => [...prev, item.id]);
      setPrismaticPrices((prev) => ({
        ...prev,
        [item.id]: { buy: cost, sell: sellValue ?? cost },
      }));
      return true;
    },
    [gold, prismaticIds],
  );

  const sellPrismatic = useCallback(
    (id: string) => {
      if (!prismaticIds.includes(id)) return;
      const refund = prismaticPrices[id]?.sell ?? 0;
      setGold((g) => g + refund);
      setPrismaticIds((prev) => prev.filter((pid) => pid !== id));
      setPrismaticPrices((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [prismaticIds, prismaticPrices],
  );

  const endShop = useCallback(() => {
    advance(pickedAugments, prismaticIds);
  }, [advance, pickedAugments, prismaticIds]);

  return useMemo(
    () => ({
      step,
      stepIndex,
      round: step.round,
      totalRounds: ARENA_TOTAL_ROUNDS,
      done,
      gold,
      pickedAugments,
      itemIds,
      prismaticIds,
      shardIds,
      reforgeIds,
      augmentCards,
      prismaticCards,
      reforgeCards,
      rerolled,
      pickAugment,
      rerollAugment,
      pickPrismatic,
      rerollPrismatic,
      pickReforge,
      enhanceAugment,
      buyItem,
      undoItem,
      sellItem,
      buyShard,
      buyPrismaticItem,
      sellPrismatic,
      endShop,
    }),
    [
      step,
      stepIndex,
      done,
      gold,
      pickedAugments,
      itemIds,
      prismaticIds,
      shardIds,
      reforgeIds,
      augmentCards,
      prismaticCards,
      reforgeCards,
      rerolled,
      pickAugment,
      rerollAugment,
      pickPrismatic,
      rerollPrismatic,
      pickReforge,
      enhanceAugment,
      buyItem,
      undoItem,
      sellItem,
      buyShard,
      buyPrismaticItem,
      sellPrismatic,
      endShop,
    ],
  );
}
