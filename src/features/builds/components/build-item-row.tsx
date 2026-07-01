import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { IconNameCell } from "@/components/ui/icon-name-cell";
import { Spacing } from "@/constants/theme";
import type { Item } from "@/features/items/types";
import { itemImageUrl } from "@/lib/ddragon";

interface Props {
  items: Item[];
  /** 섹션 헤더 라벨(개수는 내부에서 덧붙임). */
  label: string;
}

/** 빌드 상세 — 아이템 아이콘 + 이름 셀. */
export function BuildItemRow({ items, label }: Props) {
  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {label} {items.length}
      </ThemedText>
      <View style={styles.itemsRow}>
        {items.map((item, i) => (
          <IconNameCell
            key={`${item.id}-${i}`}
            uri={itemImageUrl(item.imageKey)}
            recyclingKey={item.id}
            name={item.name}
          />
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
    gap: Spacing.three,
  },
});
