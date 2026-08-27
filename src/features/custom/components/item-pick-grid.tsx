/**
 * ItemPickGrid — 커스텀 화면 좌측(6.5)의 아이템 판. 헤더 토글이 증강 그리드와 맞바꾼다.
 *
 * 필터 레일은 아이템 선택 화면의 ItemFilterBar 를 그대로 쓴다(폭 44 = 증강 티어 레일과
 * 같다). 딸려오는 FILTERS·FilterIcon 이 전부 items 도메인이라 공용 UI 로 승격하지
 * 않고 그 feature 에서 가져다 쓴다 — 빌드 상세가 ItemStatPanel 을 쓰는 것과 같다.
 *
 * 셀 크기는 그리드 실측 폭에서 낸다. 아이콘 소스가 64px 라 8열(≈50pt)이면 업스케일이
 * 없다 — 열을 줄이면 흐려진다.
 */
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { ItemFilterBar } from "@/features/items/components/item-filter-bar";
import type { FilterKey } from "@/features/items/item-filters";
import type { Item } from "@/features/items/types";
import { useTheme } from "@/hooks/use-theme";
import { itemImageUrl } from "@/lib/ddragon";
import { useTranslation } from "@/lib/i18n";
import { DragCell, type DragPayload } from "./drag-cell";

const t = {
  ko: { empty: "결과 없음" },
  en: { empty: "No results" },
};

const COLS = 8;
const PAD = Spacing.two;
const GAP = Spacing.one;

interface Props {
  list: Item[];
  selectedIds: Set<string>;
  filter: FilterKey;
  onFilterChange: (next: FilterKey) => void;
  quickMode: boolean;
  /** 화면이 재는 홈 인디케이터 높이. 리스트가 화면 끝까지 흐르므로 여기서 띄운다. */
  bottomInset: number;
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  onTap: (item: Item) => void;
  onDragStart: (payload: DragPayload) => void;
  onDragEnd: (payload: DragPayload, absoluteX: number) => void;
}

export function ItemPickGrid({
  list,
  selectedIds,
  filter,
  onFilterChange,
  quickMode,
  bottomInset,
  ghostX,
  ghostY,
  onTap,
  onDragStart,
  onDragEnd,
}: Props) {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  // 증강 그리드와 같은 이유로 lazy initializer — 인스턴스가 매 렌더 바뀌면
  // 셀의 blocksExternalGesture 참조가 끊긴다.
  const [listGesture] = useState(() => Gesture.Native());
  const [gridW, setGridW] = useState(0);

  // floor 하지 않는다 — 버린 소수가 8열만큼 쌓여 행 끝에 남고, 그만큼 오른쪽
  // 여백만 넓어진다(왼쪽은 padding 그대로라 좌우가 안 맞는다).
  const cell =
    gridW > 0 ? Math.max(36, (gridW - PAD * 2 - GAP * (COLS - 1)) / COLS) : 48;

  return (
    <View style={styles.left}>
      <ItemFilterBar activeFilter={filter} onChange={onFilterChange} />

      <GestureDetector gesture={listGesture}>
        <FlatList
          data={list}
          numColumns={COLS}
          keyExtractor={(it) => it.id}
          style={[styles.grid, { borderColor: colors.border.subtle }]}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: PAD + bottomInset },
          ]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
          // 검색 키보드가 떠 있어도 셀 탭·롱프레스가 첫 번째부터 먹히도록.
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="caption" color="tertiary">
                {translate("empty")}
              </ThemedText>
            </View>
          }
          // 담긴 표시(체크)가 붙도록 — selectedIds 는 갱신마다 새 Set 이다.
          extraData={selectedIds}
          renderItem={({ item }) => {
            const picked = selectedIds.has(item.id);
            return (
              <DragCell
                payload={{ kind: "item", item }}
                enabled={!quickMode}
                listGesture={listGesture}
                ghostX={ghostX}
                ghostY={ghostY}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              >
                <Pressable
                  onPress={() => quickMode && onTap(item)}
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      width: cell,
                      height: cell,
                      borderWidth: picked ? 2 : 1,
                      borderColor: picked
                        ? colors.accent.default
                        : colors.border.subtle,
                      backgroundColor: picked
                        ? colors.accent.subtle
                        : colors.surface.raised,
                      opacity: pressed && quickMode ? 0.7 : 1,
                    },
                  ]}
                >
                  <RemoteImage
                    uri={itemImageUrl(item.imageKey)}
                    recyclingKey={item.id}
                    style={{
                      width: cell - 4,
                      height: cell - 4,
                      borderRadius: Radius.sm,
                    }}
                    contentFit="contain"
                  />
                  {picked && (
                    <View
                      style={[
                        styles.check,
                        { backgroundColor: colors.accent.default },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.checkMark,
                          { color: colors.accent.onAccent },
                        ]}
                      >
                        ✓
                      </ThemedText>
                    </View>
                  )}
                </Pressable>
              </DragCell>
            );
          }}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  left: { flex: 1, flexDirection: "row", minWidth: 0 },

  grid: {
    flex: 1,
    minWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  // flexGrow — 결과가 없을 때 ListEmptyComponent 의 flex:1 이 살아나 안내가 보인다.
  gridContent: { flexGrow: 1, padding: PAD, gap: GAP },
  gridRow: { gap: GAP },
  empty: { flex: 1, alignItems: "center", paddingTop: Spacing.six },

  cell: {
    borderRadius: Radius.sm,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  check: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { fontSize: 8, lineHeight: 12, fontWeight: "700" },
});
