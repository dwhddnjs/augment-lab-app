/**
 * useArena — 아레나 12라운드 진행 엔진.
 *
 * 12라운드를 평탄화한 step 흐름으로 진행한다(R1은 증강 + 신발 상점 2 step).
 * 칼바람 useDraft 패턴(현재 카드 state + advance 시 다음 카드 생성)을 따르되,
 * 골드 경제·증강 레벨업·프리즘/모루/재련 누적 상태를 추가로 관리한다.
 */
import { useCallback, useMemo, useState } from 'react';

import type { AugmentRarity } from '@/features/augments/types';
import {
  MAX_AUGMENT_LEVEL,
  type ArenaAugment,
  type ArenaPickedAugment,
  type ArenaSpecialAugment,
  type ArenaStep,
  type PrismaticItem,
} from '@/features/arena/types';
import { useArenaAugments } from './use-arena-augments';
import { usePrismaticItems, useSpecialAugments } from './use-arena-items';

// 12라운드를 평탄화한 step 흐름. round는 표시용(1~12).
export const ARENA_STEPS: ArenaStep[] = [
  { round: 1, kind: 'augment' },
  { round: 1, kind: 'boots', gold: 500 },
  { round: 2, kind: 'prismatic' },
  { round: 3, kind: 'augment' },
  { round: 4, kind: 'shop', gold: 2500 },
  { round: 5, kind: 'augment' },
  { round: 6, kind: 'shop', gold: 2500 },
  { round: 7, kind: 'augment' },
  { round: 8, kind: 'reforge' },
  { round: 9, kind: 'shop', gold: 2500 },
  { round: 10, kind: 'augment' },
  { round: 11, kind: 'shop', gold: 2500 },
  { round: 12, kind: 'augment' },
];

export const ARENA_TOTAL_ROUNDS = 12;

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
  if (r < wPrismatic) return 'prismatic';
  if (r < wPrismatic + wGold) return 'gold';
  return 'silver';
}

function sampleDistinct<T extends { id: string }>(
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
  /** shop/boots: 골드가 충분하면 차감 후 누적, 성공 시 true. */
  buyItem: (itemId: string, price: number) => boolean;
  buyShard: (shardId: string, price: number) => boolean;
  buyPrismaticItem: (item: PrismaticItem, price: number) => boolean;
  /** shop/boots 종료(구매 없이 스킵 포함) → 다음 step. */
  endShop: () => void;
}

export function useArena(): ArenaState {
  const allAugments = useArenaAugments();
  const allPrismatics = usePrismaticItems();
  const allSpecials = useSpecialAugments();

  const [stepIndex, setStepIndex] = useState(0);
  const [gold, setGold] = useState(0);
  const [pickedAugments, setPickedAugments] = useState<ArenaPickedAugment[]>(
    [],
  );
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [prismaticIds, setPrismaticIds] = useState<string[]>([]);
  const [shardIds, setShardIds] = useState<string[]>([]);
  const [reforgeIds, setReforgeIds] = useState<string[]>([]);

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
    (
      nextPicked: ArenaPickedAugment[],
      nextPrismaticIds: string[],
    ) => {
      const nextIndex = stepIndex + 1;
      if (nextIndex >= ARENA_STEPS.length) {
        setDone(true);
        setStepIndex(nextIndex);
        return;
      }
      const next = ARENA_STEPS[nextIndex];
      if (next.gold) setGold((g) => g + next.gold!);
      setRerolled([false, false, false]);

      if (next.kind === 'augment') {
        const used = maxedIds(nextPicked);
        setAugmentCards(drawAugments(allAugments, rollRarity(next.round), 3, used));
      } else if (next.kind === 'prismatic') {
        const used = new Set(nextPrismaticIds);
        setPrismaticCards(sampleDistinct(allPrismatics, 3, used));
      } else if (next.kind === 'reforge') {
        setReforgeCards(sampleDistinct(allSpecials, 3, new Set()));
      }
      setStepIndex(nextIndex);
    },
    [stepIndex, allAugments, allPrismatics, allSpecials],
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
      const [replacement] = drawAugments(
        pool,
        augmentCards[idx].rarity,
        1,
      );
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
      advance(pickedAugments, prismaticIds);
    },
    [advance, pickedAugments, prismaticIds],
  );

  const buyItem = useCallback(
    (itemId: string, price: number) => {
      if (gold < price || itemIds.includes(itemId)) return false;
      setGold((g) => g - price);
      setItemIds((prev) => [...prev, itemId]);
      return true;
    },
    [gold, itemIds],
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
    (item: PrismaticItem, price: number) => {
      if (gold < price || prismaticIds.includes(item.id)) return false;
      setGold((g) => g - price);
      setPrismaticIds((prev) => [...prev, item.id]);
      return true;
    },
    [gold, prismaticIds],
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
      buyItem,
      buyShard,
      buyPrismaticItem,
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
      buyItem,
      buyShard,
      buyPrismaticItem,
      endShop,
    ],
  );
}
