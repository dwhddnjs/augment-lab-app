/**
 * ItemSelectScreen — 아이템 선택 페이즈 (옵셔널)
 *
 * 레이아웃: 가로모드 / 좌6:우4
 *   좌: 카테고리 필터(아이콘 탭) + ARAM 아이템 그리드
 *   우: 챔피언 아이콘/이름 + 합산 스탯 + 3×2 슬롯 + 증강 칩
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { AugmentRarityColors, Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useTheme } from "@/hooks/use-theme";
import {
  augmentImageUrl,
  championClassIconUrl,
  championSquareUrl,
  itemImageUrl,
} from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { useItems } from "../hooks/use-items";
import type { Item } from "../types";
import { ItemSlotGrid } from "./item-slot-grid";
import { ItemStatPanel } from "./item-stat-panel";

const ARAM_IDS: Set<string> = new Set(require("../data/aram-item-ids.json"));

const MAX_ITEMS = 6;
const NUM_COLS = 7;
const CELL_GAP = Spacing.one; // 4px
const SIDE_TAB_WIDTH = 44;

// ─── 아이템 카테고리 명시 지정 ───────────────────────────────────────────────
// 태그 기반 predicate보다 우선 적용. 여러 카테고리 가능.
const ITEM_CATEGORIES: Record<string, string[]> = {
  "2065": ["support"], // 슈렐리아의 군가
  "2517": ["fighter"], // 끝없는 갈망
  "2524": ["support"], // 밴들파이프
  "3050": ["support"], // 지크의 융합(명령)
  "3068": ["tank"], // 태양불꽃 방패
  "3072": ["marksman"], // 피바라기
  "3087": ["marksman"], // 스태틱의 단검
  "3091": ["fighter"], // 마법사의 최후
  "3107": ["support"], // 구원
  "3109": ["support"], // 기사의 맹세
  "3110": ["tank"], // 얼어붙은 심장
  "3139": ["marksman"], // 헤르메스의 시미터
  "3146": ["mage"], // 마법공학 총검
  "3156": ["fighter"], // 맬모셔스의 아귀
  "3190": ["support"], // 강철의 솔라리 펜던트
  "3222": ["support"], // 미카엘의 축복
  "3302": ["marksman"], // 경계
  "3504": ["support"], // 불타는 향로
  "3814": ["assassin"], // 밤의 끝자락
  "4005": ["support"], // 제국의 명령
  "4633": ["mage"], // 균열 생성기
  "4646": ["mage"], // 폭풍 쇄도
  "6616": ["support"], // 흐르는 물의 지팡이
  "6617": ["support"], // 월석 재생기
  "6620": ["support"], // 헬리아의 메아리
  "6621": ["support"], // 새벽심장
  "6664": ["tank"], // 공허한 광휘
  "6672": ["marksman"], // 크라켄 학살자
  "6692": ["fighter"], // 월식
  "6697": ["assassin"], // 오만 (Hubris)
  "3119": ["tank"], // 혹한의 손길
  "3124": ["marksman"], // 구인수의 격노검
};

/**
 * 아이템이 주어진 카테고리에 속하는지 판단.
 * - ITEM_CATEGORIES에 등록된 아이템은 그 목록만 사용
 * - 신발은 boots/all 탭에서만 노출
 * - 나머지는 tagFallback 사용
 */
function itemInCategory(
  item: Item,
  key: string,
  tagFallback: () => boolean,
): boolean {
  // 신발: boots탭과 all탭에서만 노출
  if (key !== "boots" && key !== "all" && item.tags.includes("Boots"))
    return false;
  // 명시 지정 우선
  const cats = ITEM_CATEGORIES[item.id];
  if (cats !== undefined) return cats.includes(key);
  // boots탭이면 Boots 태그로만 판단
  if (key === "boots") return item.tags.includes("Boots");
  return tagFallback();
}

// ─── 필터 정의 ───────────────────────────────────────────────────────────────
type FilterDef = {
  key: string;
  ko: string;
  en: string;
  predicate: (item: Item) => boolean;
} & (
  | { iconType: "mci"; icon: string }
  | { iconType: "cdragon"; classTag: string }
);

const FILTERS: FilterDef[] = [
  {
    key: "all",
    ko: "전체",
    en: "All",
    predicate: () => true,
    iconType: "mci",
    icon: "apps",
  },
  {
    key: "fighter",
    ko: "전사",
    en: "Fighter",
    predicate: (i) =>
      itemInCategory(
        i,
        "fighter",
        () =>
          i.tags.includes("Damage") &&
          (i.tags.includes("Health") ||
            i.tags.includes("LifeSteal") ||
            i.tags.includes("Mana") ||
            i.tags.includes("Armor")) &&
          !i.tags.includes("CriticalStrike") &&
          !i.tags.includes("SpellDamage") &&
          !i.tags.includes("Aura") &&
          !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Fighter",
  },
  {
    key: "marksman",
    ko: "원거리딜러",
    en: "Marksman",
    predicate: (i) =>
      itemInCategory(
        i,
        "marksman",
        () => i.tags.includes("CriticalStrike") && !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Marksman",
  },
  {
    key: "assassin",
    ko: "암살자",
    en: "Assassin",
    predicate: (i) =>
      itemInCategory(
        i,
        "assassin",
        () =>
          i.tags.includes("ArmorPenetration") &&
          !i.tags.includes("CriticalStrike") &&
          !i.tags.includes("Health") &&
          !i.tags.includes("SpellDamage") &&
          !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Assassin",
  },
  {
    key: "mage",
    ko: "마법사",
    en: "Mage",
    predicate: (i) =>
      itemInCategory(
        i,
        "mage",
        () =>
          (i.tags.includes("SpellDamage") ||
            i.tags.includes("MagicPenetration")) &&
          !i.tags.includes("Boots"),
      ),
    iconType: "cdragon",
    classTag: "Mage",
  },
  {
    key: "tank",
    ko: "탱커",
    en: "Tank",
    predicate: (i) =>
      itemInCategory(
        i,
        "tank",
        () =>
          !i.tags.includes("Damage") &&
          !i.tags.includes("CriticalStrike") &&
          !i.tags.includes("SpellDamage") &&
          !i.tags.includes("ArmorPenetration") &&
          !i.tags.includes("Boots") &&
          (i.tags.includes("Armor") ||
            i.tags.includes("SpellBlock") ||
            i.tags.includes("Tenacity") ||
            i.tags.includes("HealthRegen")),
      ),
    iconType: "cdragon",
    classTag: "Tank",
  },
  {
    key: "support",
    ko: "서포터",
    en: "Support",
    predicate: (i) =>
      itemInCategory(
        i,
        "support",
        () =>
          !i.tags.includes("Boots") &&
          (i.tags.includes("Aura") ||
            i.tags.includes("SpellVamp") ||
            i.tags.includes("GoldPer") ||
            (i.tags.includes("ManaRegen") &&
              !i.tags.includes("Damage") &&
              !i.tags.includes("SpellDamage"))),
      ),
    iconType: "cdragon",
    classTag: "Support",
  },
  {
    key: "boots",
    ko: "신발",
    en: "Boots",
    predicate: (i) =>
      itemInCategory(i, "boots", () => i.tags.includes("Boots")),
    iconType: "mci",
    icon: "shoe-sneaker",
  },
];

type FilterKey = (typeof FILTERS)[number]["key"] | null;

const t = {
  ko: {
    title: "아이템 선택",
    skip: "건너뛰기",
    done: "완료",
    items: "아이템",
    augments: "증강",
  },
  en: {
    title: "Item Select",
    skip: "Skip",
    done: "Done",
    items: "Items",
    augments: "Augments",
  },
};

function FilterIcon({
  filter,
  color,
  size,
}: {
  filter: FilterDef;
  color: string;
  size: number;
}) {
  if (filter.iconType === "cdragon") {
    const uri = championClassIconUrl(filter.classTag);
    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="contain"
          tintColor={color}
        />
      );
    }
    return <MaterialCommunityIcons name="sword" size={size} color={color} />;
  }
  return (
    <MaterialCommunityIcons
      name={
        filter.icon as React.ComponentProps<
          typeof MaterialCommunityIcons
        >["name"]
      }
      size={size}
      color={color}
    />
  );
}

// ─── 증강 카드 (희귀도 테두리 아이콘 + 이름) ─────────────────────────────────
function AugmentCard({
  augment,
  colors,
  size,
}: {
  augment: Augment;
  colors: ReturnType<typeof useTheme>["colors"];
  size: number;
}) {
  const borderColor = AugmentRarityColors[augment.rarity].border;
  return (
    <View style={[styles.augmentCard, { width: size }]}>
      <View
        style={[
          styles.augmentIconBox,
          {
            width: size,
            height: size,
            borderColor,
            backgroundColor: colors.surface.sunken,
          },
        ]}
      >
        <Image
          source={{ uri: augmentImageUrl(augment.iconPath, "large") }}
          style={styles.augmentIconImg}
          contentFit="contain"
        />
      </View>
      <ThemedText
        type="caption"
        color="secondary"
        numberOfLines={2}
        style={styles.augmentCardName}
      >
        {augment.name}
      </ThemedText>
    </View>
  );
}

// ─── 화면 진입 래퍼 (landscape 가드) ─────────────────────────────────────────
export function ItemSelectScreen() {
  const translate = useTranslation(t);
  const { colors } = useTheme();
  const router = useRouter();

  const { picked: pickedJson, championId } = useLocalSearchParams<{
    picked: string;
    championId: string;
  }>();
  const pickedAugments: Augment[] = useMemo(
    () => (pickedJson ? JSON.parse(pickedJson) : []),
    [pickedJson],
  );

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      ).catch(() => {});
    }, []),
  );

  const [dims, setDims] = useState({ w: 0, h: 0 });
  const isLandscape = dims.w > dims.h && dims.w > 0;

  return (
    <ThemedView
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setDims({ w: width, h: height });
      }}
    >
      {isLandscape && (
        <ItemSelectContent
          translate={(key: string) => translate(key as any)}
          colors={colors}
          router={router}
          pickedAugments={pickedAugments}
          championId={championId ?? ""}
          pickedJson={pickedJson ?? "[]"}
        />
      )}
    </ThemedView>
  );
}

// ─── 본체 ────────────────────────────────────────────────────────────────────
function ItemSelectContent({
  translate,
  colors,
  router,
  pickedAugments,
  championId,
  pickedJson,
}: {
  translate: (key: string) => string;
  colors: ReturnType<typeof useTheme>["colors"];
  router: ReturnType<typeof useRouter>;
  pickedAugments: Augment[];
  championId: string;
  pickedJson: string;
}) {
  const allItems = useItems();
  const champions = useChampions();
  const champion = useMemo(
    () => champions.find((c) => c.id === championId) ?? null,
    [champions, championId],
  );

  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 그리드 영역 실측 너비 → NUM_COLS 정확히 채우도록 셀 크기 계산
  const [gridWidth, setGridWidth] = useState(0);
  // 증강 카드 그리드(우측) 실측 너비 → 3열 카드 크기 산출
  const [augmentGridWidth, setAugmentGridWidth] = useState(0);
  const AUG_COLS = 3;
  const augmentCardSize =
    augmentGridWidth > 0
      ? Math.floor((augmentGridWidth - Spacing.two * (AUG_COLS - 1)) / AUG_COLS)
      : 0;

  const aramItems = useMemo(
    () => allItems.filter((item) => ARAM_IDS.has(item.id)),
    [allItems],
  );

  const displayItems = useMemo(() => {
    if (!activeFilter) return aramItems;
    const def = FILTERS.find((f) => f.key === activeFilter);
    return def ? aramItems.filter(def.predicate) : aramItems;
  }, [aramItems, activeFilter]);

  // 마지막 행 균등 크기를 위해 null로 패딩
  const paddedItems = useMemo((): (Item | null)[] => {
    const rem = displayItems.length % NUM_COLS;
    if (rem === 0) return displayItems;
    return [...displayItems, ...Array<null>(NUM_COLS - rem).fill(null)];
  }, [displayItems]);

  // 그리드 영역 실측 너비를 NUM_COLS로 나눠 셀 크기 산출 (gap 제외)
  const cellSize =
    gridWidth > 0
      ? Math.max(
          36,
          Math.floor((gridWidth - (NUM_COLS - 1) * CELL_GAP) / NUM_COLS),
        )
      : 48;

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => aramItems.find((it) => it.id === id)!)
        .filter(Boolean),
    [selectedIds, aramItems],
  );
  const itemStatsList = useMemo(
    () => selectedItems.map((it) => it.stats),
    [selectedItems],
  );

  const handleItemPress = (item: Item) => {
    setSelectedIds((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, item.id];
    });
  };

  const navigateToResult = (itemIds: string[]) => {
    router.replace({
      pathname: "/draft-result",
      params: {
        picked: pickedJson,
        championId,
        items: JSON.stringify(itemIds),
      },
    });
  };

  const championIconUri = champion
    ? championSquareUrl(champion.imageKey)
    : null;

  // 그리드: NUM_COLS씩 row로 묶기
  const rows = useMemo(() => {
    const result: (Item | null)[][] = [];
    for (let i = 0; i < paddedItems.length; i += NUM_COLS) {
      result.push(paddedItems.slice(i, i + NUM_COLS));
    }
    return result;
  }, [paddedItems]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left"]}>
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border.subtle, borderBottomWidth: 1 },
        ]}
      >
        <ThemedText type="heading">{translate("title")}</ThemedText>
        <ThemedText type="caption" color="tertiary">
          {selectedIds.length}/{MAX_ITEMS}
        </ThemedText>
        <View style={styles.headerSpacer} />
        <Pressable
          onPress={() => navigateToResult([])}
          style={[
            styles.btn,
            {
              backgroundColor: colors.surface.raised,
              borderColor: colors.border.default,
              borderWidth: 1,
            },
          ]}
        >
          <ThemedText type="label" color="secondary">
            {translate("skip")}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => navigateToResult(selectedIds)}
          style={[styles.btn, { backgroundColor: colors.accent.default }]}
        >
          <ThemedText type="label" style={{ color: colors.accent.onAccent }}>
            {translate("done")}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* ── 좌(6): 세로 필터 탭 + 아이템 그리드 ── */}
        <View style={styles.leftPanel}>
          {/* 세로 필터 사이드 탭 */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={[
              styles.filterSidebar,
              {
                backgroundColor: "transparent",
                borderRightColor: colors.border.subtle,
                borderRightWidth: 1,
                paddingTop: Spacing.one,
              },
            ]}
            contentContainerStyle={styles.filterSidebarContent}
          >
            {FILTERS.map((f) => {
              const active =
                activeFilter === f.key ||
                (f.key === "all" && activeFilter === null);
              return (
                <Pressable
                  key={f.key}
                  onPress={() =>
                    setActiveFilter(
                      f.key === "all" ? null : active ? null : f.key,
                    )
                  }
                  style={styles.filterTab}
                  hitSlop={10}
                >
                  <FilterIcon
                    filter={f}
                    color={
                      active ? colors.accent.default : colors.text.tertiary
                    }
                    size={22}
                  />
                  <View
                    style={[
                      styles.filterDot,
                      {
                        backgroundColor: active
                          ? colors.accent.default
                          : "transparent",
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 아이템 그리드 — 영역 실측 후 셀 크기 산출, 빈 칸 패딩으로 마지막 행 균등 */}
          <View
            style={styles.gridArea}
            onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.gridContent]}
            >
              {rows.map((row, rowIdx) => (
                <View key={rowIdx} style={[styles.gridRow, { gap: CELL_GAP }]}>
                  {row.map((item, colIdx) => {
                    if (!item) {
                      return (
                        <View
                          key={`ph-${colIdx}`}
                          style={{ width: cellSize, height: cellSize }}
                        />
                      );
                    }
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleItemPress(item)}
                        style={({ pressed }) => ({
                          width: cellSize,
                          height: cellSize,
                          borderRadius: Radius.sm,
                          borderWidth: isSelected ? 2 : 1,
                          borderColor: isSelected
                            ? colors.accent.default
                            : colors.border.subtle,
                          backgroundColor: isSelected
                            ? colors.accent.subtle
                            : colors.surface.raised,
                          opacity: pressed ? 0.7 : 1,
                          justifyContent: "center" as const,
                          alignItems: "center" as const,
                          overflow: "hidden" as const,
                        })}
                      >
                        <Image
                          source={{ uri: itemImageUrl(item.imageKey) }}
                          style={{
                            width: cellSize - 4,
                            height: cellSize - 4,
                            borderRadius: Radius.sm,
                          }}
                          contentFit="contain"
                        />
                        {isSelected && (
                          <View
                            style={[
                              styles.checkBadge,
                              { backgroundColor: colors.accent.default },
                            ]}
                          >
                            <ThemedText
                              style={{
                                color: colors.accent.onAccent,
                                fontSize: 8,
                                lineHeight: 12,
                              }}
                            >
                              ✓
                            </ThemedText>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── 선택된 아이템 트레이 (하단 absolute, 항상 6칸) ── */}
          <View style={styles.tray} pointerEvents="box-none">
            <ItemSlotGrid
              selectedItems={selectedItems}
              onSlotPress={(_i, item) => {
                if (item)
                  setSelectedIds((prev) => prev.filter((id) => id !== item.id));
              }}
            />
          </View>
        </View>

        {/* ── 구분선 ── */}
        <View
          style={[styles.divider, { backgroundColor: colors.border.subtle }]}
        />

        {/* ── 우(4): View로 감싸 flex:4 강제, 내부 ScrollView ── */}
        <View style={styles.rightPanel}>
          <ScrollView
            style={styles.rightScroll}
            contentContainerStyle={styles.rightContent}
            showsVerticalScrollIndicator={false}
          >
            {champion && (
              <View
                style={[
                  styles.championRow,
                  {
                    borderBottomColor: colors.border.subtle,
                    borderBottomWidth: 1,
                  },
                ]}
              >
                {championIconUri && (
                  <Image
                    source={{ uri: championIconUri }}
                    style={[
                      styles.championIcon,
                      { borderColor: colors.border.default, borderWidth: 1 },
                    ]}
                    contentFit="cover"
                  />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText type="body" color="primary" numberOfLines={1}>
                    {champion.name}
                  </ThemedText>
                  <ThemedText type="caption" color="tertiary" numberOfLines={1}>
                    {champion.title}
                  </ThemedText>
                  <ThemedText type="caption" color="disabled" numberOfLines={1}>
                    {champion.tags.join(" · ")}
                  </ThemedText>
                </View>
              </View>
            )}

            {champion && (
              <View style={{ marginTop: Spacing.two }}>
                <ItemStatPanel
                  baseStats={champion.stats}
                  itemStatsList={itemStatsList}
                />
              </View>
            )}

            {pickedAugments.length > 0 && (
              <View style={{ marginTop: Spacing.three }}>
                <ThemedText
                  type="caption"
                  color="tertiary"
                  style={{ marginBottom: Spacing.two }}
                >
                  {translate("augments")}
                </ThemedText>
                <View
                  style={styles.augmentGrid}
                  onLayout={(e) =>
                    setAugmentGridWidth(e.nativeEvent.layout.width)
                  }
                >
                  {augmentCardSize > 0 &&
                    pickedAugments.map((aug) => (
                      <AugmentCard
                        key={aug.id}
                        augment={aug}
                        colors={colors}
                        size={augmentCardSize}
                      />
                    ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerSpacer: { flex: 1 },
  btn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.xl,
  },

  body: { flex: 1, flexDirection: "row" },

  leftPanel: {
    flex: 7,
    minWidth: 0,
    // paddingTop: Spacing.two,
    flexDirection: "row",
    position: "relative",
  },

  tray: {
    position: "absolute",
    // 필터 사이드바를 제외한 그리드 영역 기준으로 중앙 정렬
    left: SIDE_TAB_WIDTH,
    right: 0,
    bottom: Spacing.two,
    alignItems: "center",
  },

  filterSidebar: {
    width: SIDE_TAB_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterSidebarContent: {
    gap: Spacing.double,
    paddingBottom: Spacing.three,
    alignItems: "center",
    paddingTop: Spacing.one,
  },
  filterTab: { alignItems: "center", gap: 3 },
  filterDot: { width: 4, height: 4, borderRadius: Radius.full },

  gridArea: { flex: 1, minWidth: 0, paddingLeft: Spacing.two },

  // 하단 트레이(박스 44 + 패딩 16 + 여백)에 가려지지 않도록 충분한 패딩
  gridContent: { gap: CELL_GAP, paddingBottom: 80, paddingTop: Spacing.two },
  gridRow: { flexDirection: "row" },

  checkBadge: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
  },

  divider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: Spacing.two,
    // marginVertical: Spacing.two,
  },

  rightPanel: { flex: 3, minWidth: 0 },
  rightScroll: { flex: 1 },
  rightContent: {
    paddingLeft: Spacing.one,
    paddingRight: Spacing.double,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },

  championRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  championIcon: { width: 52, height: 52, borderRadius: Radius.md },

  augmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  augmentCard: {
    alignItems: "center",
    gap: Spacing.one,
  },
  augmentIconBox: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  augmentIconImg: { width: "100%", height: "100%" },
  augmentCardName: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
  },
});
