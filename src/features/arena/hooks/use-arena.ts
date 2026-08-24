/**
 * useArena — 아레나 12라운드 진행 엔진(상태 전이 전담).
 *
 * 12라운드를 평탄화한 step 흐름으로 진행한다(R1은 증강 + 신발 상점 2 step).
 * 칼바람 useAram 패턴(현재 카드 state + advance 시 다음 카드 생성)을 따르되,
 * 골드 경제·증강 레벨업·프리즘/모루/재련 누적 상태를 추가로 관리한다.
 *
 * 진행 순서·경제 수치·카드 추첨 규칙은 ../arena-rules 에 있다.
 */
import { useCallback, useState } from "react";

import { pickRandom, sampleDistinct } from "@/lib/arrays";
import {
  ARENA_START_GOLD,
  ARENA_STEPS,
  ARENA_TOTAL_ROUNDS,
  AUGMENT_SLOT_ID,
  ENHANCE_AUGMENT_ID,
  ENHANCE_LEVELS,
  MAX_ITEMS,
  PRISMATIC_SELL_PRICE,
  REFORGE_IDS,
  augmentSlots,
  buildAugmentCards,
  drawAugments,
  drawForRound,
  maxedIds,
} from "../arena-rules";
import type {
  ArenaAugment,
  ArenaPickedAugment,
  ArenaSpecialAugment,
  ArenaStep,
  PrismaticItem,
} from "../types";
import { useArenaAugments } from "./use-arena-augments";
import { usePrismaticItems, useSpecialAugments } from "./use-arena-items";

/** 아이템/프리즘 1개의 구매가·판매가 기록. 되돌리기는 buy, 판매는 sell 을 환원한다. */
type PriceLog = Record<string, { buy: number; sell: number }>;

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
  /** 능력치 모루(스탯) — 저장 포맷에는 있으나 상점 UI가 아직 없어 항상 비어 있다. */
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

/** 가격 기록에서 한 id를 지운다(보유 해제 시). */
function forget(prices: PriceLog, id: string): PriceLog {
  const next = { ...prices };
  delete next[id];
  return next;
}

export function useArena(): ArenaState {
  const allAugments = useArenaAugments();
  const allPrismatics = usePrismaticItems();
  const allSpecials = useSpecialAugments();

  const [stepIndex, setStepIndex] = useState(0);
  // R1 시작과 동시에 골드를 보유(증강 선택 화면부터 표시). 이후 shop step은 step.gold로 추가 지급.
  const [gold, setGold] = useState(ARENA_START_GOLD);
  const [pickedAugments, setPickedAugments] = useState<ArenaPickedAugment[]>(
    [],
  );
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [itemPrices, setItemPrices] = useState<PriceLog>({});
  const [prismaticIds, setPrismaticIds] = useState<string[]>([]);
  const [prismaticPrices, setPrismaticPrices] = useState<PriceLog>({});
  const [reforgeIds, setReforgeIds] = useState<string[]>([]);
  // 증강 슬롯 획득 재련을 골랐는지 — 12라운드 진입 시 보너스 실버 증강을 1장 부여한다.
  const [augmentSlotGranted, setAugmentSlotGranted] = useState(false);

  const [augmentCards, setAugmentCards] = useState<ArenaAugment[]>(() =>
    drawForRound(allAugments, 1, 3),
  );
  const [prismaticCards, setPrismaticCards] = useState<PrismaticItem[]>([]);
  const [reforgeCards, setReforgeCards] = useState<ArenaSpecialAugment[]>([]);
  const [rerolled, setRerolled] = useState<boolean[]>([false, false, false]);

  const [done, setDone] = useState(false);

  const step = ARENA_STEPS[Math.min(stepIndex, ARENA_STEPS.length - 1)];
  const maxSlots = augmentSlots(augmentSlotGranted);

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
          buildAugmentCards(allAugments, nextPicked, next.round, maxSlots),
        );
      } else if (next.kind === "prismatic") {
        setPrismaticCards(
          sampleDistinct(allPrismatics, 3, new Set(nextPrismaticIds)),
        );
      } else if (next.kind === "reforge") {
        const reforgePool = allSpecials.filter((s) => REFORGE_IDS.has(s.id));
        setReforgeCards(sampleDistinct(reforgePool, 3, new Set()));
      }
      setStepIndex(nextIndex);
    },
    [
      stepIndex,
      allAugments,
      allPrismatics,
      allSpecials,
      augmentSlotGranted,
      maxSlots,
    ],
  );

  const pickAugment = useCallback(
    (augment: ArenaAugment) => {
      setPickedAugments((prev) => {
        const existing = prev.find((p) => p.augment.id === augment.id);
        // 이미 보유 중이면 레벨업(최대치 clamp), 아니면 신규 슬롯.
        const next = existing
          ? prev.map((p) =>
              p.augment.id === augment.id
                ? { ...p, level: Math.min(p.level + 1, augment.maxLevel) }
                : p,
            )
          : [...prev, { augment, level: 1 }];
        advance(next, prismaticIds);
        return next;
      });
    },
    [advance, prismaticIds],
  );

  // idx 슬롯만 새 카드로 교체하고 그 슬롯의 리롤 권한을 소진한다.
  const replaceCard = useCallback(
    <T,>(setCards: (fn: (prev: T[]) => T[]) => void, idx: number, card: T) => {
      setCards((prev) => prev.map((c, i) => (i === idx ? card : c)));
      setRerolled((prev) => prev.map((r, i) => (i === idx ? true : r)));
    },
    [],
  );

  const rerollAugment = useCallback(
    (idx: number) => {
      if (rerolled[idx]) return;
      const shownExcept = new Set(
        augmentCards.filter((_, i) => i !== idx).map((a) => a.id),
      );

      let replacement: ArenaAugment | undefined;
      if (pickedAugments.length >= maxSlots) {
        // 슬롯이 꽉 찬 상태 — 화면에 없는, 레벨업 가능한 보유 증강으로만 교체한다.
        replacement = pickRandom(
          pickedAugments
            .filter(
              (p) =>
                p.level < p.augment.maxLevel && !shownExcept.has(p.augment.id),
            )
            .map((p) => p.augment),
        );
      } else {
        const excludeIds = new Set([
          ...maxedIds(pickedAugments),
          ...shownExcept,
        ]);
        const pool = allAugments.filter((a) => !excludeIds.has(a.id));
        [replacement] = drawAugments(pool, augmentCards[idx].rarity, 1);
      }
      if (!replacement) return;
      replaceCard(setAugmentCards, idx, replacement);
    },
    [
      rerolled,
      pickedAugments,
      augmentCards,
      allAugments,
      maxSlots,
      replaceCard,
    ],
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
      replaceCard(setPrismaticCards, idx, replacement);
    },
    [rerolled, prismaticIds, prismaticCards, allPrismatics, replaceCard],
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
        prev.includes(ENHANCE_AUGMENT_ID) ? prev : [...prev, ENHANCE_AUGMENT_ID],
      );
      setPickedAugments((prev) => {
        const remaining = prev.filter((p) => p.augment.id !== removeId);
        // 분배 대상: 현재 레벨 < 최대 레벨인 증강(여유 capacity 보유).
        const caps = remaining.map((p) => p.augment.maxLevel - p.level);
        const levels = remaining.map((p) => p.level);
        let toDistribute = Math.min(
          ENHANCE_LEVELS,
          caps.reduce((s, c) => s + c, 0),
        );
        while (toDistribute > 0) {
          const i = pickRandom(caps.map((_, k) => k).filter((k) => caps[k] > 0));
          if (i == null) break;
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
      if (gold < cost || itemIds.includes(itemId) || itemIds.length >= MAX_ITEMS)
        return false;
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
      setGold((g) => g + (itemPrices[itemId]?.[refundKind] ?? 0));
      setItemIds((prev) => prev.filter((id) => id !== itemId));
      setItemPrices((prev) => forget(prev, itemId));
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
      setGold((g) => g + (prismaticPrices[id]?.sell ?? 0));
      setPrismaticIds((prev) => prev.filter((pid) => pid !== id));
      setPrismaticPrices((prev) => forget(prev, id));
    },
    [prismaticIds, prismaticPrices],
  );

  const endShop = useCallback(() => {
    advance(pickedAugments, prismaticIds);
  }, [advance, pickedAugments, prismaticIds]);

  return {
    step,
    stepIndex,
    round: step.round,
    totalRounds: ARENA_TOTAL_ROUNDS,
    done,
    gold,
    pickedAugments,
    itemIds,
    prismaticIds,
    shardIds: EMPTY_SHARDS,
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
    buyPrismaticItem,
    sellPrismatic,
    endShop,
  };
}

// 능력치 모루 상점이 아직 없어 항상 빈 배열이다. 저장 포맷(SavedBuild.shardIds)과
// drawer/상세의 표시 경로는 이미 있으므로, 상점이 붙으면 state로 바꾸기만 하면 된다.
const EMPTY_SHARDS: string[] = [];
