/**
 * MyPageScreen — 마이페이지 설정/요약 화면.
 * 화면 타이틀은 (mypage) 스택의 native large-title 헤더가 제공한다.
 *
 * 섹션: 외관(테마 3단) · 언어(2단) · 내 빌드 요약 · 앱 정보.
 * 모든 색/간격/반경은 테마 토큰만 사용. 떠 있는 표면이 아니므로 글라스 미적용.
 */
import Constants from 'expo-constants';
import { openBrowserAsync } from 'expo-web-browser';
import { SymbolView } from 'expo-symbols';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useLocale, type Locale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference, type ThemePreference } from '@/hooks/use-theme-preference';
import { useTranslation } from '@/lib/i18n';

const GITHUB_URL = 'https://github.com/dwhddnjs/aram-augment-lab-app';
const FEEDBACK_EMAIL = 'syd1215no@gmail.com';

const t = {
  ko: {
    appearance: '화면',
    system: '시스템',
    light: '라이트',
    dark: '다크',
    language: '언어',
    info: '정보',
    version: '버전',
    github: 'GitHub',
    feedback: '피드백 보내기',
  },
  en: {
    appearance: 'Appearance',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    info: 'About',
    version: 'Version',
    github: 'GitHub',
    feedback: 'Send feedback',
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="caption" color="tertiary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <ThemedView surface="raised" style={styles.card}>
        {children}
      </ThemedView>
    </View>
  );
}

function Segment({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors, elevation } = useTheme();
  return (
    <View style={[styles.segmentTrack, { backgroundColor: colors.surface.sunken }]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={styles.segmentItem}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <View
              style={[
                styles.segmentThumb,
                selected && [{ backgroundColor: colors.surface.base }, elevation.level1],
              ]}
            >
              <ThemedText type="label" color={selected ? 'accent' : 'secondary'} numberOfLines={1}>
                {opt.label}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle },
        pressed && onPress ? { backgroundColor: colors.surface.sunken } : null,
      ]}
    >
      <ThemedText type="body">{label}</ThemedText>
      <View style={styles.rowRight}>
        {value ? (
          <ThemedText type="body" color="secondary">
            {value}
          </ThemedText>
        ) : null}
        {onPress ? (
          <SymbolView name="chevron.right" size={13} weight="semibold" tintColor={colors.text.tertiary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function MyPageScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const { locale, setLocale } = useLocale();

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface.base }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Section title={translate('appearance')}>
        <View style={styles.cardPad}>
          <Segment
            value={preference}
            onChange={(v) => setPreference(v as ThemePreference)}
            options={[
              { value: 'system', label: translate('system') },
              { value: 'light', label: translate('light') },
              { value: 'dark', label: translate('dark') },
            ]}
          />
        </View>
      </Section>

      <Section title={translate('language')}>
        <View style={styles.cardPad}>
          <Segment
            value={locale}
            onChange={(v) => setLocale(v as Locale)}
            options={[
              { value: 'ko', label: '한국어' },
              { value: 'en', label: 'English' },
            ]}
          />
        </View>
      </Section>

      <Section title={translate('info')}>
        <Row label={translate('version')} value={version} />
        <Row label={translate('github')} onPress={() => openBrowserAsync(GITHUB_URL)} />
        <Row
          label={translate('feedback')}
          onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}`)}
          last
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.two,
  },
  card: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  cardPad: {
    padding: Spacing.double,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    padding: Spacing.half,
  },
  segmentItem: {
    flex: 1,
  },
  segmentThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.double,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
