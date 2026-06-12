import { Stack } from 'expo-router/stack';

import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { title: '마이페이지' },
  en: { title: 'My Page' },
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
    </Stack>
  );
}
