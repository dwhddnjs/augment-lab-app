import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentTile } from "@/components/ui/augment-tile";
import { HeroOverlay, Spacing } from "@/constants/theme";
import { useAugmentName } from "@/features/augments/hooks/use-augments";
import type { Augment } from "@/features/augments/types";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  augment: Augment;
  size: number;
}

/**
 * 증강 카드 — 어두운 타일에 담은 아이콘 + 이름. 아이콘은 어두운 배경 자산이라 판 없이 밝은 배경에 올리면
 * 튀어 보인다. 픽 현황 Drawer·빌드 상세와 같은 타일이다.
 */
export function AugmentCard({ augment, size }: Props) {
  const borderColor = useRarityColors()[augment.rarity].border;
  // 라이트 모드 등급색은 12pt 글자 대비(4.5:1)에 못 미쳐 이름은 기본 보조색으로 둔다(AugmentRarityColorsLight 주석).
  const isDark = useTheme().mode === "dark";
  const augmentName = useAugmentName();
  return (
    <View style={[styles.card, { width: size }]}>
      <AugmentTile
        iconPath={augment.iconPath}
        rarity={augment.rarity}
        size={size}
        background={HeroOverlay.cardBase}
        recyclingKey={augment.id}
      />
      <ThemedText
        type="caption"
        color="secondary"
        numberOfLines={2}
        style={[styles.name, isDark && { color: borderColor }]}
      >
        {augmentName(augment)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: Spacing.one },
  name: { textAlign: "center", fontSize: 11, lineHeight: 14 },
});
