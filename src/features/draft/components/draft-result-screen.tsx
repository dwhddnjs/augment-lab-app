import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { championLoadingUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';
import type { Augment } from '@/features/augments/types';
import { useLandscapeLock } from '../hooks/use-landscape-lock';
import { DraftCardFrame } from './draft-card-frame';

const t = {
  ko: { title: '드래프트 완료', restart: '다시 시작', home: '홈으로' },
  en: { title: 'Draft Complete', restart: 'Restart', home: 'Home' },
};

export function DraftResultScreen() {
  useLandscapeLock();

  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { picked: pickedJson, championId } = useLocalSearchParams<{
    picked: string;
    championId: string;
  }>();

  const { width, height } = useWindowDimensions();
  const screenW = width > height ? width : height;

  const picked: Augment[] = pickedJson ? JSON.parse(pickedJson) : [];

  const cardWidth = Math.floor((screenW - Spacing.four * 2 - Spacing.three * 3) / 4);

  const handleHome = () => {
    router.dismissTo('/');
  };

  const handleRestart = () => {
    router.replace('/select-champion-modal' as never);
  };

  const splashUri = championId ? championLoadingUrl(championId) : null;

  return (
    <ThemedView style={styles.container}>
      {/* Background splash */}
      {splashUri && (
        <Image
          source={{ uri: splashUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={{ top: '15%', left: '50%' }}
        />
      )}
      <LinearGradient
        colors={[colors.surface.base + 'CC', colors.surface.base + 'F5', colors.surface.base]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <ThemedText type="heading" style={{ textAlign: 'center', paddingTop: Spacing.three }}>
          {translate('title')}
        </ThemedText>

        <ScrollView
          horizontal
          contentContainerStyle={[styles.cardsRow, { paddingHorizontal: Spacing.four }]}
          showsHorizontalScrollIndicator={false}
        >
          {picked.map((aug, i) => (
            <View key={aug.id} style={{ gap: Spacing.two, alignItems: 'center' }}>
              <ThemedText type="caption" color="tertiary">
                #{i + 1}
              </ThemedText>
              <DraftCardFrame augment={aug} cardWidth={cardWidth} />
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttons}>
          <Pressable
            onPress={handleRestart}
            style={[styles.btn, { backgroundColor: colors.surface.raised, borderColor: colors.border.default, borderWidth: 1 }]}
          >
            <Image source="sf:arrow.counterclockwise" style={styles.btnIcon} tintColor={colors.text.primary} />
            <ThemedText type="label">{translate('restart')}</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleHome}
            style={[styles.btn, { backgroundColor: colors.accent.default }]}
          >
            <Image source="sf:house.fill" style={styles.btnIcon} tintColor={colors.accent.onAccent} />
            <ThemedText type="label" style={{ color: colors.accent.onAccent }}>
              {translate('home')}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
    paddingVertical: Spacing.two,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.double,
    borderRadius: Radius.xl,
  },
  btnIcon: {
    width: 18,
    height: 18,
  },
});
