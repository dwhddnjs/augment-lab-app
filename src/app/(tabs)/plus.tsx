import { useCallback } from 'react';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';

export default function PlusTab() {
  const router = useRouter();
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      // plus 탭은 목적지가 아니라 모달 트리거다.
      // NativeTabs는 탭 선택을 preventDefault로 막을 수 없어서(plus가 무조건 선택됨),
      // 모달을 닫으면 빈 plus 화면이 남거나, focus가 plus로 돌아와 모달이 재오픈되는
      // 루프가 생긴다. 그래서 "직전에 보던 탭"으로 선택을 되돌린 뒤 모달을 띄운다.
      // 사용자 입장에선 보던 화면 위로 모달이 열리고, 닫으면 그 화면으로 돌아온다.
      const state = navigation.getState() as
        | { history?: { key: string }[]; routes: { key: string; name: string }[] }
        | undefined;
      const history = state?.history;
      const prevKey = history?.[history.length - 2]?.key;
      const prevRoute = prevKey
        ? state?.routes.find((r) => r.key === prevKey)
        : undefined;
      if (prevRoute) {
        // navigate(name)은 라우트 등록을 보존하므로 plus 재탭이 계속 동작한다.
        navigation.navigate(prevRoute.name as never);
      } else {
        router.navigate('/'); // history가 없으면 홈으로 폴백
      }
      router.push('/select-champion-modal');
    }, [navigation, router])
  );
  return null;
}
