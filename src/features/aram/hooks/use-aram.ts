import { useMemo, useState } from 'react';
import { useAugmentPool } from '@/features/augments/hooks/use-augments';
import type { Augment, AugmentMode, AugmentRarity } from '@/features/augments/types';
import {
  nextRarity,
  rollHeadliner,
  rollSticker,
  roundsFor,
} from '@/features/headliners/rules';
import type {
  BuildHeadliner,
  HeadlinerId,
  SkillKey,
  StickerId,
} from '@/features/headliners/types';
import { sampleDistinct } from '@/lib/arrays';
import { COMMAND_LINE_ODDS, RARITY_ODDS, rollRarity } from '../rarity-odds';

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
function pickWeighted(pool: Augment[], count: number, odds = RARITY_ODDS): Augment[] {
  return drawOfRarity(pool, rollRarity(odds), count);
}

function rollSlotStickers(headlinerId: string): (StickerId | null)[] {
  if (headlinerId !== 'heartsteel') return [null, null, null];
  return [rollSticker(), rollSticker(), rollSticker()];
}

/** 픽 한 번의 결과. done 이면 호출부가 nextPicked·nextProgress 로 아이템 선택에 넘어간다. */
export interface PickResult {
  nextPicked: Augment[];
  nextProgress: BuildHeadliner;
  done: boolean;
}

/**
 * 칼바람 드래프트. mode 는 뽑기 풀(useAugmentPool)이다.
 * forcedHeadliner 를 주지 않으면 판마다 헤드라이너를 무작위로 정한다.
 */
export function useAram(mode: AugmentMode = 'aram', forcedHeadliner?: HeadlinerId) {
  const allAugments = useAugmentPool(mode);

  // 헤드라이너로 얻은 것. pick·pickSkill 안에서만 계산한다 — 픽 commit 은 연출 전에 잡힌
  // 클로저로 돌기 때문에 다른 곳에서 고치면 그 값을 덮어쓴다.
  const [progress, setProgress] = useState<BuildHeadliner>(() => ({
    id: forcedHeadliner ?? rollHeadliner(),
    skills: [],
    stickers: [],
  }));
  const odds = progress.id === 'command-line' ? COMMAND_LINE_ODDS : RARITY_ODDS;

  const initialCards = useMemo(
    () => pickWeighted(allAugments, 3, odds),
    [allAugments, odds],
  );

  const [round, setRound] = useState(0);
  const [currentCards, setCurrentCards] = useState<Augment[]>(initialCards);
  const [picked, setPicked] = useState<Augment[]>([]);
  // Per-slot reroll usage for the current round; each card may reroll only once.
  const [rerolled, setRerolled] = useState<boolean[]>([false, false, false]);
  const [slotStickers, setSlotStickers] = useState(() => rollSlotStickers(progress.id));
  const [hackUsed, setHackUsed] = useState(false);

  const rounds = roundsFor(progress.id);

  // 펜타킬은 증강 앞뒤로 스킬을 고른다. 어느 차례인지는 진행 상태에서 바로 나온다.
  const needsSkillPick =
    progress.id === 'pentakill' &&
    (progress.skills.length === 0 || (round >= rounds && progress.skills.length === 1));

  // 커맨드 라인: 매 라운드 첫 리롤이 해킹이다. 라운드는 실버·골드로만 시작해 항상 등급이 오른다.
  const hacked = progress.id === 'command-line' && !hackUsed;

  const drawNext = (exclude: Augment[]) => {
    const excludeIds = new Set(exclude.map((a) => a.id));
    const pool = allAugments.filter((a) => !excludeIds.has(a.id));
    return pickWeighted(pool, 3, odds);
  };

  const reroll = (idx: number): Augment | null => {
    // Each card may reroll only once per round.
    if (rerolled[idx]) return null;

    const excludeIds = new Set([
      ...picked.map((a) => a.id),
      ...currentCards.filter((_, i) => i !== idx).map((a) => a.id),
    ]);
    const pool = allAugments.filter((a) => !excludeIds.has(a.id));
    if (pool.length === 0) return null;
    // 일반 리롤은 그 카드의 등급을 유지하고, 해킹 리롤만 한 등급 올린다.
    const card = currentCards[idx];
    const upgraded = hacked ? nextRarity(card.rarity) : null;
    const [replacement] = drawOfRarity(pool, upgraded ?? card.rarity, 1);
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
    setHackUsed(true);
    if (progress.id === 'heartsteel') {
      setSlotStickers((prev) => {
        const next = [...prev];
        next[idx] = rollSticker();
        return next;
      });
    }
    return replacement;
  };

  // Returns the pick result; caller navigates to /aram-items once it's done.
  const pick = (idx: number): PickResult => {
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

    const sticker = slotStickers[idx];
    const nextProgress = sticker
      ? { ...progress, stickers: [...progress.stickers, sticker] }
      : progress;

    const nextRound = round + 1;
    // 펜타킬은 마지막 스킬까지 골라야 끝난다(pickSkill).
    const done = nextRound >= rounds && progress.id !== 'pentakill';

    setPicked(nextPicked);
    setRound(nextRound);
    setProgress(nextProgress);

    if (nextRound < rounds) {
      setCurrentCards(drawNext(nextPicked));
      setRerolled([false, false, false]); // fresh reroll budget each round
      setHackUsed(false);
      setSlotStickers(rollSlotStickers(progress.id));
    }

    return { nextPicked, nextProgress, done };
  };

  const pickSkill = (skill: SkillKey): PickResult => {
    const nextProgress = { ...progress, skills: [...progress.skills, skill] };
    const done = nextProgress.skills.length >= 2;
    // 마지막 선택은 state 에 넣지 않는다 — 넣으면 needsSkillPick 이 꺼져 화면을 떠나는
    // 사이에 증강 카드가 다시 뜬다.
    if (!done) setProgress(nextProgress);
    return { nextPicked: picked, nextProgress, done };
  };

  return {
    round,
    currentCards,
    picked,
    rerolled,
    progress,
    slotStickers,
    hacked,
    needsSkillPick,
    reroll,
    pick,
    pickSkill,
  };
}
