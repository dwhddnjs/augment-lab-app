import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import { AugmentRarityColors, AugmentRarityGlyphs, Radius, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";

interface Props {
  augment: Augment;
  /** 아이콘 박스 배경(보통 colors.surface.sunken). */
  sunkenBg: string;
  size: number;
}

/** 증강 카드 — 희귀도 테두리 아이콘 + 이름. */
export function AugmentCard({ augment, sunkenBg, size }: Props) {
  const borderColor = AugmentRarityColors[augment.rarity].border;
  return (
    <View style={[styles.card, { width: size }]}>
      <View
        style={[
          styles.iconBox,
          { width: size, height: size, borderColor, backgroundColor: sunkenBg },
        ]}
      >
        <AugmentImage
          iconPath={augment.iconPath}
          size={size}
          tint={borderColor}
          fallbackGlyph={AugmentRarityGlyphs[augment.rarity]}
          recyclingKey={augment.id}
        />
      </View>
      <ThemedText type="caption" color="secondary" numberOfLines={2} style={styles.name}>
        {augment.name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: Spacing.one },
  iconBox: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  name: { textAlign: "center", fontSize: 11, lineHeight: 14 },
});
