import { useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

/**
 * large title 헤더 아래 ScrollView 를 **진짜 최상단**으로 되돌린다.
 *
 * large title 헤더가 있으면 iOS 가 inset 을 늘려 최상단의 contentOffset.y 가 0 이 아니라 음수다 —
 * scrollTo({ y: 0 }) 는 헤더가 접힌 위치라 본문 첫 줄이 내비게이션 바에 가린다.
 * JS 로는 그 inset 을 받을 수 없어서(스크롤 이벤트의 contentInset 도 조정 전 값이다), 화면이
 * 최상단에서 열린다는 점을 이용해 드래그가 시작된 위치를 기록한다. 드래그 없이 먼저 내려간 경우
 * (VoiceOver 초점 이동)를 거르려고 0 이하일 때만 받는다.
 *
 * ScrollView 에 `scrollToOverflowEnabled` 가 필요하다 — 없으면 RN 이 inset 0 기준으로 잘라
 * 음수로 못 간다.
 */
export function useScrollTopAnchor() {
  const ref = useRef<ScrollView>(null);
  const topY = useRef<number | null>(null);

  return {
    ref,
    onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (topY.current == null && y <= 0) topY.current = y;
    },
    /** 한 번도 끌지 않았다면 아직 최상단이다 — 옮길 필요가 없다. */
    scrollToTop: () => {
      if (topY.current != null) ref.current?.scrollTo({ y: topY.current, animated: true });
    },
  };
}
