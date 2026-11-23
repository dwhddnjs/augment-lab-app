/**
 * useLandscapeReady — 회전과 함께 뜨는 가로 화면(커스텀·아이템 선택)이 본문을 그려도 되는지.
 *
 * 가로 크기와 가로 안전 영역(좌우)이 둘 다 들어와야 그린다. 크기(onLayout)만 보면 안전 영역(useSafeAreaInsets)이
 * 아직 세로 값(좌우 0)인 프레임에 그려져, 헤더가 옆으로 밀리고 위아래로 튀었다.
 * 좌우·아래 값은 크기와 거의 같이(약 0.2초) 바뀌지만, 위 값은 상태바가 다 숨은 뒤(약 1초)에야 0 이 된다 —
 * 그래서 가로 화면은 위 inset 을 쓰지 않는다(iPhone 가로는 상태바가 숨어 위가 항상 0 이다. InsetView edges 에서 뺀다).
 * "가로 모양"은 좌우 inset 이 생겼거나(Face ID 기종), 아래가 0(홈 버튼 기종 — 어느 방향이든 좌우가 없다)인 것이다.
 *
 * 한 번 준비되면 내리지 않는다 — 앱 전환 복귀 같은 순간에 세로 값이 한 프레임 들어와 본문이 unmount 되면
 * 담아 둔 증강·아이템이 날아간다. 세로 크기는 아예 담지 않는다.
 */
import { useEffect, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ponytail: 안전 영역이 끝내 가로 모양으로 바뀌지 않을 때의 상한 — 그때는 예전처럼 그리고 한 번 튀는 쪽을 택한다(빈 화면보다 낫다).
const INSETS_TIMEOUT_MS = 500;

export function useLandscapeReady() {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);
  if (!ready && size && (insets.left > 0 || insets.bottom === 0)) setReady(true);

  useEffect(() => {
    if (!size || ready) return;
    const timer = setTimeout(() => setReady(true), INSETS_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [size, ready]);

  return {
    ready,
    size,
    onLayout: (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width > height) setSize({ w: width, h: height });
    },
  };
}
