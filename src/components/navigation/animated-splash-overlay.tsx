import { useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Brand } from '@/constants/theme';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

const splashKeyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
    opacity: 1,
  },
  20: {
    opacity: 1,
  },
  70: {
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 0,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

/** 네이티브 스플래시가 걷힌 뒤 같은 배경색 판을 한 번 페이드아웃시켜 첫 화면으로 넘긴다. */
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.overlay}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand.splashBg,
    zIndex: 1000,
  },
});
