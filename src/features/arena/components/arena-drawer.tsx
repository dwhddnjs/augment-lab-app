/**
 * ArenaDrawer — 우측 drawer. 진행 중 보유한 챔피언·증강(레벨)·프리즘/전설 아이템·
 * 능력치 모루·골드를 누적 표시한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import { RemoteImage } from "@/components/ui/remote-image";
import {
  AugmentRarityColors,
  AugmentRarityGlyphs,
  Radius,
  Spacing,
} from "@/constants/theme";
import {
  useSpecialAugments,
  useStatShards,
  usePrismaticItems,
} from "@/features/arena/hooks/use-arena-items";
import type { ArenaPickedAugment } from "@/features/arena/types";
import type { Champion } from "@/features/champions/types";
import { useItems } from "@/features/items/hooks/use-items";
import { useTheme } from "@/hooks/use-theme";
import {
  cdragonItemIconUrl,
  championSquareUrl,
  itemImageUrl,
} from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    title: "내 빌드",
    augments: "증강",
    prismatics: "프리즘 아이템",
    items: "아이템",
    shards: "능력치 모루",
    reforge: "재련",
  },
  en: {
    title: "My Build",
    augments: "Augments",
    prismatics: "Prismatic Items",
    items: "Items",
    shards: "Stat Anvils",
    reforge: "Reforge",
  },
};

interface Props {
  width: number;
  champion?: Champion;
  pickedAugments: ArenaPickedAugment[];
  itemIds: string[];
  prismaticIds: string[];
  shardIds: string[];
  reforgeIds: string[];
  gold: number;
}

export function ArenaDrawer({
  width,
  champion,
  pickedAugments,
  itemIds,
  prismaticIds,
  shardIds,
  reforgeIds,
  gold,
}: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const allItems = useItems();
  const allPrismatics = usePrismaticItems();
  const allShards = useStatShards();
  const allSpecials = useSpecialAugments();

  const items = itemIds
    .map((id) => allItems.find((it) => it.id === id))
    .filter((it): it is NonNullable<typeof it> => it != null);
  const prismatics = prismaticIds
    .map((id) => allPrismatics.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  const shards = shardIds
    .map((id) => allShards.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null);
  const reforges = reforgeIds
    .map((id) => allSpecials.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s != null);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface.base }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <ThemedText type="heading">{translate("title")}</ThemedText>
          <View style={[styles.goldBadge, { backgroundColor: colors.surface.raised }]}>
            <MaterialCommunityIcons name="circle-multiple" size={14} color="#F2C766" />
            <ThemedText type="label" style={{ color: "#F2C766", fontWeight: "800" }}>
              {gold.toLocaleString()}
            </ThemedText>
          </View>
        </View>

        {champion && (
          <View style={styles.champRow}>
            <RemoteImage
              uri={championSquareUrl(champion.imageKey)}
              recyclingKey={champion.id}
              style={styles.champIcon}
            />
            <ThemedText type="label">{champion.name}</ThemedText>
          </View>
        )}

        {/* 증강 (레벨 별) */}
        <Section label={`${translate("augments")} ${pickedAugments.length}`}>
          <View style={styles.grid}>
            {pickedAugments.map((p) => {
              const tint = AugmentRarityColors[p.augment.rarity].border;
              return (
                <View key={p.augment.id} style={styles.augCell}>
                  <View
                    style={[
                      styles.iconWrap,
                      { borderColor: tint, backgroundColor: colors.surface.sunken },
                    ]}
                  >
                    <AugmentImage
                      iconPath={p.augment.iconPath}
                      size={34}
                      tint={tint}
                      fallbackGlyph={AugmentRarityGlyphs[p.augment.rarity]}
                      recyclingKey={p.augment.id}
                    />
                  </View>
                  {p.augment.maxLevel > 1 && (
                    <View style={styles.lvlRow}>
                      {Array.from({ length: p.level }).map((_, i) => (
                        <MaterialCommunityIcons
                          key={i}
                          name="star"
                          size={9}
                          color={tint}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Section>

        {/* 프리즘 아이템 */}
        {prismatics.length > 0 && (
          <Section label={translate("prismatics")}>
            <View style={styles.grid}>
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
          </Section>
        )}

        {/* 전설 아이템 */}
        {items.length > 0 && (
          <Section label={translate("items")}>
            <View style={styles.grid}>
              {items.map((it) => (
                <RemoteImage
                  key={it.id}
                  uri={itemImageUrl(it.imageKey)}
                  recyclingKey={it.id}
                  style={[styles.itemIcon, { borderColor: colors.border.subtle }]}
                />
              ))}
            </View>
          </Section>
        )}

        {/* 능력치 모루 */}
        {shards.length > 0 && (
          <Section label={translate("shards")}>
            <View style={{ gap: Spacing.one }}>
              {shards.map((s, i) => (
                <ThemedText key={`${s.id}-${i}`} type="caption" color="secondary">
                  • {s.description}
                </ThemedText>
              ))}
            </View>
          </Section>
        )}

        {/* 재련 (프리즘 능력치 모루·증강 슬롯 등) */}
        {reforges.length > 0 && (
          <Section label={translate("reforge")}>
            <View style={styles.grid}>
              {reforges.map((r, i) => (
                <View key={`${r.id}-${i}`} style={styles.reforgeCell}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        borderColor: colors.border.subtle,
                        backgroundColor: colors.surface.sunken,
                      },
                    ]}
                  >
                    <AugmentImage
                      iconPath={r.iconPath}
                      size={34}
                      tint={AugmentRarityColors.gold.border}
                      imageTint={AugmentRarityColors.gold.border}
                      fallbackGlyph="anvil"
                      recyclingKey={r.id}
                    />
                  </View>
                  <ThemedText
                    type="caption"
                    color="secondary"
                    numberOfLines={2}
                    style={styles.reforgeName}
                  >
                    {r.name}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.four,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.double,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  champRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  champIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
  },
  section: { gap: Spacing.two },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  augCell: {
    alignItems: "center",
    gap: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  lvlRow: {
    flexDirection: "row",
    gap: 1,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  reforgeCell: {
    alignItems: "center",
    gap: 2,
    width: 60,
  },
  reforgeName: {
    textAlign: "center",
  },
});
