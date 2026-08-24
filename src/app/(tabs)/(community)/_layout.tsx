import { Stack } from 'expo-router/stack';

import { stackScreenOptions } from '@/components/navigation/stack-screen-options';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { title: '커뮤니티' },
  en: { title: 'Community' },
};

export default function CommunityStackLayout() {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  return (
    <Stack screenOptions={stackScreenOptions(colors)}>
      <Stack.Screen
        name="index"
        options={{ title: translate('title'), headerLargeTitle: true }}
      />
    </Stack>
  );
}
