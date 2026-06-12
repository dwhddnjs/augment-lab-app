import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: { home: '메인', community: '커뮤니티', mypage: '마이페이지', plus: '추가' },
  en: { home: 'Home', community: 'Community', mypage: 'My Page', plus: 'Add' },
};

export default function AppTabs() {
  const { colors } = useTheme();
  const translate = useTranslation(t);

  return (
    <NativeTabs tintColor={colors.accent.default}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>{translate('home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(community)">
        <NativeTabs.Trigger.Label>{translate('community')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(mypage)">
        <NativeTabs.Trigger.Label>{translate('mypage')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="plus">
        <NativeTabs.Trigger.Label>{translate('plus')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
