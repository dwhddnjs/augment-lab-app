import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { AugmentTile } from "@/components/ui/augment-tile";
import { DetailCardRow } from "@/components/ui/detail-card-row";
import { HeroOverlay, Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { useRarityColors } from "@/hooks/use-rarity-colors";
import { cleanAugmentDescription } from "@/lib/augment-text";

interface Props {
  augments: Augment[];
  /** 섹션 헤더 라벨(개수는 내부에서 덧붙임). */
  label: string;
}

/** 빌드 상세 — 증강 목록(희귀도 카드 행 + 이름 + 설명). */
export function BuildAugmentList({ augments, label }: Props) {
  const rarityColors = useRarityColors();

  return (
    <View style={styles.section}>
      <ThemedText type="label" color="secondary">
        {label} {augments.length}
      </ThemedText>
      {augments.map((aug, i) => (
        <DetailCardRow
          key={`${aug.id}-${i}`}
          accentColor={rarityColors[aug.rarity].border}
          icon={
            <AugmentTile
              iconPath={aug.iconPath}
              rarity={aug.rarity}
              recyclingKey={aug.id}
              size={48}
              background={HeroOverlay.cardBase}
            />
          }
          title={aug.name}
          description={cleanAugmentDescription(aug.description)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
});
