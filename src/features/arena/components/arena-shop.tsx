/**
 * ArenaShop — 아레나 골드 상점(가로). 모든 라운드가 동일한 통합 UI를 재사용한다.
 * 좌측 카테고리 탭(신발·전설급·모루) + 우측 콘텐츠 + 하단 보유 아이템 트레이로 구성.
 *   - 신발   : 500골드 신발 그리드
 *   - 전설급 : 클래스 아이콘 필터 + 전설 아이템 그리드(2500골드)
 *   - 모루   : 전설/프리즘 모루 2종(다른 탭과 동일한 셀). 구매 시 카드 3장 선택 오버레이.
 *             전설 모루는 챔피언 클래스 전용 아이템만, 프리즘 모루는 프리즘 아이템.
 * 골드가 충분한 항목만 구매 가능(부족 시 회색 비활성). R1은 500골드라 사실상 신발만 산다.
 * 하단 트레이에서 보유 아이템(일반·프리즘)을 다시 누르면 구매가만큼 환불된다.
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
import { cdragonItemIconUrl, itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import {
  MAX_ITEMS,
  PRISMATIC_SELL_PRICE,
  sampleDistinct,
} from "../hooks/use-arena";
import { ArenaAnvilPicker } from "./arena-anvil-picker";

// 카테고리별 고정 구매가.
export const SHOP_PRICE = {
  boots: 500,
  legendary: 2500,
  legendaryAnvil: 2250,
  prismaticAnvil: 4000,
} as const;

// 판매가 — 하단 트레이에서 팔 때 환원되는 골드(구매가보다 낮다).
// 되돌리기(상점 그리드 재탭)는 구매가 전액을 돌려주므로 이 값과 무관하다.
const SELL_PRICE = {
  boots: 500,
  legendary: 1500,
  prismatic: PRISMATIC_SELL_PRICE,
} as const;

const ARAM_IDS: Set<string> = new Set(
  require("@/features/items/data/aram-item-ids.json"),
);

// 신발 탭에서 숨길 신발(기본 장화 + 아레나 전용 부츠 업그레이드).
const EXCLUDED_BOOT_IDS = new Set([
  "1001", // 장화
  "3168", // 불멸의 길
  "3170", // 신속행진
  "3171", // 핏빛 명석함
  "3173", // 사슬끈 분쇄자
  "3174", // 무장 진격
  "3175", // 주문투척자의 신발
]);

// 클래스별 전설 모루 아이콘(인게임 아레나 모루 아이콘, CDragon items/icons2d).
const ANVIL_ICON: Record<string, string> = {
  fighter: "220001_FighterAnvil",
  marksman: "220002_MarksmanAnvil",
  assassin: "220003_AssassinAnvil",
  mage: "220004_MageAnvil",
  tank: "220005_TankAnvil",
  support: "220006_SupportAnvil",
};
const PRISMATIC_ANVIL_ICON = "220007_PrismaticAnvil";
const anvilIconUri = (file: string) =>
  cdragonItemIconUrl(`/lol-game-data/assets/ASSETS/Items/Icons2D/${file}.png`);

// 전설급 탭에서 노출할 클래스 필터(신발 제외 — 모든 카테고리 + 6개 클래스).
const LEGENDARY_FILTERS = FILTERS.filter((f) => f.key !== "boots");

type ShopCat = "boots" | "legendary" | "anvil";
type AnvilKind = "legendary" | "prismatic";

const t = {
  ko: {
    boots: "신발",
    legendary: "전설급",
    anvil: "모루",
  },
  en: {
    boots: "Boots",
    legendary: "Legendary",
    anvil: "Anvil",
  },
};

interface Props {
  gold: number;
  champion?: Champion;
  prismaticOptions: PrismaticItem[];
  ownedItemIds: string[];
  ownedPrismaticIds: string[];
  onBuyItem: (itemId: string, cost: number, sellValue?: number) => boolean;
  onUndoItem: (itemId: string) => void;
  onSellItem: (itemId: string) => void;
  onBuyPrismatic: (
    item: PrismaticItem,
    cost: number,
    sellValue?: number,
  ) => boolean;
  onSellPrismatic: (id: string) => void;
}

export function ArenaShop({
  gold,
  champion,
  prismaticOptions,
  ownedItemIds,
  ownedPrismaticIds,
  onBuyItem,
  onUndoItem,
  onSellItem,
  onBuyPrismatic,
  onSellPrismatic,
}: Props) {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const allItems = useItems();

  const [cat, setCat] = useState<ShopCat>("boots");
  const [typeFilter, setTypeFilter] = useState<FilterKey>(null);

  // 모루 카드 선택 오버레이 상태.
  const [pickerKind, setPickerKind] = useState<AnvilKind | null>(null);
  const [pickerCards, setPickerCards] = useState<(Item | PrismaticItem)[]>([]);
  const [pickerRerolled, setPickerRerolled] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

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
      allItems.filter(
        (it) =>
          it.tags.includes("Boots") &&
          it.gold.purchasable &&
          !EXCLUDED_BOOT_IDS.has(it.id),
      ),
    [allItems],
  );

  // 챔피언 1순위 태그 → 클래스 필터(전설 모루 풀·아이콘·이름 결정).
  const champKey = champion?.tags[0]?.toLowerCase();
  const classDef = FILTERS.find((f) => f.key === champKey);

  // 전설 모루 풀: 챔피언 클래스 아이템만(매핑 실패 시 전체).
  const classLegendaryPool = useMemo(
    () => (classDef ? legendaryPool.filter(classDef.predicate) : legendaryPool),
    [legendaryPool, classDef],
  );

  // 전설 모루 아이콘(클래스 기반, fallback fighter).
  const legendaryAnvilIcon = anvilIconUri(
    classDef ? ANVIL_ICON[classDef.key] : ANVIL_ICON.fighter,
  );

  const displayLegendary = useMemo(() => {
    if (!typeFilter) return legendaryPool;
    const def = FILTERS.find((f) => f.key === typeFilter);
    return def ? legendaryPool.filter(def.predicate) : legendaryPool;
  }, [legendaryPool, typeFilter]);

  // 보유 아이템(트레이용) — 구매 순서대로. 일반 + 프리즘.
  const ownedItems = useMemo(
    () =>
      ownedItemIds
        .map((id) => allItems.find((it) => it.id === id))
        .filter((it): it is Item => Boolean(it)),
    [ownedItemIds, allItems],
  );
  const ownedPrismatics = useMemo(
    () =>
      ownedPrismaticIds
        .map((id) => prismaticOptions.find((p) => p.id === id))
        .filter((p): p is PrismaticItem => Boolean(p)),
    [ownedPrismaticIds, prismaticOptions],
  );
  const traySlots = useMemo(
    () => [
      ...ownedItems.map((it) => ({
        id: it.id,
        iconUri: itemImageUrl(it.imageKey),
      })),
      ...ownedPrismatics.map((p) => ({
        id: p.id,
        iconUri: cdragonItemIconUrl(p.iconPath),
      })),
    ],
    [ownedItems, ownedPrismatics],
  );

  // ─── 모루 구매 → 카드 3장 선택 오버레이 ───
  const openAnvil = (kind: AnvilKind) => {
    if (kind === "legendary") {
      if (gold < SHOP_PRICE.legendaryAnvil) return;
      const cards = sampleDistinct(
        classLegendaryPool,
        3,
        new Set(ownedItemIds),
      );
      if (!cards.length) return;
      setPickerCards(cards);
    } else {
      if (gold < SHOP_PRICE.prismaticAnvil) return;
      const cards = sampleDistinct(
        prismaticOptions,
        3,
        new Set(ownedPrismaticIds),
      );
      if (!cards.length) return;
      setPickerCards(cards);
    }
    setPickerRerolled([false, false, false]);
    setPickerKind(kind);
  };

  const closePicker = () => {
    setPickerKind(null);
    setPickerCards([]);
  };

  // 카드 선택 → 모루 가격 차감 + 판매가 기록 후 보유 누적.
  const handlePickerPick = (idx: number) => {
    const card = pickerCards[idx];
    if (!card) return closePicker();
    if (pickerKind === "legendary") {
      onBuyItem(card.id, SHOP_PRICE.legendaryAnvil, SELL_PRICE.legendary);
    } else {
      onBuyPrismatic(
        card as PrismaticItem,
        SHOP_PRICE.prismaticAnvil,
        SELL_PRICE.prismatic,
      );
    }
    closePicker();
  };

  // 카드당 1회 무료 리롤 — 현재 3장 + 보유 제외하고 1장 교체.
  const handlePickerReroll = (idx: number) => {
    setPickerCards((prev) => {
      const excl = new Set<string>(
        prev.filter((_, i) => i !== idx).map((c) => c.id),
      );
      let pool: (Item | PrismaticItem)[];
      if (pickerKind === "legendary") {
        ownedItemIds.forEach((id) => excl.add(id));
        pool = classLegendaryPool;
      } else {
        ownedPrismaticIds.forEach((id) => excl.add(id));
        pool = prismaticOptions;
      }
      const [replacement] = sampleDistinct(pool, 1, excl);
      if (!replacement) return prev;
      const next = [...prev];
      next[idx] = replacement;
      return next;
    });
    setPickerRerolled((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  };

  // ─── 아이템 셀(신발/전설 그리드) ───
  // 보유 중이면 재탭으로 되돌리기(구매가 전액 환원). 미보유는 골드 충분 시 구매.
  // 오버레이(흐림)는 "골드 부족 + 미보유"일 때만 — 보유 아이템은 항상 또렷하게.
  const renderItemCell = (item: Item, price: number, sellValue: number) => {
    const owned = ownedItemIds.includes(item.id);
    const canBuy = gold >= price;
    // 아이템 6칸이 꽉 차면 미보유 아이템은 더 못 산다(보유분은 되돌리기 가능).
    const atCap = !owned && ownedItemIds.length >= MAX_ITEMS;
    const dim = !owned && (!canBuy || atCap);
    return (
      <Pressable
        key={item.id}
        disabled={dim}
        onPress={() =>
          owned ? onUndoItem(item.id) : onBuyItem(item.id, price, sellValue)
        }
        style={[styles.itemCell, { opacity: dim ? 0.4 : 1 }]}
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

  // ─── 모루 셀(전설/프리즘) — 아이템 셀과 동일 톤 ───
  const renderAnvilCell = (kind: AnvilKind, iconUri: string, price: number) => {
    // 전설 모루도 전설 아이템 1칸을 차지하므로 6칸이 꽉 차면 비활성화한다.
    const atItemCap = kind === "legendary" && ownedItemIds.length >= MAX_ITEMS;
    const affordable = gold >= price && !atItemCap;
    return (
      <Pressable
        key={kind}
        disabled={!affordable}
        onPress={() => openAnvil(kind)}
        style={[styles.itemCell, { opacity: affordable ? 1 : 0.5 }]}
      >
        <RemoteImage
          uri={iconUri}
          recyclingKey={`anvil-${kind}`}
          style={[styles.itemIcon, { borderColor: colors.border.subtle }]}
          contentFit="contain"
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
        {cat === "boots" && (
          <ScrollView contentContainerStyle={styles.grid}>
            {bootsPool.map((it) =>
              renderItemCell(it, SHOP_PRICE.boots, SELL_PRICE.boots),
            )}
          </ScrollView>
        )}

        {/* 우측 콘텐츠 */}
        <View style={styles.content}>
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
                  renderItemCell(
                    it,
                    SHOP_PRICE.legendary,
                    SELL_PRICE.legendary,
                  ),
                )}
              </ScrollView>
            </View>
          )}

          {cat === "anvil" && (
            <ScrollView contentContainerStyle={styles.grid}>
              {renderAnvilCell(
                "legendary",
                legendaryAnvilIcon,
                SHOP_PRICE.legendaryAnvil,
              )}
              {renderAnvilCell(
                "prismatic",
                anvilIconUri(PRISMATIC_ANVIL_ICON),
                SHOP_PRICE.prismaticAnvil,
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* 하단 보유 아이템 트레이 — absolute로 떠서 콘텐츠 위에 깔린다. 누르면 환불 */}
      <View style={styles.tray} pointerEvents="box-none">
        <ItemSlotGrid
          selectedItems={traySlots}
          onSlotPress={(_i, slot) => {
            if (!slot) return;
            if (ownedPrismaticIds.includes(slot.id)) onSellPrismatic(slot.id);
            else onSellItem(slot.id);
          }}
        />
      </View>

      {/* 모루 카드 3장 선택 오버레이 */}
      {pickerKind && (
        <ArenaAnvilPicker
          kind={pickerKind}
          cards={pickerCards}
          rerolled={pickerRerolled}
          onPick={handlePickerPick}
          onReroll={handlePickerReroll}
          onClose={closePicker}
        />
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
    // gap: Spacing.three,
  },
  catTabs: {
    width: 96,
    gap: Spacing.two,
    borderColor: "green",
    // borderWidth: 1,
  },
  catTab: {
    alignItems: "center",
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: Spacing.two,
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
  // itemCell(44)이 아이콘(40)보다 넓어 생기는 왼쪽 2px 여백을 상쇄해
  // 필터열↔그리드 갭을 catTabs↔필터열 갭과 동일하게 맞춘다.
  legendaryGrid: { flex: 1, marginLeft: -Spacing.half },
  filterIconTab: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.double,
    // 하단 absolute 트레이에 마지막 줄이 가리지 않도록 트레이 높이만큼 띄운다.
    paddingBottom: TRAY_HEIGHT + Spacing.three,
  },
  itemCell: {
    alignItems: "center",
    gap: Spacing.half,
    width: 44,
  },
  // 아이템 아이콘 소스가 64px라 표시를 작게 둘수록 업스케일이 줄어 선명하다.
  itemIcon: {
    width: 40,
    height: 40,
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
  tray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Spacing.two,
    alignItems: "center",
    zIndex: 10,
  },
});
