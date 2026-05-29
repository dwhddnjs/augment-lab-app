import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import type { Augment } from '@/features/augments/types';
import { useTheme } from '@/hooks/use-theme';
import { DraftCardFrame } from './draft-card-frame';
import { RerollButton } from './reroll-button';

export type CardExitMode = 'none' | 'picked' | 'unchosen' | 'reroll';

interface Props {
  augment: Augment;
  index: number;
  cardWidth: number;
  exitMode: CardExitMode;
  disabled: boolean;
  onPick: () => void;
  onReroll: () => void;
  onExitDone?: () => void;
}

export function DraftCard({ augment, index, cardWidth, exitMode, disabled, onPick, onReroll, onExitDone }: Props) {
  const { colors } = useTheme();
  const rotateY = useSharedValue(180);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const translateY = useSharedValue(0);

  const notifyDone = useCallback(() => {
    onExitDone?.();
  }, [onExitDone]);

  // Single effect handles both entry (exitMode === 'none') and exit states
  useEffect(() => {
    if (exitMode === 'none') {
      // Entry / reset animation
      rotateY.value = 180;
      opacity.value = 0;
      scale.value = 0.92;
      translateY.value = 0;
      const delay = index * 120;
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      scale.value = withDelay(delay, withTiming(1, { duration: 400 }));
      rotateY.value = withDelay(delay, withTiming(0, { duration: 500 }));
    } else if (exitMode === 'picked') {
      scale.value = withSequence(
        withTiming(1.06, { duration: 120 }),
        withTiming(1, { duration: 80 }),
      );
    } else if (exitMode === 'unchosen') {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(24, { duration: 300 }, (finished) => {
        if (finished) runOnJS(notifyDone)();
      });
    } else if (exitMode === 'reroll') {
      opacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(-18, { duration: 220 }, (finished) => {
        if (finished) runOnJS(notifyDone)();
      });
    }
    // Shared values (rotateY, opacity, scale, translateY) are stable refs — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitMode, index, notifyDone]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rotateY.value, [90, 0], [0, 1], 'clamp'),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { perspective: 1200 },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const cardHeight = cardWidth * (14 / 9);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={containerStyle}>
        {/* Card back — visible during flip */}
        <View
          style={[
            styles.cardBack,
            {
              width: cardWidth,
              height: cardHeight,
              backgroundColor: colors.surface.raised,
              borderColor: colors.border.default,
            },
          ]}
        />

        {/* Card front */}
        <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
          <Pressable onPress={disabled ? undefined : onPick} disabled={disabled}>
            <DraftCardFrame augment={augment} cardWidth={cardWidth} />
          </Pressable>
        </Animated.View>
      </Animated.View>

      <RerollButton
        onPress={disabled ? () => {} : onReroll}
        disabled={disabled || exitMode !== 'none'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardBack: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
