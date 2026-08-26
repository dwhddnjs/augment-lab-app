import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentImage } from "@/components/ui/augment-image";
import { AugmentRarityGlyphs, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useRarityColors } from "@/hooks/use-rarity-colors";

interface Props {
  augment: Augment;
  size: number;
}

/** 증강 카드 — 아이콘 + 이름 (박스 없음). */
export function AugmentCard({ augment, size }: Props) {
  const borderColor = useRarityColors()[augment.rarity].border;
  return (
    <View style={[styles.card, { width: size }]}>
      <AugmentImage
        iconPath={augment.iconPath}
        size={size}
        tint={borderColor}
        fallbackGlyph={AugmentRarityGlyphs[augment.rarity]}
        recyclingKey={augment.id}
      />
      <ThemedText type="caption" color="secondary" numberOfLines={2} style={styles.name}>
        {augment.name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: Spacing.one },
  name: { textAlign: "center", fontSize: 11, lineHeight: 14 },
});
