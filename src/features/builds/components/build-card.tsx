/**
 * BuildCard — 홈 목록의 저장된 빌드 카드 한 장.
 * 상단 챔피언 미니 배너 + 증강/아이템 타일 행 + 저장 날짜를 요약 표시.
 * 고밀도 리스트 셀이므로 글라스 미적용 (ThemedView raised).
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useAugments } from '@/features/augments/hooks/use-augments';
import { useChampions } from '@/features/champions/hooks/use-champions';
import { useItems } from '@/features/items/hooks/use-items';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import type { SavedBuild } from '@/lib/build-storage';
import { championSplashUrl, itemImageUrl } from '@/lib/ddragon';
import { useTranslation } from '@/lib/i18n';
import { AugmentTile } from './augment-tile';

const t = {
  ko: { unknownChampion: '알 수 없는 챔피언' },
  en: { unknownChampion: 'Unknown champion' },
};

const AUGMENT_SIZE = 30;
const ITEM_SIZE = 28;

interface Props {
  build: SavedBuild;
  onPress: () => void;
  onLongPress: () => void;
}

export function BuildCard({ build, onPress, onLongPress }: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const { locale } = useLocale();

  const champions = useChampions();
  const augments = useAugments();
  const items = useItems();

  const champion = champions.find((c) => c.id === build.championId) ?? null;
  // 데이터 갱신으로 해석 불가한 id는 조용히 건너뛴다 — crash 금지.
  const buildAugments = build.augmentIds
    .map((id) => augments.find((a) => a.id === id))
    .filter((a) => a != null);
  const buildItems = build.itemIds
    .map((id) => items.find((it) => it.id === id))
    .filter((it) => it != null);

  const date = new Date(build.createdAt).toLocaleDateString(
    locale === 'ko' ? 'ko-KR' : 'en-US'
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <ThemedView
        surface="raised"
        style={[styles.card, { borderColor: colors.border.subtle }]}
      >
        {/* 챔피언 미니 배너 */}
        <View style={[styles.banner, { backgroundColor: colors.surface.sunken }]}>
          {champion && (
            <Image
              source={{ uri: championSplashUrl(champion.id) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="center"
            />
          )}
          <LinearGradient
            colors={[colors.surface.raised + '00', colors.surface.raised + 'CC', colors.surface.raised]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerContent}>
            <View style={styles.bannerMeta}>
              <ThemedText type="body" numberOfLines={1}>
                {champion ? champion.name : translate('unknownChampion')}
              </ThemedText>
              {champion && (
                <ThemedText type="caption" color="tertiary" numberOfLines={1}>
                  {champion.title}
                </ThemedText>
              )}
            </View>
            <View style={[styles.dateChip, { backgroundColor: colors.surface.overlay }]}>
              <ThemedText type="caption" color="secondary">
                {date}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 증강 + 아이템 */}
        <View style={styles.body}>
          {buildAugments.length > 0 && (
            <View style={styles.iconRow}>
              {buildAugments.map((aug, i) => (
                <AugmentTile key={`${aug.id}-${i}`} augment={aug} size={AUGMENT_SIZE} />
              ))}
            </View>
          )}

          {buildAugments.length > 0 && buildItems.length > 0 && (
            <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />
          )}

          {buildItems.length > 0 && (
            <View style={styles.iconRow}>
              {buildItems.map((item, i) => (
                <View
                  key={`${item.id}-${i}`}
                  style={[
                    styles.itemTile,
                    {
                      backgroundColor: colors.surface.sunken,
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
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  banner: {
    height: 76,
    justifyContent: 'flex-end',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  bannerMeta: {
    flex: 1,
    gap: Spacing.half,
  },
  dateChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  itemTile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
  },
});
