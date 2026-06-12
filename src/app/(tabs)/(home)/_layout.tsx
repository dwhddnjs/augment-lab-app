import { Stack } from 'expo-router/stack';

import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { home: '내 빌드' },
  en: { home: 'My Builds' },
};

export default function HomeStackLayout() {
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
        options={{
          title: translate('home'),
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
      {/* 상세는 챔피언 배너가 헤더 영역까지 채우는 투명 collapsing 헤더 */}
      <Stack.Screen
        name="build/[id]"
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerBlurEffect: 'none',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  );
}
