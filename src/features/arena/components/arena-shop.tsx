/**
 * ArenaShop — 아레나 골드 상점(가로). 모든 라운드가 동일한 통합 UI를 재사용한다.
 * 좌측 카테고리 탭(신발·전설급·모루) + 우측 콘텐츠 + 하단 보유 아이템 트레이로 구성.
 *   - 신발   : 500골드 신발 그리드
 *   - 전설급 : 클래스 아이콘 필터 + 전설 아이템 그리드(2500골드)
 *   - 모루   : 전설/프리즘 모루 2종(다른 탭과 동일한 셀). 구매 시 카드 3장 선택 오버레이.
 *             전설 모루는 챔피언 클래스 전용 아이템만, 프리즘 모루는 프리즘 아이템.
 * 골드가 충분한 항목만 구매 가능(부족 시 회색 비활성). R1은 500골드라 사실상 신발만 산다.
 * 하단 트레이에서 보유 아이템(일반·프리즘)을 다시 누르면 판매가만큼 환불된다.
 *
 * 가격·보유 한도는 ../arena-rules 가 단일 출처다.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import type { PrismaticItem } from "@/features/arena/types";
import type { Champion } from "@/features/champions/types";
import { FilterIcon } from "@/features/items/components/filter-icon";
import {
  ItemSlotGrid,
  TRAY_HEIGHT,
} from "@/features/items/components/item-slot-grid";
import { useItemPool } from "@/features/items/hooks/use-items";
import { FILTERS, type FilterKey } from "@/features/items/item-filters";
import type { Item } from "@/features/items/types";
import { useTheme } from "@/hooks/use-theme";
import { resolveIds } from "@/lib/arrays";
import { cdragonItemIconUrl, itemImageUrl } from "@/lib/ddragon";
import { MAX_ITEMS, SELL_PRICE, SHOP_PRICE } from "../arena-rules";
import { ArenaAnvilPicker } from "./arena-anvil-picker";
import { ShopCell } from "./arena-shop-cell";
import { ShopCategoryTabs, type ShopCat } from "./arena-shop-tabs";

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

type AnvilKind = "legendary" | "prismatic";

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
  const { colors } = useTheme();
  // 아레나는 협곡 완성 아이템 풀을 쓴다. 전체 목록에는 클래식 레트로 아이템이
  // 섞여 있어 태그 필터만으로는 걸러지지 않는다.
  const allItems = useItemPool("aram");

  const [cat, setCat] = useState<ShopCat>("boots");
  const [typeFilter, setTypeFilter] = useState<FilterKey>(null);
  // 열려 있는 모루 오버레이(카드 3장 선택). null이면 닫힘.
  const [anvil, setAnvil] = useState<AnvilKind | null>(null);

  // 전설 풀(신발 제외)·신발 풀.
  const legendaryPool = allItems.filter(
    (it) => it.gold.purchasable && !it.tags.includes("Boots"),
  );
  const bootsPool = allItems.filter(
    (it) =>
      it.tags.includes("Boots") &&
      it.gold.purchasable &&
      !EXCLUDED_BOOT_IDS.has(it.id),
  );

  // 챔피언 1순위 태그 → 클래스 필터(전설 모루 풀·아이콘 결정).
  const classDef = FILTERS.find((f) => f.key === champion?.tags[0]?.toLowerCase());
  // 전설 모루 풀: 챔피언 클래스 아이템만(매핑 실패 시 전체).
  const classLegendaryPool = classDef
    ? legendaryPool.filter(classDef.predicate)
    : legendaryPool;

  const filterDef = FILTERS.find((f) => f.key === typeFilter);
  const displayLegendary = filterDef
    ? legendaryPool.filter(filterDef.predicate)
    : legendaryPool;

  // 하단 트레이 — 보유 아이템(일반 + 프리즘)을 구매 순서대로.
  const traySlots = [
    ...resolveIds(ownedItemIds, allItems).map((it) => ({
      id: it.id,
      iconUri: itemImageUrl(it.imageKey),
    })),
    ...resolveIds(ownedPrismaticIds, prismaticOptions).map((p) => ({
      id: p.id,
      iconUri: cdragonItemIconUrl(p.iconPath),
    })),
  ];

  // ─── 모루 ───
  const anvilPrice =
    anvil === "prismatic" ? SHOP_PRICE.prismaticAnvil : SHOP_PRICE.legendaryAnvil;
  const anvilPool: (Item | PrismaticItem)[] =
    anvil === "prismatic" ? prismaticOptions : classLegendaryPool;
  const anvilExclude = anvil === "prismatic" ? ownedPrismaticIds : ownedItemIds;

  const openAnvil = (kind: AnvilKind) => {
    const price =
      kind === "prismatic" ? SHOP_PRICE.prismaticAnvil : SHOP_PRICE.legendaryAnvil;
    if (gold < price) return;
    // 뽑을 카드가 하나도 없으면 열지 않는다(빈 오버레이 방지).
    const pool = kind === "prismatic" ? prismaticOptions : classLegendaryPool;
    const owned = new Set(
      kind === "prismatic" ? ownedPrismaticIds : ownedItemIds,
    );
    if (!pool.some((c) => !owned.has(c.id))) return;
    setAnvil(kind);
  };

  // 카드 선택 → 모루 가격 차감 + 판매가 기록 후 보유 누적.
  const confirmAnvil = (card: Item | PrismaticItem) => {
    if (anvil === "prismatic") {
      onBuyPrismatic(
        card as PrismaticItem,
        SHOP_PRICE.prismaticAnvil,
        SELL_PRICE.prismatic,
      );
    } else {
      onBuyItem(card.id, SHOP_PRICE.legendaryAnvil, SELL_PRICE.legendary);
    }
    setAnvil(null);
  };

  // ─── 셀 ───
  // 보유 중이면 재탭으로 되돌리기(구매가 전액 환원). 미보유는 골드 충분 시 구매.
  // 흐림은 "골드 부족 + 미보유"일 때만 — 보유 아이템은 항상 또렷하게.
  const itemCell = (item: Item, price: number, sellValue: number) => {
    const owned = ownedItemIds.includes(item.id);
    // 아이템 6칸이 꽉 차면 미보유 아이템은 더 못 산다(보유분은 되돌리기 가능).
    const dim = !owned && (gold < price || ownedItemIds.length >= MAX_ITEMS);
    return (
      <ShopCell
        key={item.id}
        uri={itemImageUrl(item.imageKey)}
        recyclingKey={item.id}
        price={price}
        owned={owned}
        disabled={dim}
        opacity={dim ? 0.4 : 1}
        onPress={() =>
          owned ? onUndoItem(item.id) : onBuyItem(item.id, price, sellValue)
        }
      />
    );
  };

  const anvilCell = (kind: AnvilKind, iconUri: string, price: number) => {
    // 전설 모루도 전설 아이템 1칸을 차지하므로 6칸이 꽉 차면 비활성화한다.
    const atItemCap = kind === "legendary" && ownedItemIds.length >= MAX_ITEMS;
    const affordable = gold >= price && !atItemCap;
    return (
      <ShopCell
        key={kind}
        uri={iconUri}
        recyclingKey={`anvil-${kind}`}
        price={price}
        disabled={!affordable}
        opacity={affordable ? 1 : 0.5}
        contentFit="contain"
        onPress={() => openAnvil(kind)}
      />
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <ShopCategoryTabs active={cat} onChange={setCat} />

        {cat === "boots" && (
          <ScrollView contentContainerStyle={styles.grid}>
            {bootsPool.map((it) =>
              itemCell(it, SHOP_PRICE.boots, SELL_PRICE.boots),
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
                  itemCell(it, SHOP_PRICE.legendary, SELL_PRICE.legendary),
                )}
              </ScrollView>
            </View>
          )}

          {cat === "anvil" && (
            <ScrollView contentContainerStyle={styles.grid}>
              {anvilCell(
                "legendary",
                anvilIconUri(
                  ANVIL_ICON[classDef?.key ?? "fighter"] ?? ANVIL_ICON.fighter,
                ),
                SHOP_PRICE.legendaryAnvil,
              )}
              {anvilCell(
                "prismatic",
                anvilIconUri(PRISMATIC_ANVIL_ICON),
                SHOP_PRICE.prismaticAnvil,
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* 하단 보유 아이템 트레이 — absolute로 떠서 콘텐츠 위에 깔린다. 누르면 판매 */}
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
      {anvil && (
        <ArenaAnvilPicker
          key={`${anvil}-${anvilPrice}`}
          kind={anvil}
          pool={anvilPool}
          excludeIds={anvilExclude}
          onPick={confirmAnvil}
          onClose={() => setAnvil(null)}
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
  // ShopCell(44)이 아이콘(40)보다 넓어 생기는 왼쪽 2px 여백을 상쇄해
  // 필터열↔그리드 갭을 탭↔필터열 갭과 동일하게 맞춘다.
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
  tray: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Spacing.two,
    alignItems: "center",
    zIndex: 10,
  },
});
