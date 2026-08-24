import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FILTERS, type FilterKey } from "../item-filters";
import { FilterIcon } from "./filter-icon";

/** 세로 필터 사이드 탭 너비 — 그리드/트레이 정렬에 공유. */
export const SIDE_TAB_WIDTH = 44;

interface Props {
  activeFilter: FilterKey;
  onChange: (key: FilterKey) => void;
}

export function ItemFilterBar({ activeFilter, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.sidebar}
      contentContainerStyle={styles.content}
    >
      {FILTERS.map((f) => {
        const active =
          activeFilter === f.key || (f.key === "all" && activeFilter === null);
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key === "all" ? null : active ? null : f.key)}
            style={styles.tab}
            hitSlop={10}
          >
            <FilterIcon
              filter={f}
              color={active ? colors.accent.default : colors.text.tertiary}
              size={22}
            />
            <View
              style={[
                styles.dot,
                { backgroundColor: active ? colors.accent.default : "transparent" },
              ]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDE_TAB_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: "transparent",
    paddingTop: Spacing.one,
  },
  content: {
    gap: Spacing.double,
    paddingBottom: Spacing.three,
    alignItems: "center",
    paddingTop: Spacing.one,
  },
  tab: { alignItems: "center", gap: 3 },
  dot: { width: 4, height: 4, borderRadius: Radius.full },
});
