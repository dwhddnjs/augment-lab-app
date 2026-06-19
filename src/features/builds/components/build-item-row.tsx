import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { itemImageUrl } from "@/lib/ddragon";
import type { Item } from "@/features/items/types";

interface Props {
  items: Item[];
  /** 섹션 헤더 라벨(개수는 내부에서 덧붙임). */
  label: string;
}

/** 빌드 상세 — 아이템 아이콘 행. */
export function BuildItemRow({ items, label }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {label} {items.length}
      </ThemedText>
      <View style={styles.itemsRow}>
        {items.map((item, i) => (
          <View
            key={`${item.id}-${i}`}
            style={[
              styles.itemTile,
              {
                backgroundColor: colors.surface.raised,
                borderColor: colors.border.subtle,
              },
            ]}
          >
            <Image
              source={{ uri: itemImageUrl(item.imageKey) }}
              style={styles.itemIcon}
              contentFit="contain"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  itemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  itemTile: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
  },
});
