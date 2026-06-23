import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Spacing } from "@/constants/theme";
import type { Augment } from "@/features/augments/types";
import { RarityCardFrame } from "@/components/ui/rarity-card-frame";
import { RerollButton } from "./reroll-button";

export type CardExitMode = "none" | "picked" | "unchosen" | "reroll";
// How a freshly mounted card appears: 'flip' for a new round, 'fade' after a reroll.
export type CardEntryMode = "flip" | "fade";

interface Props {
  augment: Augment;
  index: number;
  cardWidth: number;
  exitMode: CardExitMode;
  entryMode: CardEntryMode;
  disabled: boolean;
  rerolled: boolean;
  onPick: () => void;
  onReroll: () => void;
}

export function DraftCard({
  augment,
  index,
  cardWidth,
  exitMode,
  entryMode,
  disabled,
  rerolled,
  onPick,
  onReroll,
}: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(entryMode === "flip" ? 90 : 0);

  useEffect(() => {
    if (exitMode === "none") {
      if (entryMode === "flip") {
        // New round: each card flips face-up, staggered across the row.
        const delay = index * 90;
        opacity.value = 0;
        scale.value = 1;
        rotateY.value = 90;
        opacity.value = withDelay(delay, withTiming(1, { duration: 160 }));
        rotateY.value = withDelay(
          delay,
          withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }),
        );
      } else {
        // Reroll replacement: quick fade + scale in.
        rotateY.value = 0;
        opacity.value = 0;
        scale.value = 0.96;
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withTiming(1, { duration: 240 });
      }
    } else if (exitMode === "picked") {
      scale.value = withSequence(
        withTiming(1.05, { duration: 120 }),
        withTiming(1, { duration: 90 }),
      );
    } else if (exitMode === "unchosen") {
      opacity.value = withTiming(0, { duration: 280 });
      scale.value = withTiming(0.94, { duration: 280 });
    } else if (exitMode === "reroll") {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.96, { duration: 200 });
    }
    // Shared values are stable refs — intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitMode, index, entryMode]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { perspective: 900 },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.cardFlip, containerStyle]}>
        <Pressable onPress={disabled ? undefined : onPick} disabled={disabled}>
          <RarityCardFrame augment={augment} cardWidth={cardWidth} />
        </Pressable>
      </Animated.View>

      <RerollButton
        onPress={disabled ? () => {} : onReroll}
        disabled={disabled || rerolled || exitMode !== "none"}
        used={rerolled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Spacing.double,
  },
  cardFlip: {
    backfaceVisibility: "hidden",
  },
});
