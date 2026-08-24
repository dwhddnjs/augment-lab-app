import { useCallback, useMemo, useState } from 'react';
import { useAugmentPool } from '@/features/augments/hooks/use-augments';
import type { Augment, AugmentMode, AugmentRarity } from '@/features/augments/types';
import { sampleDistinct } from '@/lib/arrays';
import { rollRarity } from '../rarity-odds';

// "Transmute: Chaos" grants extra random augments when picked.
const TRANSMUTE_CHAOS_ID = 'transmute-chaos';
const TRANSMUTE_CHAOS_BONUS = 2;

// Draw `count` augments of a single rarity; if that pool is too small, fill the
// remainder from any rarity so the round is never short.
function drawOfRarity(
  pool: Augment[],
  rarity: AugmentRarity,
  count: number,
  used: Set<string> = new Set(),
): Augment[] {
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

// Same-rarity round: roll one rarity, then draw `count` of it.
function pickWeighted(pool: Augment[], count: number): Augment[] {
  return drawOfRarity(pool, rollRarity(), count);
}

/**
 * 칼바람·클래식 공용 드래프트. 두 모드는 규칙이 같고 증강 풀과 라운드 수만 다르다.
 * - mode:   뽑기 풀 (칼바람 211개 / 클래식 187개, 156개는 공유)
 * - rounds: 칼바람은 항상 4, 클래식은 바론 간식 여부에 따라 4 또는 5
 */
export function useAram(mode: AugmentMode = 'aram', rounds = 4) {
  const allAugments = useAugmentPool(mode);

  const initialCards = useMemo(() => pickWeighted(allAugments, 3), [allAugments]);

  const [round, setRound] = useState(0);
  const [currentCards, setCurrentCards] = useState<Augment[]>(initialCards);
  const [picked, setPicked] = useState<Augment[]>([]);
  // Per-slot reroll usage for the current round; each card may reroll only once.
  const [rerolled, setRerolled] = useState<boolean[]>([false, false, false]);

  const drawNext = useCallback(
    (exclude: Augment[]) => {
      const excludeIds = new Set(exclude.map((a) => a.id));
      const pool = allAugments.filter((a) => !excludeIds.has(a.id));
      return pickWeighted(pool, 3);
    },
    [allAugments],
  );

  const reroll = useCallback(
    (idx: number): Augment | null => {
      // Each card may reroll only once per round.
      if (rerolled[idx]) return null;

      const excludeIds = new Set([
        ...picked.map((a) => a.id),
        ...currentCards.filter((_, i) => i !== idx).map((a) => a.id),
      ]);
      const pool = allAugments.filter((a) => !excludeIds.has(a.id));
      if (pool.length === 0) return null;
      // Keep the same rarity as the card being rerolled so the row stays one color.
      const [replacement] = drawOfRarity(pool, currentCards[idx].rarity, 1);
      if (!replacement) return null;

      setCurrentCards((prev) => {
        const next = [...prev];
        next[idx] = replacement;
        return next;
      });
      setRerolled((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      return replacement;
    },
    [allAugments, picked, currentCards, rerolled],
  );

  // Returns nextPicked; caller navigates to /aram-items once `rounds` picks are done
  const pick = useCallback(
    (idx: number): { nextPicked: Augment[]; done: boolean } => {
      const chosen = currentCards[idx];
      const nextPicked = [...picked, chosen];

      // Transmute: Chaos grants 2 extra random augments (any rarity, no dupes).
      if (chosen.id === TRANSMUTE_CHAOS_ID) {
        const excludeIds = new Set([
          ...nextPicked.map((a) => a.id),
          ...currentCards.map((a) => a.id),
        ]);
        const pool = allAugments.filter((a) => !excludeIds.has(a.id));
        nextPicked.push(...sampleDistinct(pool, TRANSMUTE_CHAOS_BONUS, new Set()));
      }

      const nextRound = round + 1;
      const done = nextRound >= rounds;

      setPicked(nextPicked);
      setRound(nextRound);

      if (!done) {
        setCurrentCards(drawNext(nextPicked));
        setRerolled([false, false, false]); // fresh reroll budget each round
      }

      return { nextPicked, done };
    },
    [allAugments, currentCards, drawNext, picked, round, rounds],
  );

  return { round, currentCards, picked, rerolled, reroll, pick };
}
