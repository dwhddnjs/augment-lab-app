/**
 * orientation — 앱 방향 잠금. 기본은 세로이고, 드래프트를 저장으로 닫는 동안만 가로를 붙잡는다.
 *
 * 저장은 드래프트 묶음을 닫으면서 빌드 상세를 'none' 전환으로 깐다(useCloseDraft). 그 전환이 진행 중일 때
 * 세로 회전이 시작돼 전환보다 먼저 끝나면, iOS 가 전환이 시작된 방향(가로)으로 되돌렸다가 다시 세로로 돌려
 * 화면이 세로 → 가로 → 세로로 흔들렸다(빌드 상세 첫 렌더로 메인 스레드가 바쁠수록 잦다).
 * 그래서 닫기 직전에 가로로 잠그고, 빌드 상세가 나타나면(transitionEnd = 전환 끝) 세로로 푼다.
 * 회전은 진행 중인 전환이 없을 때 한 번만 일어난다.
 */
import * as ScreenOrientation from 'expo-screen-orientation';

const { LANDSCAPE, PORTRAIT_UP } = ScreenOrientation.OrientationLock;

// ponytail: 빌드 상세가 나타났다는 신호가 끝내 오지 않을 때의 상한 — 그때는 그냥 세로로 푼다(가로에 갇히지 않게).
// 부하가 심한 시뮬레이터에서도 신호는 0.15초 안에 왔다.
const HOLD_TIMEOUT_MS = 1500;

let timer: ReturnType<typeof setTimeout> | undefined;

export const lockPortrait = () => ScreenOrientation.lockAsync(PORTRAIT_UP).catch(() => {});

/** 저장으로 드래프트를 닫기 직전에 부른다. 잠금이 네이티브에 닿은 뒤 돌아온다. */
export async function holdLandscape() {
  clearTimeout(timer);
  timer = setTimeout(releaseLandscape, HOLD_TIMEOUT_MS);
  await ScreenOrientation.lockAsync(LANDSCAPE).catch(() => {});
}

/** 빌드 상세가 나타나면 부른다(src/app/_layout.tsx). 붙잡은 게 없으면 아무것도 하지 않는다. */
export function releaseLandscape() {
  if (timer === undefined) return;
  clearTimeout(timer);
  timer = undefined;
  lockPortrait();
}
