/**
 * ArenaReforgeCard — 재련(R8) 옵션 카드. 특수 증강(증강 강화·증강 슬롯 획득·
 * 프리즘 능력치 모루 등)을 골드 등급 프레임으로 렌더한다.
 */
import { Pressable, View, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { RarityCardFrame } from "@/components/ui/rarity-card-frame";
import { Spacing } from "@/constants/theme";
import type { ArenaSpecialAugment } from "@/features/arena/types";

interface Props {
  special: ArenaSpecialAugment;
  cardWidth: number;
  disabled?: boolean;
  onPick: () => void;
}

export function ArenaReforgeCard({
  special,
  cardWidth,
  disabled,
  onPick,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Animated.View key={special.id} entering={FadeIn.duration(220)}>
        <Pressable onPress={disabled ? undefined : onPick} disabled={disabled}>
          {/* 특수 증강은 등급이 없어 골드 프레임으로 통일해 렌더한다. */}
          <RarityCardFrame
            augment={{ ...special, rarity: "gold" }}
            cardWidth={cardWidth}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Spacing.double,
  },
});
