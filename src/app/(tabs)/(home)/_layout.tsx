import { Stack } from 'expo-router/stack';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

import { stackScreenOptions } from '@/components/navigation/stack-screen-options';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { home: '내 빌드' },
  en: { home: 'My Builds' },
};

export default function HomeStackLayout() {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  // 칼바람/아레나(가로 고정)를 다녀오면 이 스택의 네비게이션 바가 large title이
  // 접힌 채로 잠긴다 — 스크롤 오프셋은 맨 위인데 소형 inline 타이틀만 보인다.
  // headerLargeTitle 토글·스크롤 복원·화면 remount로는 다시 펴지지 않아서,
  // 세로로 돌아오는 순간 스택을 통째로 재생성해 네비바를 새로 만든다.
  const [navKey, setNavKey] = useState(0);
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      if (window.width <= window.height) setNavKey((k) => k + 1);
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack key={navKey} screenOptions={stackScreenOptions(colors)}>
      <Stack.Screen
        name="index"
        options={{
          title: translate('home'),
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
    </Stack>
  );
}
