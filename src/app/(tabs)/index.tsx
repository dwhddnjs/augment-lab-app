import * as Device from 'expo-device';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/navigation/animated-icon';
import { HintRow } from '@/components/ui/hint-row';
import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { WebBadge } from '@/components/ui/web-badge';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/lib/i18n';

const t = {
  ko: {
    title: 'Expo에 오신 것을 환영합니다',
    getStarted: '시작하기',
    tryEditing: '파일 수정해보기',
    devTools: '개발자 도구',
    freshStart: '초기화',
    devToolsWeb: '브라우저 개발자 도구 사용',
    devToolsDevice: '기기를 흔들거나 터미널에서',
    devToolsSimulatorAndroid: '누르세요',
    devToolsSimulatorIos: '누르세요',
  },
  en: {
    title: 'Welcome to Expo',
    getStarted: 'get started',
    tryEditing: 'Try editing',
    devTools: 'Dev tools',
    freshStart: 'Fresh start',
    devToolsWeb: 'use browser devtools',
    devToolsDevice: 'shake device or press',
    devToolsSimulatorAndroid: 'in terminal',
    devToolsSimulatorIos: 'in terminal',
  },
};

function getDevMenuHint(translate: (key: keyof typeof t.en) => string) {
  if (Platform.OS === 'web') {
    return <ThemedText type="label">{translate('devToolsWeb')}</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="label">
        {translate('devToolsDevice')} <ThemedText type="code">m</ThemedText>{' '}
        {translate('devToolsSimulatorIos')}
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="label">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  const translate = useTranslation(t);
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="display" style={styles.title}>
            {translate('title')}
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          {translate('getStarted')}
        </ThemedText>

        <ThemedView surface="raised" style={styles.stepContainer}>
          <HintRow
            title={translate('tryEditing')}
            hint={<ThemedText type="code">src/app/(tabs)/index.tsx</ThemedText>}
          />
          <HintRow title={translate('devTools')} hint={getDevMenuHint(translate)} />
          <HintRow
            title={translate('freshStart')}
            hint={<ThemedText type="code">npm run reset-project</ThemedText>}
          />
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Radius.xl,
  },
});
