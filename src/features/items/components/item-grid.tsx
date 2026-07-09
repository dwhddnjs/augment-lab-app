import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { RemoteImage } from "@/components/ui/remote-image";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { itemImageUrl } from "@/lib/ddragon";
import type { Item } from "../types";
import { TRAY_HEIGHT } from "./item-slot-grid";

const CELL_GAP = Spacing.one; // 4px

interface Props {
  /** NUM_COLS씩 묶고 마지막 행을 null로 패딩한 그리드. */
  rows: (Item | null)[][];
  cellSize: number;
  selectedIds: string[];
  onItemPress: (item: Item) => void;
  onGridLayout: (e: LayoutChangeEvent) => void;
}

export function ItemGrid({
  rows,
  cellSize,
  selectedIds,
  onItemPress,
  onGridLayout,
}: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.gridArea,
        {
          borderColor: colors.border.subtle,
          borderRightWidth: 1,
          borderTopWidth: 1,
          borderLeftWidth: 1,
        },
      ]}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        onLayout={onGridLayout}
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
                  onPress={() => onItemPress(item)}
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
                  <RemoteImage
                    uri={itemImageUrl(item.imageKey)}
                    recyclingKey={item.id}
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
  );
}

const styles = StyleSheet.create({
  gridArea: {
    flex: 1,
    minWidth: 0,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.two,
  },
  // 하단 트레이(TRAY_HEIGHT)에 가려지지 않도록 트레이 높이 + 상하 여백만큼 패딩
  gridContent: {
    gap: CELL_GAP,
    paddingBottom: TRAY_HEIGHT + Spacing.two * 2,
    paddingTop: Spacing.two,
  },
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
});
