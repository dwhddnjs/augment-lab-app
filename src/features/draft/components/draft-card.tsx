import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import type { Augment } from '@/features/augments/types';
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
}

export function DraftCard({ augment, index, cardWidth, exitMode, disabled, onPick, onReroll }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  // Fade in/out per state — no flip. New augments remount (keyed by id) and fade in.
  useEffect(() => {
    if (exitMode === 'none') {
      opacity.value = 0;
      scale.value = 0.96;
      const delay = index * 70;
      opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
      scale.value = withDelay(delay, withTiming(1, { duration: 320 }));
    } else if (exitMode === 'picked') {
      scale.value = withSequence(withTiming(1.05, { duration: 120 }), withTiming(1, { duration: 90 }));
    } else if (exitMode === 'unchosen') {
      opacity.value = withTiming(0, { duration: 280 });
      scale.value = withTiming(0.94, { duration: 280 });
    } else if (exitMode === 'reroll') {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.96, { duration: 200 });
    }
    // Shared values are stable refs — intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitMode, index]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={containerStyle}>
        <Pressable onPress={disabled ? undefined : onPick} disabled={disabled}>
          <DraftCardFrame augment={augment} cardWidth={cardWidth} />
        </Pressable>
      </Animated.View>

      <RerollButton onPress={disabled ? () => {} : onReroll} disabled={disabled || exitMode !== 'none'} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: Spacing.two,
  },
});
