/**
 * DraftResultScreen — 드래프트 완료 요약 (세로모드)
 *
 * 결과 히어로(챔피언 스플래시) / 증강 세로 리스트 행 / 아이템 / 합산 스탯 /
 * 하단 CTA(확인하러 가기 · 다시 시작). "확인하러 가기"가 빌드를 로컬 저장하고 홈으로 이동.
 * 몰입형 종착 화면이라 native 헤더 없이 headerShown:false를 유지한다.
 */
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { AugmentRarityColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveBuild } from '@/lib/build-storage';
import { cleanAugmentDescription } from '@/lib/augment-text';
import { championSplashUrl, itemImageUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';
import type { Augment, AugmentRarity } from '@/features/augments/types';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { useItems } from '@/features/items/hooks/use-items';
import { ItemStatPanel } from '@/features/items/components/item-stat-panel';
import { AugmentIcon } from './augment-icon';
import { SynergyIcon } from './synergy-icon';

const RARITY_GLYPH: Record<AugmentRarity, string> = {
  silver: 'shield',
  gold: 'star',
  prismatic: 'shimmer',
};

const t = {
  ko: {
    title: '드래프트 완료',
    restart: '다시 시작',
    confirm: '확인하러 가기',
    augments: '증강',
    items: '아이템',
    stats: '합산 스탯',
    saveError: '빌드 저장에 실패했어요',
  },
  en: {
    title: 'Draft Complete',
    restart: 'Restart',
    confirm: 'View Build',
    augments: 'Augments',
    items: 'Items',
    stats: 'Total Stats',
    saveError: 'Failed to save the build',
  },
};

const HERO_HEIGHT = 260;

export function DraftResultScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();
  const { picked: pickedJson, championId, items: itemsJson } = useLocalSearchParams<{
    picked: string;
    championId: string;
    items?: string;
  }>();

  const [saving, setSaving] = useState(false);

  const { width, height } = useWindowDimensions();
  const isPortrait = height >= width;

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
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    }, [])
  );

  const handleRestart = () => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    router.dismissTo('/');
    router.push('/select-champion-modal');
  };

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveBuild({
        championId: championId ?? '',
        augmentIds: picked.map((a) => a.id),
        itemIds: selectedItemIds,
      });
    } catch {
      Alert.alert(translate('saveError'));
      setSaving(false);
      return;
    }
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    router.dismissTo('/');
  };

  const splashUri = championId ? championSplashUrl(championId) : null;

  // 회전이 끝나기 전(아직 가로)에는 렌더를 보류해 landscape reflow를 막는다.
  if (!isPortrait) {
    return <ThemedView style={styles.container} />;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 결과 히어로 */}
        <View style={styles.hero}>
          {splashUri && (
            <Image
              source={{ uri: splashUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="center"
            />
          )}
          <LinearGradient
            colors={[colors.surface.base + '33', colors.surface.base + 'AA', colors.surface.base]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']} style={styles.heroSafe}>
            <View style={[styles.badge, { backgroundColor: colors.accent.subtle }]}>
              <SynergyIcon name="check-decagram" size={16} color={colors.accent.default} />
              <ThemedText type="label" style={{ color: colors.accent.default }}>
                {translate('title')}
              </ThemedText>
            </View>

            {champion && (
              <View style={styles.heroBottom}>
                <ThemedText type="title" numberOfLines={1}>
                  {champion.name}
                </ThemedText>
                <ThemedText type="body" color="tertiary" numberOfLines={1}>
                  {champion.title}
                </ThemedText>
              </View>
            )}
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          {/* 증강 — 세로 리스트 행 */}
          <View style={styles.section}>
            <ThemedText type="label" color="secondary">
              {translate('augments')} {picked.length}
            </ThemedText>
            {picked.map((aug, i) => (
              <ThemedView
                key={`${aug.id}-${i}`}
                surface="raised"
                style={[
                  styles.augmentRow,
                  {
                    borderColor: colors.border.subtle,
                    borderLeftColor: AugmentRarityColors[aug.rarity].border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.augmentTile,
                    {
                      backgroundColor: colors.surface.sunken,
                      borderColor: AugmentRarityColors[aug.rarity].border,
                    },
                  ]}
                >
                  <AugmentIcon
                    iconPath={aug.iconPath}
                    size={40}
                    tint={AugmentRarityColors[aug.rarity].border}
                    fallbackSymbol={RARITY_GLYPH[aug.rarity]}
                    recyclingKey={aug.id}
                  />
                </View>
                <View style={styles.augmentBody}>
                  <ThemedText type="label">{aug.name}</ThemedText>
                  <ThemedText type="caption" color="secondary">
                    {cleanAugmentDescription(aug.description)}
                  </ThemedText>
                </View>
              </ThemedView>
            ))}
          </View>

          {/* 아이템 */}
          {selectedItems.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="label" color="secondary">
                {translate('items')} {selectedItems.length}
              </ThemedText>
              <View style={styles.itemsRow}>
                {selectedItems.map((item, i) => (
                  <View
                    key={`${item.id}-${i}`}
                    style={[
                      styles.itemTile,
                      {
                        backgroundColor: colors.surface.raised,
                        borderColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: itemImageUrl(item.imageKey) }}
                      style={styles.itemIcon}
                      contentFit="contain"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 합산 스탯 */}
          {champion && (
            <View style={styles.section}>
              <ThemedText type="label" color="secondary">
                {translate('stats')}
              </ThemedText>
              <ItemStatPanel baseStats={champion.stats} itemStatsList={itemStatsList} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 CTA */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={[styles.footerInner, { borderTopColor: colors.border.subtle }]}>
          <Pressable
            onPress={handleRestart}
            style={({ pressed }) => [
              styles.restartButton,
              {
                backgroundColor: colors.surface.raised,
                borderColor: colors.border.default,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <SynergyIcon name="refresh" size={18} color={colors.text.secondary} />
            <ThemedText type="label" color="secondary">
              {translate('restart')}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            disabled={saving}
            style={({ pressed }) => [
              styles.confirmButton,
              {
                backgroundColor: pressed ? colors.accent.pressed : colors.accent.default,
                opacity: saving ? 0.6 : 1,
              },
            ]}
          >
            <ThemedText type="label" style={{ color: colors.accent.onAccent }}>
              {translate('confirm')}
            </ThemedText>
            <SynergyIcon name="arrow-right-circle" size={18} color={colors.accent.onAccent} />
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
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  hero: {
    height: HERO_HEIGHT,
  },
  heroSafe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  heroBottom: {
    gap: Spacing.half,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  augmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
  },
  augmentTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  augmentBody: {
    flex: 1,
    gap: Spacing.one,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  itemTile: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
  },
  footer: {
    // SafeAreaView가 하단 인셋 처리
  },
  footerInner: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.double,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.double,
    borderRadius: Radius.full,
  },
});
