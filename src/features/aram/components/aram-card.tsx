import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
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

const DEFAULT_EASING = Easing.inOut(Easing.quad);
const FLIP_EASING = Easing.out(Easing.cubic);

// Reanimated defaults every animation to ReduceMotion.System, so on a device with
// iOS "동작 줄이기"(Reduce Motion) on, every withTiming/withDelay here is skipped and
// the value snaps to its target — the card just appears, no animation at all.
// Opt out explicitly and drop only the rotation, the part that actually triggers
// motion sensitivity, so those devices still get the fade instead of nothing.
const timing = (toValue: number, duration: number, easing = DEFAULT_EASING) =>
  withTiming(toValue, { duration, easing, reduceMotion: ReduceMotion.Never });

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

export function AramCard({
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
  const reduceMotion = useReducedMotion();
  const flipIn = entryMode === "flip" && !reduceMotion;

  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(flipIn ? 90 : 0);

  useEffect(() => {
    if (exitMode === "none") {
      if (flipIn) {
        // New round: each card flips face-up, staggered across the row.
        const delay = index * 90;
        opacity.value = 0;
        scale.value = 1;
        rotateY.value = 90;
        opacity.value = withDelay(delay, timing(1, 160), ReduceMotion.Never);
        rotateY.value = withDelay(
          delay,
          timing(0, 380, FLIP_EASING),
          ReduceMotion.Never,
        );
      } else {
        // Reroll replacement (and every card under Reduce Motion): quick fade + scale in.
        rotateY.value = 0;
        opacity.value = 0;
        scale.value = 0.96;
        opacity.value = timing(1, 200);
        scale.value = timing(1, 240);
      }
    } else if (exitMode === "picked") {
      scale.value = withSequence(
        ReduceMotion.Never,
        timing(1.05, 120),
        timing(1, 90),
      );
    } else if (exitMode === "unchosen") {
      opacity.value = timing(0, 280);
      scale.value = timing(0.94, 280);
    } else if (exitMode === "reroll") {
      opacity.value = timing(0, 200);
      scale.value = timing(0.96, 200);
    }
    // Shared values are stable refs — intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitMode, index, flipIn]);

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
