/**
 * ItemSelectScreen — 아이템 선택 페이즈 (옵셔널). 칼바람·클래식 공용.
 *
 * 레이아웃: 가로모드 / 좌7:우3
 *   좌: 카테고리 필터(ItemFilterBar) + 모드별 아이템 그리드(ItemGrid) + 선택 트레이
 *   우: 챔피언 아이콘/이름 + 합산 스탯 + 증강 칩 (ItemDetailPanel)
 *
 * 필터·선택·그리드 계산·저장은 useItemSelect 가 맡는다.
 */
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import { GlassButton } from "@/components/ui/glass-button";
import { parseDraftMode } from "@/constants/game-modes";
import { Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useTheme } from "@/hooks/use-theme";
import { type DraftMode } from "@/lib/build-storage";
import { itemImageUrl } from "@/lib/ddragon";
import { ItemDetailPanel } from "../components/item-detail-panel";
import { ItemFilterBar, SIDE_TAB_WIDTH } from "../components/item-filter-bar";
import { ItemGrid } from "../components/item-grid";
import { ItemSlotGrid } from "../components/item-slot-grid";
import { MAX_ITEMS, useItemSelect } from "../hooks/use-item-select";

// ─── 화면 진입 래퍼 (landscape 가드) ─────────────────────────────────────────
export function ItemSelectScreen() {
  const {
    picked: pickedJson,
    championId,
    mode: modeParam,
  } = useLocalSearchParams<{
    picked: string;
    championId: string;
    mode?: string;
  }>();
  const mode: DraftMode = parseDraftMode(modeParam);
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
          pickedAugments={pickedAugments}
          championId={championId ?? ""}
          mode={mode}
        />
      )}
    </ThemedView>
  );
}

// ─── 본체 ────────────────────────────────────────────────────────────────────
function ItemSelectContent({
  pickedAugments,
  championId,
  mode,
}: {
  pickedAugments: Augment[];
  championId: string;
  mode: DraftMode;
}) {
  const { colors } = useTheme();
  const {
    translate,
    champion,
    rows,
    cellSize,
    activeFilter,
    setActiveFilter,
    selectedIds,
    selectedItems,
    itemStatsList,
    augmentGridWidth,
    handleItemPress,
    handleSlotPress,
    handleSave,
    handleExit,
    onGridLayout,
    onAugmentGridLayout,
  } = useItemSelect({ championId, mode, pickedAugments });

  return (
    // "right"가 빠지면 헤더 오른쪽 끝의 저장 버튼이 홈 인디케이터 제스처 영역에
    // 걸려 탭이 시스템에 먹힌다 — 눌리지 않는 저장 버튼이 된다.
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* 헤더 — 나가기 + 타이틀 + 선택 수 + 저장 버튼 */}
      <View style={styles.header}>
        <GlassButton
          systemImage="xmark"
          fallbackIcon="close"
          role="cancel"
          onPress={handleExit}
        />

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
          tint={colors.accent.default}
          onPress={handleSave}
        />
      </View>

      <View style={styles.body}>
        {/* ── 좌(7): 세로 필터 탭 + 아이템 그리드 + 트레이 ── */}
        <View style={styles.leftPanel}>
          <ItemFilterBar
            activeFilter={activeFilter}
            onChange={setActiveFilter}
          />

          <ItemGrid
            rows={rows}
            cellSize={cellSize}
            selectedIds={selectedIds}
            onItemPress={handleItemPress}
            onGridLayout={onGridLayout}
          />

          {/* 선택된 아이템 트레이 (하단 absolute, 항상 6칸) */}
          <View style={styles.tray} pointerEvents="box-none">
            <ItemSlotGrid
              selectedItems={selectedItems.map((it) => ({
                id: it.id,
                iconUri: itemImageUrl(it.imageKey),
              }))}
              onSlotPress={handleSlotPress}
            />
          </View>
        </View>

        {/* ── 우(3): 챔피언 + 합산 스탯 + 증강 ── */}
        <ItemDetailPanel
          champion={champion}
          itemStatsList={itemStatsList}
          pickedAugments={pickedAugments}
          augmentGridWidth={augmentGridWidth}
          statsLabel={translate("stats")}
          augmentsLabel={translate("augments")}
          onAugmentGridLayout={onAugmentGridLayout}
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
    // 나가기 버튼과 타이틀이 붙어 보이지 않도록 gap을 넓게. 왼쪽 패딩은
    // SafeAreaView의 left inset 위에 얹히므로 작게 유지한다.
    gap: Spacing.three,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.three,
    // aram/arena 헤더와 동일한 상단 간격.
    paddingTop: Spacing.double,
    paddingBottom: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
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
