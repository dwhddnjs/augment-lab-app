/**
 * useLandscapeLock — 가로 전용 화면(드래프트·상점·아이템 선택) 공통 진입 처리.
 *
 * 포커스를 얻을 때마다 가로로 잠근다. cleanup 은 두지 않는다 — 세로 복귀는 각 화면이
 * 나갈 때 명시적으로 걸어, 이동 중간에 방향이 한 번 더 바뀌지 않게 한다.
 * 회전이 끝나기 전 프레임에서는 isLandscape 가 false 이므로, 호출부는 그동안
 * 본문 렌더를 보류해 세로 레이아웃으로 떴다가 reflow 되는 것을 막는다.
 */
import { useFocusEffect } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback } from "react";
import { useWindowDimensions } from "react-native";

export function useLandscapeLock() {
  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      ).catch(() => {});
    }, []),
  );

  const { width, height } = useWindowDimensions();
  return {
    isLandscape: width > height,
    /** 회전 완료 전에도 안정적인 긴 변/짧은 변 — 카드 크기 계산용. */
    screenW: Math.max(width, height),
    screenH: Math.min(width, height),
  };
}
