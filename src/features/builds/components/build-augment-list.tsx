import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { ThemedView } from "@/components/themed/themed-view";
import {
  AugmentRarityColors,
  HeroOverlay,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useTheme } from "@/hooks/use-theme";
import { cleanAugmentDescription } from "@/lib/augment-text";
import { AugmentTile } from "./augment-tile";

interface Props {
  augments: Augment[];
  /** 섹션 헤더 라벨(개수는 내부에서 덧붙임). */
  label: string;
}

/** 빌드 상세 — 증강 목록(희귀도 타일 + 이름 + 설명). */
export function BuildAugmentList({ augments, label }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {label} {augments.length}
      </ThemedText>
      {augments.map((aug, i) => (
        <ThemedView
          key={`${aug.id}-${i}`}
          surface="raised"
          style={[
            styles.augmentRow,
            {
              borderColor: colors.border.subtle,
              borderLeftColor: AugmentRarityColors[aug.rarity].border,
            },
          ]}
        >
          <AugmentTile
            augment={aug}
            size={48}
            background={HeroOverlay.cardBase}
          />
          <View style={styles.augmentBody}>
            <ThemedText type="label" style={{ fontWeight: "700" }}>
              {aug.name}
            </ThemedText>
            <ThemedText type="caption" color="secondary">
              {cleanAugmentDescription(aug.description)}
            </ThemedText>
          </View>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  augmentRow: {
    flexDirection: "row",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
  },
  augmentBody: {
    flex: 1,
    gap: Spacing.one,
  },
});
