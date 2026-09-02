/**
 * useCardPickAnim — 카드 3장의 선택·리롤 애니메이션 상태.
 *
 * 칼바람·클래식 드래프트와 아레나 게임 화면·두 오버레이(모루·증강 강화)가 같은 연출을 쓴다:
 *   - pick   : 고른 카드 바운스 + 나머지 fade-out → 380ms 뒤 commit
 *   - reroll : 대상 카드 fade-out → 220ms 뒤 교체(그 슬롯만 fade 재등장)
 * 실제 카드 트랜지션은 PickCard 가 exitMode/entryMode 를 보고 재생한다.
 */
import { useEffect, useRef, useState } from "react";

import type {
  CardEntryMode,
  CardExitMode,
} from "@/components/ui/pick-card";

const NO_EXIT: CardExitMode[] = ["none", "none", "none"];
const ALL_FLIP: CardEntryMode[] = ["flip", "flip", "flip"];

/** 카드 exit 애니메이션 길이 — 이 뒤에 실제 상태가 바뀐다. */
const PICK_MS = 380;
const REROLL_MS = 220;

export function useCardPickAnim() {
  const [exitModes, setExitModes] = useState<CardExitMode[]>(NO_EXIT);
  const [entryModes, setEntryModes] = useState<CardEntryMode[]>(ALL_FLIP);
  const [animating, setAnimating] = useState(false);
  // 라운드·step 전환 시 카드 재마운트(flip 등장)를 강제하는 키.
  const [roundKey, setRoundKey] = useState(0);

  // 연출이 끝나기 전에 화면을 나가면 타이머를 끊는다. 안 끊으면 unmount 뒤에 commit 이
  // 실행돼 이미 떠난 화면의 상태가 움직인다 — 칼바람에서 카드를 고른 직후 나가기를
  // 누르면 홈으로 갔다가 아이템 선택 화면이 뒤늦게 밀려 올라왔다.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // 재진입 차단은 animating(state) 이 아니라 이 ref 로 한다. animating 은 카드를 흐리게
  // 만드는 렌더용 값이라 같은 프레임 안에서는 아직 false 고, 카드의 disabled 도 마찬가지다
  // — 두 손가락으로 서로 다른 카드를 동시에 누르면 둘 다 가드를 통과해 타이머가 두 개 걸린다.
  // 그러면 timer.current 는 뒤엣것만 들고 있어 위 정리가 앞엣것을 못 끊고, 두 commit 이
  // 같은 렌더 스냅샷에서 픽을 계산해 한 장이 조용히 사라진다(마지막 라운드면 replace 가 두 번).
  const busy = useRef(false);

  /** 선택 — exit 연출이 끝난 뒤 commit() 을 실행하고 다음 카드를 flip 으로 맞이한다. */
  const pick = (idx: number, commit: () => void) => {
    if (busy.current) return;
    busy.current = true;
    setAnimating(true);
    setExitModes(NO_EXIT.map((_, i) => (i === idx ? "picked" : "unchosen")));
    timer.current = setTimeout(() => {
      busy.current = false;
      commit();
      setExitModes(NO_EXIT);
      setEntryModes(ALL_FLIP);
      setRoundKey((k) => k + 1);
      setAnimating(false);
    }, PICK_MS);
  };

  /** 리롤 — 대상 슬롯만 교체하고, 그 슬롯은 flip 대신 fade 로 돌아온다. */
  const reroll = (idx: number, swap: () => void) => {
    if (busy.current) return;
    busy.current = true;
    setAnimating(true);
    setExitModes(NO_EXIT.map((_, i) => (i === idx ? "reroll" : "none")));
    timer.current = setTimeout(() => {
      busy.current = false;
      setEntryModes((prev) => prev.map((m, i) => (i === idx ? "fade" : m)));
      swap();
      setExitModes(NO_EXIT);
      setAnimating(false);
    }, REROLL_MS);
  };

  return { exitModes, entryModes, animating, roundKey, pick, reroll };
}
