import { Stack } from 'expo-router/stack';
import { useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';

import { stackScreenOptions } from '@/components/navigation/stack-screen-options';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { home: '증강 연구소', builds: '내 빌드' },
  en: { home: 'Augment Lab', builds: 'My Builds' },
};

export default function HomeStackLayout() {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  // 칼바람/커스텀(가로 고정)을 다녀오면 이 스택의 네비게이션 바가 large title이
  // 접힌 채로 잠긴다 — 스크롤 오프셋은 맨 위인데 소형 inline 타이틀만 보인다.
  // headerLargeTitle 토글·스크롤 복원·화면 remount로는 다시 펴지지 않아서,
  // 세로로 돌아오는 순간 스택을 통째로 재생성해 네비바를 새로 만든다.
  // 단, 스택 맨 위가 홈 첫 화면일 때만 바로 한다. '내 빌드' 위에서 재생성하면 그 화면과 필터가 날아가
  // 드래프트를 다녀온 사용자가 홈 첫 화면으로 떨어진다 — 그때는 미뤘다가 홈 첫 화면으로 돌아와
  // 전환이 끝난 뒤에 한다(그 전에 하면 돌아가는 전환이 중간에 끊긴다).
  const [navKey, setNavKey] = useState(0);
  const top = useRef('index');
  const stale = useRef(false);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      if (window.width > window.height) return;
      if (top.current === 'index') setNavKey((k) => k + 1);
      else stale.current = true;
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack
      key={navKey}
      screenOptions={stackScreenOptions(colors)}
      screenListeners={({ route }) => ({
        focus: () => {
          top.current = route.name;
        },
        transitionEnd: (e) => {
          if (route.name !== 'index' || e.data.closing || !stale.current) return;
          stale.current = false;
          setNavKey((k) => k + 1);
        },
      })}
    >
      <Stack.Screen
        name="index"
        options={{
          title: translate('home'),
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="builds"
        options={{
          title: translate('builds'),
          headerBackButtonDisplayMode: 'minimal',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
    </Stack>
  );
}
