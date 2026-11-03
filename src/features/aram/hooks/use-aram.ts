import { useMemo, useState } from 'react';
import { useAugmentPool } from '@/features/augments/hooks/use-augments';
import type { Augment, AugmentMode } from '@/features/augments/types';
import {
  nextRarity,
  rollHeadliner,
  rollRoundStickers,
  roundsFor,
} from '@/features/headliners/rules';
import type {
  BuildHeadliner,
  HeadlinerId,
  SkillKey,
  StickerId,
} from '@/features/headliners/types';
import { COMMAND_LINE_ODDS, RARITY_ODDS, rollRarity } from '../rarity-odds';
import { applyPick, cardPool, drawOfRarity } from '../transmute';

// Same-rarity round: roll one rarity, then draw `count` of it.
function pickWeighted(pool: Augment[], count: number, odds = RARITY_ODDS): Augment[] {
  return drawOfRarity(pool, rollRarity(odds), count);
}

function rollSlotStickers(headlinerId: string): (StickerId | null)[] {
  if (headlinerId !== 'heartsteel') return [null, null, null];
  return rollRoundStickers();
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
    () => pickWeighted(cardPool(allAugments, [], []), 3, odds),
    [allAugments, odds],
  );

  const [round, setRound] = useState(0);
  const [currentCards, setCurrentCards] = useState<Augment[]>(initialCards);
  const [picked, setPicked] = useState<Augment[]>([]);
  // 이번 판에 한 번이라도 고르거나 얻은 증강 id. 빌드에서 빠진 것(전환 증강, 판도라로 바뀐 증강)도
  // 남겨 두어 다시 카드로 나오지 않게 한다. picked 는 빌드에 남는 것만이다.
  const [taken, setTaken] = useState<Set<string>>(() => new Set());
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

  const reroll = (idx: number): Augment | null => {
    // Each card may reroll only once per round.
    if (rerolled[idx]) return null;

    const pool = cardPool(
      allAugments,
      [...taken, ...currentCards.filter((_, i) => i !== idx).map((a) => a.id)],
      picked,
    );
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
    // HEARTSTEEL 스티커는 카드가 아니라 슬롯에 붙어 있어 리롤해도 그대로다.
    return replacement;
  };

  // Returns the pick result; caller navigates to /aram-items once it's done.
  const pick = (idx: number): PickResult => {
    const chosen = currentCards[idx];
    // 전환으로 얻는 증강은 이미 얻은 것·이번 라운드 카드를 빼고 뽑는다.
    const { picked: nextPicked, granted } = applyPick(
      chosen,
      picked,
      allAugments,
      new Set([...taken, ...currentCards.map((c) => c.id)]),
    );
    const nextTaken = new Set([...taken, chosen.id, ...granted.map((a) => a.id)]);

    const sticker = slotStickers[idx];
    const nextProgress = sticker
      ? { ...progress, stickers: [...progress.stickers, sticker] }
      : progress;

    const nextRound = round + 1;
    // 펜타킬은 마지막 스킬까지 골라야 끝난다(pickSkill).
    const done = nextRound >= rounds && progress.id !== 'pentakill';

    setPicked(nextPicked);
    setTaken(nextTaken);
    setRound(nextRound);
    setProgress(nextProgress);

    if (nextRound < rounds) {
      setCurrentCards(pickWeighted(cardPool(allAugments, nextTaken, nextPicked), 3, odds));
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
