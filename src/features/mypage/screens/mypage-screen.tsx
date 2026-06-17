/**
 * MyPageScreen (Android·fallback) — universal `@expo/ui` 리스트.
 * universal `List`/`ListItem`/`Picker`는 Android에서 Jetpack Compose로 렌더된다.
 * universal에는 섹션 헤더(Section)가 없으므로 평면 리스트로 구성한다.
 * 화면 타이틀은 (mypage) 스택의 native 헤더가 제공한다.
 */
import { Host, List, ListItem, Picker, Text } from '@expo/ui';
import Constants from 'expo-constants';
import { openBrowserAsync } from 'expo-web-browser';
import { Linking } from 'react-native';

import { useLocale, type Locale } from '@/hooks/use-locale';
import { useThemePreference, type ThemePreference } from '@/hooks/use-theme-preference';
import { useTranslation } from '@/lib/i18n';

const GITHUB_URL = 'https://github.com/dwhddnjs/aram-augment-lab-app';
const FEEDBACK_EMAIL = 'syd1215no@gmail.com';

const t = {
  ko: {
    theme: '테마',
    system: '시스템',
    light: '라이트',
    dark: '다크',
    language: '언어',
    version: '버전',
    github: 'GitHub',
    feedback: '피드백 보내기',
  },
  en: {
    theme: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    version: 'Version',
    github: 'GitHub',
    feedback: 'Send feedback',
  },
};

export default function MyPageScreen() {
  const translate = useTranslation(t);
  const { locale, setLocale } = useLocale();
  const { preference, setPreference } = useThemePreference();

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Host style={{ flex: 1 }}>
      <List>
        <ListItem
          trailing={
            <Picker
              selectedValue={preference}
              onValueChange={(v) => setPreference(v as ThemePreference)}
              appearance="menu"
            >
              <Picker.Item label={translate('system')} value="system" />
              <Picker.Item label={translate('light')} value="light" />
              <Picker.Item label={translate('dark')} value="dark" />
            </Picker>
          }
        >
          {translate('theme')}
        </ListItem>
        <ListItem
          trailing={
            <Picker
              selectedValue={locale}
              onValueChange={(v) => setLocale(v as Locale)}
              appearance="menu"
            >
              <Picker.Item label="한국어" value="ko" />
              <Picker.Item label="English" value="en" />
            </Picker>
          }
        >
          {translate('language')}
        </ListItem>
        <ListItem trailing={<Text>{version}</Text>}>{translate('version')}</ListItem>
        <ListItem onPress={() => openBrowserAsync(GITHUB_URL)}>{translate('github')}</ListItem>
        <ListItem onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}`)}>
          {translate('feedback')}
        </ListItem>
      </List>
    </Host>
  );
}
