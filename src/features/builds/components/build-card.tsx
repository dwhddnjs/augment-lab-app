/**
 * BuildCard — 홈 목록의 저장된 빌드 카드 한 장 (풀블리드 히어로).
 * 챔피언 splash가 카드 전체를 채우고, 하단 그라데이션 위에 이름·증강·아이템을
 * 얹는다. 카드 테두리는 입체감만 주도록 표면보다 어두운 subtle 톤으로 절제한다.
 */
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { ModeBadge } from "@/components/ui/mode-badge";
import { Elevation, HeroOverlay, Radius, Spacing } from "@/constants/theme";
import { useArenaAugments } from "@/features/arena/hooks/use-arena-augments";
import { usePrismaticItems } from "@/features/arena/hooks/use-arena-items";
import { useAugments } from "@/features/augments/hooks/use-augments";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useItems } from "@/features/items/hooks/use-items";
import { useTheme } from "@/hooks/use-theme";
import type { SavedBuild } from "@/lib/build-storage";
import { cdragonItemIconUrl, championSplashUrl, itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { AugmentTile } from "@/components/ui/augment-tile";

const t = {
  ko: { unknownChampion: "알 수 없는 챔피언" },
  en: { unknownChampion: "Unknown champion" },
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
  const { colors, mode } = useTheme();

  const champions = useChampions();
  const augments = useAugments();
  const arenaAugments = useArenaAugments();
  const items = useItems();
  const prismatics = usePrismaticItems();

  const isArena = build.mode === "arena";
  const champion = champions.find((c) => c.id === build.championId) ?? null;
  // 데이터 갱신으로 해석 불가한 id는 조용히 건너뛴다 — crash 금지.
  // 아레나 증강은 칼바람과 별도 데이터셋이므로 모드에 맞는 풀에서 해석한다.
  const augmentPool = isArena ? arenaAugments : augments;
  const buildAugments = build.augmentIds
    .map((id) => augmentPool.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => a != null);
  const buildItems = build.itemIds
    .map((id) => items.find((it) => it.id === id))
    .filter((it): it is NonNullable<typeof it> => it != null);
  // 아레나 빌드는 프리즘 아이템도 보유 — 전설 아이템 앞에 함께 노출.
  const buildPrismatics = isArena
    ? (build.prismaticIds ?? [])
        .map((id) => prismatics.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p != null)
    : [];

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
              // splash 위는 모드 무관 어두운 톤 — 다크/라이트 공통(이미지·텍스트 가독성).
              backgroundColor: HeroOverlay.cardBase,
              // 어두운 splash 가장자리의 테두리: 다크는 은은한 흰 림(현 톤 유지),
              // 라이트는 밝은 배경과 닿아 검은 윤곽처럼 보이므로 더 밝은 광택 림으로
              // 올려 입체감을 준다.
              borderWidth: mode === "light" ? 0 : StyleSheet.hairlineWidth,
              borderColor: HeroOverlay.tileBorder,
            },
          ]}
        >
          {/* 챔피언 splash 풀블리드 — 얼굴이 보이도록 상단 정렬 */}
          {champion && (
            <Image
              source={{ uri: championSplashUrl(champion.id) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition={{ top: 0, left: "50%" }}
              // 필터를 오갈 때마다 splash 를 다시 디코드하면 그 완료가 세그먼트
              // 슬라이드 도중에 떨어져 프레임이 튄다. 메모리 캐시 + 재활용 키로
              // 두 번째부터는 디코드 없이 붙는다.
              recyclingKey={champion.id}
              cachePolicy="memory-disk"
              transition={0}
            />
          )}

          {/* 모드 마킹 — splash 위 우상단. 절대배치라 하단 패널 레이아웃을 밀지 않는다. */}
          <View style={styles.modeBadge} pointerEvents="none">
            <ModeBadge mode={build.mode} variant="onHero" />
          </View>

          {/* 하단 정보 패널 — 텍스트 뒤를 거의 솔리드로 덮어 가독성 확보 */}
          <View style={styles.content}>
            {/* 패널 상단만 splash로 페이드, 나머지는 어두운 scrim으로(모드 무관) */}
            <LinearGradient
              colors={mode === "light" ? HeroOverlay.scrimLight : HeroOverlay.scrimDark}
              locations={[0, 0.42, 0.7, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.titleBlock}>
              <ThemedText
                type="heading"
                numberOfLines={1}
                style={{ color: HeroOverlay.textPrimary, fontWeight: "800" }}
              >
                {champion ? champion.name : translate("unknownChampion")}
              </ThemedText>
              {champion && (
                <ThemedText
                  type="caption"
                  numberOfLines={1}
                  style={{ color: HeroOverlay.textSecondary }}
                >
                  {champion.title}
                </ThemedText>
              )}
            </View>

            {/* 증강 + 아이템 묶음 — 둘은 가깝게, 헤더와는 떨어지게 */}
            <View style={styles.tilesGroup}>
              {buildAugments.length > 0 && (
                <View style={styles.row}>
                  {buildAugments.map((aug, i) => (
                    <AugmentTile
                      key={`${aug.id}-${i}`}
                      iconPath={aug.iconPath}
                      rarity={aug.rarity}
                      recyclingKey={aug.id}
                      size={AUGMENT_SIZE}
                    />
                  ))}
                </View>
              )}

              {(buildItems.length > 0 || buildPrismatics.length > 0) && (
                <View style={styles.row}>
                  {buildPrismatics.map((item, i) => (
                    <View
                      key={`p-${item.id}-${i}`}
                      style={[
                        styles.itemTile,
                        {
                          backgroundColor: HeroOverlay.tileBg,
                          borderColor: HeroOverlay.tileBorder,
                        },
                      ]}
                    >
                      <RemoteImage
                        uri={cdragonItemIconUrl(item.iconPath)}
                        recyclingKey={item.id}
                        style={styles.itemIcon}
                        contentFit="contain"
                      />
                    </View>
                  ))}
                  {buildItems.map((item, i) => (
                    <View
                      key={`${item.id}-${i}`}
                      style={[
                        styles.itemTile,
                        {
                          backgroundColor: HeroOverlay.tileBg,
                          borderColor: HeroOverlay.tileBorder,
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
    borderCurve: "continuous",
    ...Elevation.level2,
  },
  cardInner: {
    height: 188,
    borderRadius: Radius.xl,
    borderCurve: "continuous",

    overflow: "hidden",
    justifyContent: "flex-end",
  },
  modeBadge: {
    position: "absolute",
    top: Spacing.two,
    right: Spacing.two,
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
  titleBlock: {
    gap: Spacing.half,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  itemTile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
  },
});
