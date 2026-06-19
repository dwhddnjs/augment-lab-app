/**
 * ItemStatPanel — 챔피언 기본 스탯 + 아이템 합산 스탯을 행으로 표시.
 * 글래스 배경 패널.
 */
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { GlassSurface } from "@/components/ui/glass-surface";
import { Radius, Spacing } from "@/constants/theme";
import type { ChampionStats } from "@/features/champions/types";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import {
  computeStats,
  STAT_DISPLAY_ORDER,
  STAT_LABELS,
  type ComputedStats,
} from "../stats";
import type { ItemStats } from "../types";

interface ItemStatPanelProps {
  baseStats: ChampionStats;
  itemStatsList: ItemStats[];
}

export function ItemStatPanel({
  baseStats,
  itemStatsList,
}: ItemStatPanelProps) {
  const { colors } = useTheme();
  const { locale } = useLocale();

  const computed: ComputedStats = computeStats(baseStats, itemStatsList);

  return (
    <GlassSurface
      style={[
        styles.container,
        { borderColor: colors.border.subtle, borderWidth: 1 },
      ]}
    >
      <View style={styles.rows}>
        {STAT_DISPLAY_ORDER.map((key) => {
          const meta = STAT_LABELS[key];
          const { base, added, total } = computed[key];
          const unit = meta.unit ?? "";
          const decimals = meta.decimals ?? 0;

          // 마나류는 마나 없는 챔피언에선 숨김
          if ((key === "mp" || key === "mpregen") && total === 0) return null;
          // 코어 스탯은 항상 표시, 부가 스탯은 값이 있을 때만 표시
          if (!meta.core && total === 0 && added === 0) return null;

          // 아이템으로 추가된 양이 있으면 "총합 (+추가분)"
          const showAdded = added > 0;
          // 공격 속도는 총합을 절대값으로 보이되, 추가분은 아이템 % 증가율로 표기
          // (added = base × Σ% 이므로 added/base = Σ%). 그 외는 동일 단위로.
          const addedText =
            key === "attackspeed" && base > 0
              ? `+${formatNumber((added / base) * 100, 0)}%`
              : `+${formatNumber(added, decimals)}${unit}`;

          return (
            <View key={key} style={styles.row}>
              <ThemedText type="caption" color="secondary" numberOfLines={1}>
                {meta[locale]}
              </ThemedText>
              <ThemedText type="caption" color="primary">
                {formatNumber(total, decimals)}
                {unit}
                {showAdded && (
                  <ThemedText type="caption" color="accent">
                    {" "}
                    ({addedText})
                  </ThemedText>
                )}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </GlassSurface>
  );
}

/** 소수 자릿수를 적용하되 불필요한 .0은 제거 */
function formatNumber(value: number, decimals: number): string {
  if (decimals === 0) return Math.round(value).toString();
  return parseFloat(value.toFixed(decimals)).toString();
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  rows: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.half,
  },
});
