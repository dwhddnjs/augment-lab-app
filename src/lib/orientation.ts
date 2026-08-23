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
import * as ScreenOrientation from 'expo-screen-orientation';

/** 완료 통보를 기다릴 최대 시간. 실제 회전은 보통 300ms 안에 끝난다. */
const LOCK_TIMEOUT_MS = 700;

export async function lockOrientation(
  lock: ScreenOrientation.OrientationLock
): Promise<void> {
  await Promise.race([
    ScreenOrientation.lockAsync(lock).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, LOCK_TIMEOUT_MS)),
  ]);
}
