/**
 * ArenaBuildSummary — 저장된 아레나 빌드의 상세 본문(세로). 증강(강화 레벨)·
 * 프리즘 아이템·전설 아이템·능력치 모루를 섹션별로 표시한다. 빌드 상세 화면
 * (build-detail-screen)이 mode === 'arena'일 때 칼바람 본문 대신 렌더한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import { RemoteImage } from "@/components/ui/remote-image";
import {
  AugmentRarityColors,
  AugmentRarityGlyphs,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useArenaAugments } from "@/features/arena/hooks/use-arena-augments";
import {
  usePrismaticItems,
  useStatShards,
} from "@/features/arena/hooks/use-arena-items";
import { useItems } from "@/features/items/hooks/use-items";
import { useTheme } from "@/hooks/use-theme";
import type { SavedBuild } from "@/lib/build-storage";
import { cdragonItemIconUrl, itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    augments: "증강",
    prismatics: "프리즘 아이템",
    items: "아이템",
    shards: "능력치 모루",
  },
  en: {
    augments: "Augments",
    prismatics: "Prismatic Items",
    items: "Items",
    shards: "Stat Anvils",
  },
};

interface Props {
  build: SavedBuild;
}

export function ArenaBuildSummary({ build }: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const arenaAugments = useArenaAugments();
  const allItems = useItems();
  const allPrismatics = usePrismaticItems();
  const allShards = useStatShards();

  const augments = build.augmentIds
    .map((id) => arenaAugments.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => a != null);
  const items = build.itemIds
    .map((id) => allItems.find((it) => it.id === id))
    .filter((it): it is NonNullable<typeof it> => it != null);
  const prismatics = (build.prismaticIds ?? [])
    .map((id) => allPrismatics.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  const shards = (build.shardIds ?? [])
    .map((id) => allShards.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null);

  return (
    <View style={styles.root}>
      {/* 증강 (강화 레벨) */}
      <View style={styles.section}>
        <ThemedText type="label" color="secondary">
          {translate("augments")}
        </ThemedText>
        <View style={styles.augGrid}>
          {augments.map((aug) => {
            const tint = AugmentRarityColors[aug.rarity].border;
            const level = build.augmentLevels?.[aug.id] ?? 1;
            return (
              <View key={aug.id} style={styles.augCell}>
                <View
                  style={[
                    styles.augIconWrap,
                    { borderColor: tint, backgroundColor: colors.surface.sunken },
                  ]}
                >
                  <AugmentImage
                    iconPath={aug.iconPath}
                    size={44}
                    tint={tint}
                    fallbackGlyph={AugmentRarityGlyphs[aug.rarity]}
                    recyclingKey={aug.id}
                  />
                </View>
                <View style={styles.lvlRow}>
                  {Array.from({ length: level }).map((_, i) => (
                    <MaterialCommunityIcons
                      key={i}
                      name="star"
                      size={10}
                      color={tint}
                    />
                  ))}
                </View>
                <ThemedText
                  type="caption"
                  color="secondary"
                  numberOfLines={2}
                  style={styles.augName}
                >
                  {aug.name}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>

      {/* 프리즘 아이템 */}
      {prismatics.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("prismatics")}
          </ThemedText>
          <View style={styles.itemRow}>
            {prismatics.map((p) => (
              <RemoteImage
                key={p.id}
                uri={cdragonItemIconUrl(p.iconPath)}
                recyclingKey={p.id}
                style={[styles.itemIcon, { borderColor: colors.border.subtle }]}
                contentFit="contain"
              />
            ))}
          </View>
        </View>
      )}

      {/* 전설 아이템 */}
      {items.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("items")}
          </ThemedText>
          <View style={styles.itemRow}>
            {items.map((it) => (
              <RemoteImage
                key={it.id}
                uri={itemImageUrl(it.imageKey)}
                recyclingKey={it.id}
                style={[styles.itemIcon, { borderColor: colors.border.subtle }]}
              />
            ))}
          </View>
        </View>
      )}

      {/* 능력치 모루 */}
      {shards.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="label" color="secondary">
            {translate("shards")}
          </ThemedText>
          <View style={{ gap: Spacing.one }}>
            {shards.map((s, i) => (
              <ThemedText key={`${s.id}-${i}`} type="body" color="secondary">
                • {s.description}
              </ThemedText>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.four },
  section: { gap: Spacing.two },
  augGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
  },
  augCell: {
    width: 64,
    alignItems: "center",
    gap: 2,
  },
  augIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  lvlRow: {
    flexDirection: "row",
    gap: 1,
  },
  augName: {
    textAlign: "center",
    fontSize: 10,
    lineHeight: 12,
  },
  itemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
});
