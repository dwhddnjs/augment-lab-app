/**
 * 게임 모드 메타 — 진입점 라벨·아이콘·표시 순서의 단일 출처.
 *
 * 모드는 칼바람 하나만 남았다(아레나 2026-09-19, 클래식 2026-10-30 제거). 그래서 홈
 * 세그먼트·모드 배지는 걷어냈고, 남은 소비처는 `+` 오버레이와 라우트 파라미터 해석뿐이다.
 * 모드를 다시 추가할 땐 GameMode(build-storage) 와 여기 상수만 손대면 된다.
 */
import type MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import type { GameMode } from "@/lib/build-storage";

export const GAME_MODES: GameMode[] = ["aram"];

/**
 * 라우트 파라미터를 아는 모드로만 통과시킨다. 모르는 값은 칼바람 폴백.
 * 삼항으로 두면 새 모드가 조용히 칼바람으로 흡수된다(클래식이 실제로 그랬다).
 */
export function parseGameMode(param: string | undefined): GameMode {
  return GAME_MODES.includes(param as GameMode) ? (param as GameMode) : "aram";
}

/**
 * `+` 오버레이가 띄우는 **진입점**. 저장 모드(GameMode)가 아니라 목적지 화면이다.
 * 커스텀은 결과를 칼바람으로 저장하므로 GameMode 에 넣지 않는다.
 */
export type LaunchMode = GameMode | "custom";

export const LAUNCH_MODES: LaunchMode[] = [...GAME_MODES, "custom"];

export const LAUNCH_ICONS: Record<
  LaunchMode,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  aram: "snowflake",
  // 조절 슬라이더 = "내가 값을 정한다". 눈송이와 24px 실루엣이 겹치지 않는다.
  custom: "tune-variant",
};

export const LAUNCH_LABELS = {
  ko: { aram: "칼바람", custom: "커스텀" },
  en: { aram: "ARAM", custom: "Custom" },
};

/** parseGameMode 와 같은 이유로 매핑 방식. 모르는 값은 칼바람 폴백. */
export function parseLaunchMode(param: string | undefined): LaunchMode {
  return LAUNCH_MODES.includes(param as LaunchMode)
    ? (param as LaunchMode)
    : "aram";
}
