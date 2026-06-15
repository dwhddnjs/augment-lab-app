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
    </Stack>
  );
}
