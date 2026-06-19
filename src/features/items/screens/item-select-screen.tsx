/**
 * ItemSelectScreen — 아이템 선택 페이즈 (옵셔널)
 *
 * 레이아웃: 가로모드 / 좌7:우3
 *   좌: 카테고리 필터(ItemFilterBar) + ARAM 아이템 그리드(ItemGrid) + 선택 트레이
 *   우: 챔피언 아이콘/이름 + 합산 스탯 + 증강 칩 (ItemDetailPanel)
 */
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { GlassButton } from "@/components/ui/glass-button";
import { Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useChampions } from "@/features/champions/hooks/use-champions";
import { useTheme } from "@/hooks/use-theme";
import { saveBuild } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";
import { ItemDetailPanel } from "../components/item-detail-panel";
import { ItemFilterBar, SIDE_TAB_WIDTH } from "../components/item-filter-bar";
import { ItemGrid } from "../components/item-grid";
import { ItemSlotGrid } from "../components/item-slot-grid";
import { FILTERS, type FilterKey } from "../data/item-filters";
import { useItems } from "../hooks/use-items";
import type { Item } from "../types";

const ARAM_IDS: Set<string> = new Set(require("../data/aram-item-ids.json"));

const MAX_ITEMS = 6;
const NUM_COLS = 8;
const CELL_GAP = Spacing.one; // 4px

const t = {
  ko: {
    title: "아이템 선택",
    augments: "증강",
    saveError: "빌드 저장에 실패했어요",
  },
  en: {
    title: "Item Select",
    augments: "Augments",
    saveError: "Failed to save the build",
  },
};

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
          translate={translate}
          accentColor={colors.accent.default}
          router={router}
          pickedAugments={pickedAugments}
          championId={championId ?? ""}
        />
      )}
    </ThemedView>
  );
}

// ─── 본체 ────────────────────────────────────────────────────────────────────
function ItemSelectContent({
  translate,
  accentColor,
  router,
  pickedAugments,
  championId,
}: {
  translate: (key: keyof (typeof t)["en"]) => string;
  accentColor: string;
  router: ReturnType<typeof useRouter>;
  pickedAugments: Augment[];
  championId: string;
}) {
  const allItems = useItems();
  const champions = useChampions();
  const champion = useMemo(
    () => champions.find((c) => c.id === championId) ?? null,
    [champions, championId],
  );

  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // 그리드 영역 실측 너비 → NUM_COLS 정확히 채우도록 셀 크기 계산
  const [gridWidth, setGridWidth] = useState(0);
  // 증강 카드 그리드(우측) 실측 너비 → 카드 크기 산출(패널 내부에서 사용)
  const [augmentGridWidth, setAugmentGridWidth] = useState(0);

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

  // 그리드: NUM_COLS씩 row로 묶기
  const rows = useMemo(() => {
    const result: (Item | null)[][] = [];
    for (let i = 0; i < paddedItems.length; i += NUM_COLS) {
      result.push(paddedItems.slice(i, i + NUM_COLS));
    }
    return result;
  }, [paddedItems]);

  const handleItemPress = (item: Item) => {
    setSelectedIds((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, item.id];
    });
  };

  const saveAndOpenBuild = async (itemIds: string[]) => {
    if (saving) return;
    setSaving(true);
    let build;
    try {
      build = await saveBuild({
        championId: championId ?? "",
        augmentIds: pickedAugments.map((a) => a.id),
        itemIds,
      });
    } catch {
      Alert.alert(translate("saveError"));
      setSaving(false);
      return;
    }
    // lockAsync를 await해서 기기가 portrait로 전환된 후 navigation을 시작한다.
    // await 없이 바로 이동하면 landscape 상태로 build 상세가 mount돼 회전 잔상이 보인다.
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch(() => {});
    router.dismissTo("/");
    router.push({ pathname: "/build/[id]", params: { id: build.id } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left"]}>
      {/* 헤더 — 타이틀 + 선택 수 + 저장 버튼 */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ThemedText type="heading">{translate("title")}</ThemedText>
          <ThemedText type="label" color="secondary">
            {selectedIds.length} / {MAX_ITEMS}
          </ThemedText>
        </View>

        <View style={styles.headerSpacer} />
        <GlassButton
          systemImage="checkmark"
          fallbackIcon="check"
          tint={accentColor}
          onPress={() => saveAndOpenBuild(selectedIds)}
        />
      </View>

      <View style={styles.body}>
        {/* ── 좌(7): 세로 필터 탭 + 아이템 그리드 + 트레이 ── */}
        <View style={styles.leftPanel}>
          <ItemFilterBar activeFilter={activeFilter} onChange={setActiveFilter} />

          <ItemGrid
            rows={rows}
            cellSize={cellSize}
            selectedIds={selectedIds}
            onItemPress={handleItemPress}
            onGridLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
          />

          {/* 선택된 아이템 트레이 (하단 absolute, 항상 6칸) */}
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

        {/* ── 우(3): 챔피언 + 합산 스탯 + 증강 ── */}
        <ItemDetailPanel
          champion={champion}
          itemStatsList={itemStatsList}
          pickedAugments={pickedAugments}
          augmentGridWidth={augmentGridWidth}
          augmentsLabel={translate("augments")}
          onAugmentGridLayout={(e) =>
            setAugmentGridWidth(e.nativeEvent.layout.width)
          }
        />
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
    paddingLeft: Spacing.three,
    paddingRight: Spacing.three,
    paddingTop: Spacing.double,
    paddingBottom: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginTop: Spacing.double,
    gap: Spacing.two,
  },
  headerSpacer: { flex: 1 },

  body: { flex: 1, flexDirection: "row" },

  leftPanel: {
    flex: 7,
    minWidth: 0,
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
});
