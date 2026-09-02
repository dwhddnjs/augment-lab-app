/**
 * useAlive — 이 화면이 아직 살아 있는지 알려 주는 ref.
 *
 * 저장·회전에는 await 가 붙어 몇백 ms가 뜨는데, 그 사이 사용자는 나가기를 누르거나
 * 모달을 스와이프로 닫을 수 있다. 그래도 await 체인은 계속 흘러 회전과 navigation 을
 * 마저 하려 든다 — 나간 사용자를 빌드 상세로 도로 끌고 가는 셈이다.
 * await 뒤에 `if (!alive.current) return;` 한 줄로 막는다.
 *
 * 방향 되돌리기는 여기서 하지 않는다. 나가기 경로가 이미 lockPortraitAfterExit 을
 * 부르므로, 죽은 화면은 회전에도 손대지 않고 그냥 물러나는 게 맞다.
 */
import { useEffect, useRef } from "react";

export function useAlive() {
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  return alive;
}
