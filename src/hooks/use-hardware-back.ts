import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * useHardwareBack — 화면이 포커스된 동안 Android 하드웨어 뒤로가기를 가로챈다.
 *
 * landscape 잠금 몰입 화면(draft/arena/draft-items)은 `gestureEnabled: false`로
 * iOS 스와이프만 막혀 있어, Android back으로 나가면 orientation이 잠긴 채
 * 홈으로 튕긴다. handler에서 자체 exit 플로우(확인 다이얼로그 + portrait 복귀)를
 * 호출하고 true를 반환해 기본 pop을 막을 것. iOS에서는 아무 동작도 하지 않는다.
 */
export function useHardwareBack(handler: () => boolean) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handler);
      return () => sub.remove();
    }, [handler]),
  );
}
