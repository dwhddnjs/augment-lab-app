/**
 * 게임 모드 메타 — 라벨·아이콘·표시 순서의 단일 출처.
 *
 * 모드 선택 오버레이 / 홈 필터 / 빌드 카드 배지 / 빌드 상세 칩이 모두 이걸 읽는다.
 * 예전엔 오버레이와 홈 목록이 각자 사본을 들고 있어 아이콘을 바꿀 때 한쪽만 바뀌었다.
 * 모드를 추가할 땐 GameMode(build-storage) 와 여기 세 상수만 손대면 된다.
 */
import type MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import type { DraftMode, GameMode } from "@/lib/build-storage";

/** 홈 필터·세그먼트 기준 순서. `+` 오버레이는 FAB에서 가까운 쪽부터라 이걸 뒤집어 쓴다. */
export const GAME_MODES: GameMode[] = ["aram", "classic", "arena"];

export const MODE_ICONS: Record<
  GameMode,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  aram: "snowflake",
  // 체스 룩 = 성벽 얹힌 탑. 고전 보드게임 말이자 협곡 포탑이라 복고 모드에 맞고,
  // 24px에서 눈송이·교차검과 실루엣이 겹치지 않는다.
  classic: "chess-rook",
  arena: "sword-cross",
};

export const MODE_LABELS = {
  ko: { aram: "칼바람", classic: "클래식", arena: "아레나" },
  en: { aram: "ARAM", classic: "Classic", arena: "Arena" },
};

/**
 * 라우트 파라미터를 아는 모드로만 통과시킨다. 모르는 값은 칼바람 폴백.
 * 삼항으로 두면 새 모드가 조용히 칼바람으로 흡수된다(클래식이 실제로 그랬다).
 */
export function parseGameMode(param: string | undefined): GameMode {
  return GAME_MODES.includes(param as GameMode) ? (param as GameMode) : "aram";
}

/** 드래프트 플로우(칼바람·클래식) 전용. 아레나는 자체 화면이라 여기로 오지 않는다. */
export function parseDraftMode(param: string | undefined): DraftMode {
  return param === "classic" ? "classic" : "aram";
}
