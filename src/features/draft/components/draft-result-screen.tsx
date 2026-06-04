import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { championLoadingUrl, itemImageUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';
import type { Augment } from '@/features/augments/types';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { useItems } from '@/features/items/hooks/use-items';
import { ItemStatPanel } from '@/features/items/components/item-stat-panel';
import { DraftCardFrame } from './draft-card-frame';
import { SynergyIcon } from './synergy-icon';

const t = {
  ko: { title: '드래프트 완료', restart: '다시 시작', home: '홈으로', augments: '증강', items: '아이템' },
  en: { title: 'Draft Complete', restart: 'Restart', home: 'Home', augments: 'Augments', items: 'Items' },
};

export function DraftResultScreen() {

  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { picked: pickedJson, championId, items: itemsJson } = useLocalSearchParams<{
    picked: string;
    championId: string;
    items?: string;
  }>();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenW = isLandscape ? width : height;
  const screenH = isLandscape ? height : width;

  const picked: Augment[] = useMemo(
    () => (pickedJson ? JSON.parse(pickedJson) : []),
    [pickedJson]
  );
  const selectedItemIds: string[] = useMemo(
    () => (itemsJson ? JSON.parse(itemsJson) : []),
    [itemsJson]
  );

  const allItems = useItems();
  const champions = useChampions();

  const champion = useMemo(
    () => champions.find((c) => c.id === championId) ?? null,
    [champions, championId]
  );

  const selectedItems = useMemo(
    () => selectedItemIds.map((id) => allItems.find((it) => it.id === id)!).filter(Boolean),
    [selectedItemIds, allItems]
  );

  const itemStatsList = useMemo(
    () => selectedItems.map((it) => it.stats),
    [selectedItems]
  );

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    }, [])
  );

  // Width-constrained: 4 columns; height-constrained: same 58% cap as draft screen
  const cardWidthByW = Math.floor((screenW - Spacing.four * 2 - Spacing.three * 3) / 4);
  const cardWidthByH = Math.floor(screenH * 0.58 * (9 / 14));
  const cardWidth = Math.min(cardWidthByW, cardWidthByH);

  const handleHome = () => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    router.dismissTo('/');
  };

  const handleRestart = () => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
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

        {/* 증강 카드 */}
        <View>
          <ThemedText type="caption" color="tertiary" style={{ textAlign: 'center', marginTop: Spacing.one }}>
            {translate('augments')}
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
        </View>

        {/* 아이템 + 스탯 (선택된 경우만) */}
        {selectedItems.length > 0 && champion && (
          <View style={styles.itemsSection}>
            <ThemedText type="caption" color="tertiary" style={{ textAlign: 'center', marginBottom: Spacing.two }}>
              {translate('items')}
            </ThemedText>
            <View style={styles.itemsRow}>
              {/* 아이템 아이콘 */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.two, paddingHorizontal: Spacing.four }}
              >
                {selectedItems.map((item) => (
                  <Image
                    key={item.id}
                    source={{ uri: itemImageUrl(item.imageKey) }}
                    style={styles.itemIcon}
                    contentFit="contain"
                  />
                ))}
              </ScrollView>

              {/* 합산 스탯 */}
              <View style={styles.statPanelWrapper}>
                <ItemStatPanel
                  baseStats={champion.stats}
                  itemStatsList={itemStatsList}
                />
              </View>
            </View>
          </View>
        )}

        <View style={[styles.buttons, { marginTop: 'auto' }]}>
          <Pressable
            onPress={handleRestart}
            style={[styles.btn, { backgroundColor: colors.surface.raised, borderColor: colors.border.default, borderWidth: 1 }]}
          >
            <SynergyIcon name="refresh" size={18} color={colors.text.primary} />
            <ThemedText type="label">{translate('restart')}</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleHome}
            style={[styles.btn, { backgroundColor: colors.accent.default }]}
          >
            <SynergyIcon name="home" size={18} color={colors.accent.onAccent} />
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
    paddingVertical: Spacing.two,
  },
  itemsSection: {
    paddingHorizontal: Spacing.four,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
  },
  statPanelWrapper: {
    minWidth: 180,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.double,
    borderRadius: Radius.xl,
  },
});
