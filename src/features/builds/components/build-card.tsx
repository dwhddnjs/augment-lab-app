/**
 * BuildCard — 홈 목록의 저장된 빌드 카드 한 장 (풀블리드 히어로).
 * 챔피언 splash가 카드 전체를 채우고, 하단 그라데이션 위에 이름·증강·아이템을
 * 얹는다. 카드 테두리는 입체감만 주도록 표면보다 어두운 subtle 톤으로 절제한다.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { Elevation, Radius, Spacing } from '@/constants/theme';
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

const AUGMENT_SIZE = 32;
const ITEM_SIZE = 32;

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
    .filter((a): a is NonNullable<typeof a> => a != null);
  const buildItems = build.itemIds
    .map((id) => items.find((it) => it.id === id))
    .filter((it): it is NonNullable<typeof it> => it != null);

  // 테두리는 입체감만 주는 정도로 — 표면보다 어두운 subtle 톤으로 절제.
  const borderColor = colors.border.subtle;

  const date = new Date(build.createdAt).toLocaleDateString(
    locale === 'ko' ? 'ko-KR' : 'en-US'
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {/* 바깥: 그림자(입체감), 안쪽: 모서리 클립 — overflow가 그림자를 자르지 않게 분리 */}
      <View style={[styles.card, { backgroundColor: colors.surface.base }]}>
        <View
          style={[
            styles.cardInner,
            {
              backgroundColor: colors.surface.sunken,
              borderColor,
            },
          ]}
        >
          {/* 챔피언 splash 풀블리드 — 얼굴이 보이도록 상단 정렬 */}
          {champion && (
            <Image
              source={{ uri: championSplashUrl(champion.id) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={{ top: 0, left: '50%' }}
            />
          )}

          {/* 날짜 — 카드 우측 상단 고정 */}
          <View style={[styles.dateChip, { backgroundColor: colors.surface.overlay }]}>
            <ThemedText type="caption" color="secondary">
              {date}
            </ThemedText>
          </View>

        {/* 하단 정보 패널 — 텍스트 뒤를 거의 솔리드로 덮어 가독성 확보 */}
        <View style={styles.content}>
          {/* 패널 상단만 splash로 페이드, 나머지는 솔리드에 가깝게 */}
          <LinearGradient
            colors={[
              colors.surface.base + '00',
              colors.surface.base + 'D9',
              colors.surface.base + 'F2',
              colors.surface.base,
            ]}
            locations={[0, 0.42, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.titleBlock}>
            <ThemedText type="heading" numberOfLines={1}>
              {champion ? champion.name : translate('unknownChampion')}
            </ThemedText>
            {champion && (
              <ThemedText type="caption" color="secondary" numberOfLines={1}>
                {champion.title}
              </ThemedText>
            )}
          </View>

          {/* 증강 + 아이템 묶음 — 둘은 가깝게, 헤더와는 떨어지게 */}
          <View style={styles.tilesGroup}>
            {buildAugments.length > 0 && (
              <View style={styles.row}>
                {buildAugments.map((aug, i) => (
                  <AugmentTile key={`${aug.id}-${i}`} augment={aug} size={AUGMENT_SIZE} />
                ))}
              </View>
            )}

            {buildItems.length > 0 && (
              <View style={styles.row}>
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
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    ...Elevation.level2,
  },
  cardInner: {
    height: 188,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  content: {
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  tilesGroup: {
    gap: Spacing.one,
  },
  dateChip: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  titleBlock: {
    gap: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
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
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
  },
});
