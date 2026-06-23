/**
 * ArenaShop — 아레나 골드 상점(가로). 두 모드:
 *   - boots: R1 신발 전용(500골드)
 *   - shop : 전설급(2500)·능력치 모루(750)·프리즘 모루(4000)·전설 모루(2250)
 * 골드가 충분한 항목만 구매 가능하며, 여러 번 구매 후 완료로 다음 라운드로 넘어간다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { useStatShards } from "@/features/arena/hooks/use-arena-items";
import type { PrismaticItem, StatShard } from "@/features/arena/types";
import type { Champion } from "@/features/champions/types";
import { FILTERS } from "@/features/items/data/item-filters";
import { useItems } from "@/features/items/hooks/use-items";
import type { Item } from "@/features/items/types";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";
import { itemImageUrl } from "@/lib/ddragon";
import { ArenaPrismaticCard } from "./arena-prismatic-card";

// 카테고리별 고정 가격.
export const SHOP_PRICE = {
  boots: 500,
  legendary: 2500,
  statAnvil: 750,
  prismaticAnvil: 4000,
  legendaryAnvil: 2250,
} as const;

const ARAM_IDS: Set<string> = new Set(require("@/features/items/data/aram-item-ids.json"));

type ShopCat = "legendary" | "stat-anvil" | "prismatic-anvil" | "legendary-anvil";

const t = {
  ko: {
    shop: "상점",
    boots: "신발 상점",
    done: "완료",
    legendary: "전설급",
    statAnvil: "능력치 모루",
    prismaticAnvil: "프리즘 모루",
    legendaryAnvil: "전설 모루",
    all: "전체",
    reroll: "새로고침",
    owned: "보유 중",
  },
  en: {
    shop: "Shop",
    boots: "Boots Shop",
    done: "Done",
    legendary: "Legendary",
    statAnvil: "Stat Anvil",
    prismaticAnvil: "Prismatic Anvil",
    legendaryAnvil: "Legendary Anvil",
    all: "All",
    reroll: "Reroll",
    owned: "Owned",
  },
};

interface Props {
  mode: "boots" | "shop";
  gold: number;
  champion?: Champion;
  prismaticOptions: PrismaticItem[];
  ownedItemIds: string[];
  ownedPrismaticIds: string[];
  onBuyItem: (itemId: string, price: number) => boolean;
  onBuyShard: (shardId: string, price: number) => boolean;
  onBuyPrismatic: (item: PrismaticItem, price: number) => boolean;
}

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export function ArenaShop({
  mode,
  gold,
  champion,
  prismaticOptions,
  ownedItemIds,
  ownedPrismaticIds,
  onBuyItem,
  onBuyShard,
  onBuyPrismatic,
}: Props) {
  const translate = useTranslation(t);
  const { locale } = useLocale();
  const { colors } = useTheme();
  const allItems = useItems();
  const allShards = useStatShards();

  const [cat, setCat] = useState<ShopCat>("legendary");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // 전설 풀(신발 제외)·신발 풀.
  const legendaryPool = useMemo(
    () =>
      allItems.filter(
        (it) =>
          ARAM_IDS.has(it.id) &&
          it.gold.purchasable &&
          !it.tags.includes("Boots"),
      ),
    [allItems],
  );
  const bootsPool = useMemo(
    () => allItems.filter((it) => it.tags.includes("Boots") && it.gold.purchasable),
    [allItems],
  );

  // 챔피언 1순위 태그 → 필터 키(전설 모루의 타입 맞춤).
  const champKey = champion?.tags[0]?.toLowerCase();

  // 능력치 모루 3장 / 전설 모루 3장은 카테고리 진입·리롤 시 새로 추첨한다.
  const [shardOptions, setShardOptions] = useState<StatShard[]>(() =>
    sample(allShards, 3),
  );
  const [anvilOptions, setAnvilOptions] = useState<Item[]>(() => {
    const def = FILTERS.find((f) => f.key === champKey);
    const pool = def ? legendaryPool.filter(def.predicate) : legendaryPool;
    return sample(pool.length >= 3 ? pool : legendaryPool, 3);
  });

  const rerollAnvil = () => {
    const def = FILTERS.find((f) => f.key === champKey);
    const pool = def ? legendaryPool.filter(def.predicate) : legendaryPool;
    setAnvilOptions(sample(pool.length >= 3 ? pool : legendaryPool, 3));
  };

  const displayLegendary = useMemo(() => {
    if (typeFilter === "all") return legendaryPool;
    const def = FILTERS.find((f) => f.key === typeFilter);
    return def ? legendaryPool.filter(def.predicate) : legendaryPool;
  }, [legendaryPool, typeFilter]);

  // ─── 아이템 셀 ───
  const ItemCell = ({ item, price }: { item: Item; price: number }) => {
    const owned = ownedItemIds.includes(item.id);
    const affordable = gold >= price && !owned;
    return (
      <Pressable
        disabled={!affordable}
        onPress={() => onBuyItem(item.id, price)}
        style={[styles.itemCell, { opacity: owned ? 0.4 : affordable ? 1 : 0.5 }]}
      >
        <RemoteImage
          uri={itemImageUrl(item.imageKey)}
          recyclingKey={item.id}
          style={[
            styles.itemIcon,
            { borderColor: owned ? colors.accent.default : colors.border.subtle },
          ]}
          contentFit="cover"
        />
        <View style={styles.priceRow}>
          <MaterialCommunityIcons name="circle-multiple" size={10} color="#F2C766" />
          <ThemedText style={styles.cellPrice}>{price.toLocaleString()}</ThemedText>
        </View>
      </Pressable>
    );
  };

  // ─── 카테고리 탭(shop 모드만) ───
  const CATS: { key: ShopCat; label: keyof (typeof t)["en"]; icon: string; price: number }[] = [
    { key: "legendary", label: "legendary", icon: "sword", price: SHOP_PRICE.legendary },
    { key: "stat-anvil", label: "statAnvil", icon: "anvil", price: SHOP_PRICE.statAnvil },
    { key: "prismatic-anvil", label: "prismaticAnvil", icon: "shimmer", price: SHOP_PRICE.prismaticAnvil },
    { key: "legendary-anvil", label: "legendaryAnvil", icon: "hammer", price: SHOP_PRICE.legendaryAnvil },
  ];

  return (
    <View style={styles.root}>
      {/* 신발 상점 — 신발 그리드만 */}
      {mode === "boots" ? (
        <ScrollView contentContainerStyle={styles.grid}>
          {bootsPool.map((it) => (
            <ItemCell key={it.id} item={it} price={SHOP_PRICE.boots} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.body}>
          {/* 좌측 카테고리 탭 */}
          <View style={styles.catTabs}>
            {CATS.map((c) => {
              const active = cat === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCat(c.key)}
                  style={[
                    styles.catTab,
                    {
                      backgroundColor: active
                        ? colors.accent.subtle
                        : colors.surface.raised,
                      borderColor: active
                        ? colors.accent.default
                        : colors.border.subtle,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={c.icon as never}
                    size={20}
                    color={active ? colors.accent.default : colors.text.secondary}
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      color: active ? colors.accent.default : colors.text.secondary,
                    }}
                    numberOfLines={1}
                  >
                    {translate(c.label)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* 우측 콘텐츠 */}
          <View style={styles.content}>
            {cat === "legendary" && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChips}
                >
                  {["all", "fighter", "marksman", "assassin", "mage", "tank", "support"].map(
                    (key) => {
                      const active = typeFilter === key;
                      const def = FILTERS.find((f) => f.key === key);
                      const label =
                        key === "all"
                          ? translate("all")
                          : def
                            ? locale === "ko"
                              ? def.ko
                              : def.en
                            : key;
                      return (
                        <Pressable
                          key={key}
                          onPress={() => setTypeFilter(key)}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: active
                                ? colors.accent.subtle
                                : colors.surface.raised,
                              borderColor: active
                                ? colors.accent.default
                                : colors.border.subtle,
                            },
                          ]}
                        >
                          <ThemedText
                            type="caption"
                            style={{
                              color: active
                                ? colors.accent.default
                                : colors.text.secondary,
                            }}
                          >
                            {label}
                          </ThemedText>
                        </Pressable>
                      );
                    },
                  )}
                </ScrollView>
                <ScrollView contentContainerStyle={styles.grid}>
                  {displayLegendary.map((it) => (
                    <ItemCell key={it.id} item={it} price={SHOP_PRICE.legendary} />
                  ))}
                </ScrollView>
              </>
            )}

            {cat === "stat-anvil" && (
              <View style={styles.anvilRow}>
                {shardOptions.map((shard) => {
                  const affordable = gold >= SHOP_PRICE.statAnvil;
                  return (
                    <Pressable
                      key={shard.id}
                      disabled={!affordable}
                      onPress={() => onBuyShard(shard.id, SHOP_PRICE.statAnvil)}
                      style={[
                        styles.shardCard,
                        {
                          backgroundColor: colors.surface.raised,
                          borderColor: colors.border.strong,
                          opacity: affordable ? 1 : 0.5,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="anvil"
                        size={28}
                        color={colors.accent.default}
                      />
                      <ThemedText type="label" style={{ fontWeight: "700" }}>
                        {shard.name}
                      </ThemedText>
                      <ThemedText type="caption" color="secondary">
                        {shard.description}
                      </ThemedText>
                      <View style={styles.priceRow}>
                        <MaterialCommunityIcons
                          name="circle-multiple"
                          size={12}
                          color="#F2C766"
                        />
                        <ThemedText style={styles.cellPrice}>
                          {SHOP_PRICE.statAnvil.toLocaleString()}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setShardOptions(sample(allShards, 3))}
                  style={[styles.rerollBtn, { borderColor: colors.border.strong }]}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={20}
                    color={colors.text.primary}
                  />
                </Pressable>
              </View>
            )}

            {cat === "prismatic-anvil" && (
              <ScrollView contentContainerStyle={styles.prismaticGrid}>
                {prismaticOptions.map((item) => (
                  <ArenaPrismaticCard
                    key={item.id}
                    item={item}
                    cardWidth={110}
                    price={SHOP_PRICE.prismaticAnvil}
                    affordable={
                      gold >= SHOP_PRICE.prismaticAnvil &&
                      !ownedPrismaticIds.includes(item.id)
                    }
                    onPick={() => onBuyPrismatic(item, SHOP_PRICE.prismaticAnvil)}
                  />
                ))}
              </ScrollView>
            )}

            {cat === "legendary-anvil" && (
              <View style={styles.anvilRow}>
                {anvilOptions.map((it) => (
                  <ItemCell key={it.id} item={it} price={SHOP_PRICE.legendaryAnvil} />
                ))}
                <Pressable
                  onPress={rerollAnvil}
                  style={[styles.rerollBtn, { borderColor: colors.border.strong }]}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={20}
                    color={colors.text.primary}
                  />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  catTabs: {
    width: 110,
    gap: Spacing.two,
  },
  catTab: {
    alignItems: "center",
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: { flex: 1 },
  filterChips: {
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  itemCell: {
    alignItems: "center",
    gap: Spacing.half,
    width: 52,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  cellPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F2C766",
  },
  anvilRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    flexWrap: "wrap",
  },
  shardCard: {
    width: 150,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "flex-start",
  },
  rerollBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  prismaticGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
});
