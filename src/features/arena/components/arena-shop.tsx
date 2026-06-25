/**
 * ArenaShop — 아레나 골드 상점(가로). 모든 라운드가 동일한 통합 UI를 재사용한다.
 * 좌측 카테고리 탭(신발·전설급·모루) + 우측 콘텐츠 + 하단 보유 아이템 트레이로 구성.
 *   - 신발   : 500골드 신발 그리드
 *   - 전설급 : 클래스 아이콘 필터 + 전설 아이템 그리드(2500골드)
 *   - 모루   : 능력치(750)·전설 아이템(2250)·프리즘 아이템(4000) 모루 3종(구매 액션은 추후)
 * 골드가 충분한 항목만 구매 가능(부족 시 회색 비활성). R1은 500골드라 사실상 신발만 산다.
 * 하단 트레이에서 보유 아이템을 다시 누르면 구매가만큼 환불된다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import type { PrismaticItem } from "@/features/arena/types";
import type { Champion } from "@/features/champions/types";
import { FilterIcon } from "@/features/items/components/filter-icon";
import {
  ItemSlotGrid,
  TRAY_HEIGHT,
} from "@/features/items/components/item-slot-grid";
import { FILTERS, type FilterKey } from "@/features/items/data/item-filters";
import { useItems } from "@/features/items/hooks/use-items";
import type { Item } from "@/features/items/types";
import { useTheme } from "@/hooks/use-theme";
import {
  augmentImageUrl,
  cdragonItemIconUrl,
  itemImageUrl,
} from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";

// 카테고리별 고정 가격.
export const SHOP_PRICE = {
  boots: 500,
  legendary: 2500,
  statAnvil: 750,
  legendaryAnvil: 2250,
  prismaticAnvil: 4000,
} as const;

const ARAM_IDS: Set<string> = new Set(
  require("@/features/items/data/aram-item-ids.json"),
);

// 능력치 모루 아이콘(CDragon cherry 원본). augmentImageUrl로 small 아이콘을 렌더한다.
const STAT_ANVIL_ICON =
  "/lol-game-data/assets/assets/ux/cherry/augments/icons/gain_stat_anvil_small.png";

// 전설급 탭에서 노출할 클래스 필터(신발 제외 — 모든 카테고리 + 6개 클래스).
const LEGENDARY_FILTERS = FILTERS.filter((f) => f.key !== "boots");

type ShopCat = "boots" | "legendary" | "anvil";
type AnvilKind = "stat" | "legendary" | "prismatic";

const t = {
  ko: {
    boots: "신발",
    legendary: "전설급",
    anvil: "모루",
    statAnvil: "능력치 모루",
    legendaryAnvilName: "전설 아이템 모루",
    prismaticAnvilName: "프리즘 아이템 모루",
  },
  en: {
    boots: "Boots",
    legendary: "Legendary",
    anvil: "Anvil",
    statAnvil: "Stat Anvil",
    legendaryAnvilName: "Legendary Anvil",
    prismaticAnvilName: "Prismatic Anvil",
  },
};

interface Props {
  gold: number;
  champion?: Champion;
  prismaticOptions: PrismaticItem[];
  ownedItemIds: string[];
  onBuyItem: (itemId: string, price: number) => boolean;
  onSellItem: (itemId: string) => void;
}

export function ArenaShop({
  gold,
  champion,
  prismaticOptions,
  ownedItemIds,
  onBuyItem,
  onSellItem,
}: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const allItems = useItems();

  const [cat, setCat] = useState<ShopCat>("boots");
  const [typeFilter, setTypeFilter] = useState<FilterKey>(null);

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
    () =>
      allItems.filter((it) => it.tags.includes("Boots") && it.gold.purchasable),
    [allItems],
  );

  // 챔피언 1순위 태그 → 필터 키(전설 모루 대표 아이콘 맞춤).
  const champKey = champion?.tags[0]?.toLowerCase();

  // 모루 대표 아이콘: 전설 = 챔피언 클래스 대표 전설 아이템, 프리즘 = 첫 프리즘 아이템.
  const legendaryRep = useMemo(() => {
    const def = FILTERS.find((f) => f.key === champKey);
    const pool = def ? legendaryPool.filter(def.predicate) : legendaryPool;
    return (pool.length ? pool : legendaryPool)[0];
  }, [legendaryPool, champKey]);
  const prismaticRep = prismaticOptions[0];

  const displayLegendary = useMemo(() => {
    if (!typeFilter) return legendaryPool;
    const def = FILTERS.find((f) => f.key === typeFilter);
    return def ? legendaryPool.filter(def.predicate) : legendaryPool;
  }, [legendaryPool, typeFilter]);

  // 보유 아이템(트레이용) — 구매 순서대로.
  const ownedItems = useMemo(
    () =>
      ownedItemIds
        .map((id) => allItems.find((it) => it.id === id))
        .filter((it): it is Item => Boolean(it)),
    [ownedItemIds, allItems],
  );

  // ─── 아이템 셀(신발/전설 그리드) ───
  const renderItemCell = (item: Item, price: number) => {
    const owned = ownedItemIds.includes(item.id);
    const affordable = gold >= price && !owned;
    return (
      <Pressable
        key={item.id}
        disabled={!affordable}
        onPress={() => onBuyItem(item.id, price)}
        style={[
          styles.itemCell,
          { opacity: owned ? 0.4 : affordable ? 1 : 0.5 },
        ]}
      >
        <RemoteImage
          uri={itemImageUrl(item.imageKey)}
          recyclingKey={item.id}
          style={[
            styles.itemIcon,
            {
              borderColor: owned ? colors.accent.default : colors.border.subtle,
            },
          ]}
          contentFit="cover"
        />
        <View style={styles.priceRow}>
          <MaterialCommunityIcons
            name="circle-multiple"
            size={10}
            color="#F2C766"
          />
          <ThemedText style={styles.cellPrice}>
            {price.toLocaleString()}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  // ─── 모루 카드(능력치/전설/프리즘) ───
  const renderAnvilCard = ({
    kind,
    name,
    price,
    iconUri,
  }: {
    kind: AnvilKind;
    name: string;
    price: number;
    iconUri?: string;
  }) => {
    const affordable = gold >= price;
    return (
      <View key={kind} style={styles.anvilCard}>
        <MaterialCommunityIcons
          name="star"
          size={16}
          color={affordable ? "#F2C766" : colors.text.disabled}
          style={styles.anvilStar}
        />
        <Pressable
          disabled={!affordable}
          // 구매 액션은 추후 구현 — 현재는 종류 표시만.
          onPress={() => {}}
          style={[
            styles.anvilBox,
            {
              borderColor: affordable
                ? colors.accent.default
                : colors.border.subtle,
              backgroundColor: colors.surface.raised,
              opacity: affordable ? 1 : 0.5,
            },
          ]}
        >
          {iconUri ? (
            <RemoteImage
              uri={iconUri}
              recyclingKey={`anvil-${kind}`}
              style={styles.anvilIcon}
              contentFit="contain"
            />
          ) : (
            <MaterialCommunityIcons
              name="anvil"
              size={36}
              color={colors.text.secondary}
            />
          )}
        </Pressable>
        <ThemedText type="caption" color="secondary" numberOfLines={1}>
          {name}
        </ThemedText>
        <View style={styles.priceRow}>
          <MaterialCommunityIcons
            name="circle-multiple"
            size={12}
            color={affordable ? "#F2C766" : colors.text.disabled}
          />
          <ThemedText
            style={[
              styles.cellPrice,
              { color: affordable ? "#F2C766" : colors.text.disabled },
            ]}
          >
            {price.toLocaleString()}
          </ThemedText>
        </View>
      </View>
    );
  };

  // ─── 좌측 카테고리 탭 ───
  const CATS: { key: ShopCat; label: keyof (typeof t)["en"]; icon: string }[] =
    [
      { key: "boots", label: "boots", icon: "shoe-sneaker" },
      { key: "legendary", label: "legendary", icon: "sword" },
      { key: "anvil", label: "anvil", icon: "anvil" },
    ];

  return (
    <View style={styles.root}>
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
                    color: active
                      ? colors.accent.default
                      : colors.text.secondary,
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
          {cat === "boots" && (
            <ScrollView contentContainerStyle={styles.grid}>
              {bootsPool.map((it) => renderItemCell(it, SHOP_PRICE.boots))}
            </ScrollView>
          )}

          {cat === "legendary" && (
            <View style={styles.legendaryBody}>
              {/* 좌측 세로 클래스 아이콘 필터 */}
              <ScrollView
                style={styles.filterColumn}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.filterIconsColumn}
              >
                {LEGENDARY_FILTERS.map((f) => {
                  const active =
                    typeFilter === f.key ||
                    (f.key === "all" && typeFilter === null);
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() =>
                        setTypeFilter(
                          f.key === "all" ? null : active ? null : f.key,
                        )
                      }
                      style={styles.filterIconTab}
                      hitSlop={6}
                    >
                      <FilterIcon
                        filter={f}
                        color={
                          active ? colors.accent.default : colors.text.tertiary
                        }
                        size={24}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView
                style={styles.legendaryGrid}
                contentContainerStyle={styles.grid}
              >
                {displayLegendary.map((it) =>
                  renderItemCell(it, SHOP_PRICE.legendary),
                )}
              </ScrollView>
            </View>
          )}

          {cat === "anvil" && (
            <View style={styles.anvilRow}>
              {renderAnvilCard({
                kind: "stat",
                name: translate("statAnvil"),
                price: SHOP_PRICE.statAnvil,
                iconUri: augmentImageUrl(STAT_ANVIL_ICON, "small"),
              })}
              {renderAnvilCard({
                kind: "legendary",
                name: translate("legendaryAnvilName"),
                price: SHOP_PRICE.legendaryAnvil,
                iconUri: legendaryRep
                  ? itemImageUrl(legendaryRep.imageKey)
                  : undefined,
              })}
              {renderAnvilCard({
                kind: "prismatic",
                name: translate("prismaticAnvilName"),
                price: SHOP_PRICE.prismaticAnvil,
                iconUri: prismaticRep
                  ? cdragonItemIconUrl(prismaticRep.iconPath)
                  : undefined,
              })}
            </View>
          )}
        </View>
      </View>

      {/* 하단 보유 아이템 트레이 — absolute로 떠서 콘텐츠 위에 깔린다. 누르면 환불 */}
      <View style={styles.tray} pointerEvents="box-none">
        <ItemSlotGrid
          selectedItems={ownedItems}
          onSlotPress={(_i, item) => {
            if (item) onSellItem(item.id);
          }}
        />
      </View>
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
    width: 96,
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
  legendaryBody: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.two,
  },
  filterColumn: {
    width: 40,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterIconsColumn: {
    gap: Spacing.one,
    alignItems: "center",
  },
  legendaryGrid: { flex: 1 },
  filterIconTab: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    // 하단 absolute 트레이에 마지막 줄이 가리지 않도록 트레이 높이만큼 띄운다.
    paddingBottom: TRAY_HEIGHT + Spacing.three,
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
    gap: Spacing.four,
    paddingTop: Spacing.two,
    paddingLeft: Spacing.two,
  },
  anvilCard: {
    alignItems: "center",
    gap: Spacing.half,
    width: 84,
  },
  anvilStar: {
    marginBottom: -6,
    zIndex: 1,
  },
  anvilBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  anvilIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
  tray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Spacing.two,
    alignItems: "center",
    zIndex: 10,
  },
});
