import { Stack } from 'expo-router/stack';

import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { title: '마이페이지', data: '데이터 관리' },
  en: { title: 'My Page', data: 'Manage Data' },
};

export default function MyPageStackLayout() {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.accent.default,
        headerTitleStyle: { color: colors.text.primary },
        headerLargeTitleStyle: { color: colors.text.primary },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: translate('title'), headerLargeTitle: true }}
      />
      <Stack.Screen
        name="data"
        options={{
          title: translate('data'),
          // 뒤로가기는 화살표만 — "마이페이지" 라벨은 헤더 타이틀과 겹쳐 시끄럽다.
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  );
}
