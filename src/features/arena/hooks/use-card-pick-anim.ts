/**
 * useCardPickAnim — 아레나 카드 3장의 선택·리롤 애니메이션 상태.
 *
 * 게임 화면과 두 오버레이(모루·증강 강화)가 같은 연출을 쓴다:
 *   - pick   : 고른 카드 바운스 + 나머지 fade-out → 380ms 뒤 commit
 *   - reroll : 대상 카드 fade-out → 220ms 뒤 교체(그 슬롯만 fade 재등장)
 * 실제 카드 트랜지션은 ArenaPickCard 가 exitMode/entryMode 를 보고 재생한다.
 */
import { useState } from "react";

import type {
  ArenaCardEntryMode,
  ArenaCardExitMode,
} from "../components/arena-pick-card";

const NO_EXIT: ArenaCardExitMode[] = ["none", "none", "none"];
const ALL_FLIP: ArenaCardEntryMode[] = ["flip", "flip", "flip"];

/** 카드 exit 애니메이션 길이 — 이 뒤에 실제 상태가 바뀐다. */
const PICK_MS = 380;
const REROLL_MS = 220;

export function useCardPickAnim() {
  const [exitModes, setExitModes] = useState<ArenaCardExitMode[]>(NO_EXIT);
  const [entryModes, setEntryModes] = useState<ArenaCardEntryMode[]>(ALL_FLIP);
  const [animating, setAnimating] = useState(false);
  // step 전환 시 카드 재마운트(flip 등장)를 강제하는 키.
  const [roundKey, setRoundKey] = useState(0);

  /** 선택 — exit 연출이 끝난 뒤 commit() 을 실행하고 다음 카드를 flip 으로 맞이한다. */
  const pick = (idx: number, commit: () => void) => {
    if (animating) return;
    setAnimating(true);
    setExitModes(NO_EXIT.map((_, i) => (i === idx ? "picked" : "unchosen")));
    setTimeout(() => {
      commit();
      setExitModes(NO_EXIT);
      setEntryModes(ALL_FLIP);
      setRoundKey((k) => k + 1);
      setAnimating(false);
    }, PICK_MS);
  };

  /** 리롤 — 대상 슬롯만 교체하고, 그 슬롯은 flip 대신 fade 로 돌아온다. */
  const reroll = (idx: number, swap: () => void) => {
    if (animating) return;
    setAnimating(true);
    setExitModes(NO_EXIT.map((_, i) => (i === idx ? "reroll" : "none")));
    setTimeout(() => {
      setEntryModes((prev) => prev.map((m, i) => (i === idx ? "fade" : m)));
      swap();
      setExitModes(NO_EXIT);
      setAnimating(false);
    }, REROLL_MS);
  };

  return { exitModes, entryModes, animating, roundKey, pick, reroll };
}
