import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/lib/i18n';
import { useDraft } from '../hooks/use-draft';
import { useLandscapeLock } from '../hooks/use-landscape-lock';
import { DraftCard, type CardExitMode } from './draft-card';
import { PickedDrawer } from './picked-drawer';
import { RoundIndicator } from './round-indicator';

const t = {
  ko: {
    round: '라운드',
    picks: '픽 현황',
    exit: '나가기',
    exitConfirm: '드래프트를 종료할까요?',
    exitOk: '종료',
    exitCancel: '계속',
  },
  en: {
    round: 'Round',
    picks: 'Picks',
    exit: 'Exit',
    exitConfirm: 'Exit the draft?',
    exitOk: 'Exit',
    exitCancel: 'Continue',
  },
};

type ExitModes = [CardExitMode, CardExitMode, CardExitMode];

const IDLE: ExitModes = ['none', 'none', 'none'];

export function DraftScreen() {
  useLandscapeLock();

  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { championId } = useLocalSearchParams<{ championId: string }>();

  const { round, currentCards, picked, reroll, pick } = useDraft();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenW = isLandscape ? width : height;
  const screenH = isLandscape ? height : width;

  const hPad = Spacing.four;   // 24
  const cardGap = Spacing.three; // 16

  // Width-constrained: fill 3 columns across
  const cardWidthByW = Math.floor((screenW - hPad * 2 - cardGap * 2) / 3);
  // Height-constrained: card should occupy at most 58% of screen height,
  // leaving room for safe-area insets, header, and reroll button.
  const cardWidthByH = Math.floor(screenH * 0.58 * (9 / 14));
  const cardWidth = Math.min(cardWidthByW, cardWidthByH);

  // Drawer width in landscape
  const drawerWidth = Math.min(340, screenW * 0.38);

  // Animation state
  const [exitModes, setExitModes] = useState<ExitModes>(IDLE);
  const [animating, setAnimating] = useState(false);
  // roundKey forces card remount (new entry animation) each round
  const [roundKey, setRoundKey] = useState(0);

  const handlePick = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);

      const modes: ExitModes = ['unchosen', 'unchosen', 'unchosen'];
      modes[idx] = 'picked';
      setExitModes(modes);

      // Wait for unchosen exit anim (~350ms), then commit state
      setTimeout(() => {
        const { done, nextPicked } = pick(idx);
        setExitModes(IDLE);
        setRoundKey((k) => k + 1);
        setAnimating(false);

        if (done) {
          const params = { picked: JSON.stringify(nextPicked), championId: championId ?? '' };
          router.replace({ pathname: '/draft-result', params });
        }
      }, 380);
    },
    [animating, championId, pick, router],
  );

  const handleReroll = useCallback(
    (idx: number) => {
      if (animating) return;
      setAnimating(true);

      const modes: ExitModes = ['none', 'none', 'none'];
      modes[idx] = 'reroll';
      setExitModes(modes);

      // Wait for the fade-out (~200ms), then swap the augment so it fades back in.
      setTimeout(() => {
        reroll(idx);
        const resetModes: ExitModes = ['none', 'none', 'none'];
        setExitModes(resetModes);
        setAnimating(false);
      }, 220);
    },
    [animating, reroll],
  );

  const handleExit = useCallback(() => {
    Alert.alert(translate('exitConfirm'), '', [
      { text: translate('exitCancel'), style: 'cancel' },
      {
        text: translate('exitOk'),
        style: 'destructive',
        onPress: () => router.dismissTo('/'),
      },
    ]);
  }, [router, translate]);

  return (
    <Drawer
      open={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      drawerPosition="right"
      drawerType="slide"
      drawerStyle={{ width: drawerWidth, backgroundColor: colors.surface.base }}
      renderDrawerContent={() => <PickedDrawer picked={picked} />}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
            <Pressable onPress={handleExit} style={styles.headerBtn}>
              <Image source="sf:xmark" style={styles.headerIcon} tintColor={colors.text.secondary} />
              <ThemedText type="label" color="secondary">
                {translate('exit')}
              </ThemedText>
            </Pressable>

            <View style={styles.headerCenter}>
              <ThemedText type="label" color="tertiary">
                {translate('round')}
              </ThemedText>
              <RoundIndicator round={round} />
            </View>

            <Pressable onPress={() => setDrawerOpen(true)} style={styles.headerBtn}>
              <Image source="sf:list.bullet" style={styles.headerIcon} tintColor={colors.accent.default} />
              <ThemedText type="label" style={{ color: colors.accent.default }}>
                {translate('picks')} {picked.length}/4
              </ThemedText>
            </Pressable>
          </View>

          {/* Cards row */}
          <View
            style={[
              styles.cardsRow,
              {
                paddingHorizontal: hPad,
                gap: cardGap,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            {currentCards.map((aug, i) => (
              <DraftCard
                key={`${roundKey}-${aug.id}`}
                augment={aug}
                index={i}
                cardWidth={cardWidth}
                exitMode={exitModes[i]}
                disabled={animating}
                onPick={() => handlePick(i)}
                onReroll={() => handleReroll(i)}
              />
            ))}
          </View>
        </SafeAreaView>
      </ThemedView>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  headerIcon: {
    width: 18,
    height: 18,
  },
  headerCenter: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  cardsRow: {
    flexDirection: 'row',
  },
});
