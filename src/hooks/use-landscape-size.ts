/**
 * useLandscapeSize — 가로 화면(드래프트·아이템 선택)의 긴 변·짧은 변.
 *
 * 가로 전환은 화면 옵션이 맡는다(src/app/_layout.tsx DRAFT_OPTIONS). 창 치수가 아직 회전 전 값인
 * 프레임에도 긴 변을 가로로 보므로 카드 크기 계산이 흔들리지 않는다.
 */
import { useWindowDimensions } from "react-native";

export function useLandscapeSize() {
  const { width, height } = useWindowDimensions();
  return {
    screenW: Math.max(width, height),
    screenH: Math.min(width, height),
  };
}
