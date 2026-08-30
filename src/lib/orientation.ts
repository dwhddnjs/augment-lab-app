/**
 * 화면 방향 잠금 — expo-screen-orientation 의 lockAsync 를 감싼다.
 *
 * lockAsync 의 Promise 는 **영영 resolve 되지 않을 수 있다.** iOS 가 다른 프레젠테이션
 * 전환(Alert dismiss 등)을 처리하는 중에 호출하면 회전 자체는 일어나는데 scene geometry
 * 업데이트 완료 콜백이 유실된다. 그 Promise 를 await 한 채 navigation 을 하면 화면이
 * 이전 상태로 누운 채 영구히 멈춘다(클래식 진입에서 실제 재현).
 *
 * 회전은 잠금 요청 시점에 이미 걸리므로, 완료 통보를 못 받아도 그냥 진행하면 된다.
 * 각 드래프트 화면이 useFocusEffect 에서 한 번 더 잠그는 것이 최종 방어선이다.
 */
import * as ScreenOrientation from "expo-screen-orientation";

/** 완료 통보를 기다릴 최대 시간. 실제 회전은 보통 300ms 안에 끝난다. */
const LOCK_TIMEOUT_MS = 700;

export async function lockOrientation(
  lock: ScreenOrientation.OrientationLock,
): Promise<void> {
  await Promise.race([
    ScreenOrientation.lockAsync(lock).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, LOCK_TIMEOUT_MS)),
  ]);
}

/**
 * 드래프트 화면을 나갈 때의 세로 복귀. `router.dismissTo("/")` **뒤에** 부른다.
 *
 * 회전을 먼저 걸면 아직 나가는 화면이 떠 있는 채로 기기가 돌아, 가로 레이아웃이
 * 세로로 찌그러지는 게 그대로 보인다. 그래서 홈 전환이 끝날 때까지 미룬다 —
 * `InteractionManager.runAfterInteractions` 는 쓸 수 없다. 네이티브 스택
 * (react-native-screens)의 dismiss 는 InteractionManager 핸들을 만들지 않아
 * 콜백이 곧바로 실행된다(시뮬레이터에서 확인: 여전히 나가는 화면이 회전했다).
 */
const EXIT_ROTATE_DELAY_MS = 420; // iOS dismiss 애니메이션(≈0.35s)보다 살짝 길게

export function lockPortraitAfterExit(): void {
  setTimeout(() => {
    void lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, EXIT_ROTATE_DELAY_MS);
}
