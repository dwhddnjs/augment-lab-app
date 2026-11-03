/**
 * GlassSurface — 범용 리퀴드글라스/블러 배경 프리미티브.
 *
 * 우선순위:
 *   1. iOS 26+ 네이티브 리퀴드글라스 (expo-glass-effect GlassView)
 *   2. expo-blur BlurView 폴백 (iOS 26 미만)
 *
 * 직접 GlassView / BlurView를 호출하지 말고 이 컴포넌트를 사용할 것.
 */
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * 테두리 없이 쓰는 면의 가장자리. 리퀴드글라스는 가장자리를 스스로 그리지만 BlurView 폴백은 그리지 않아
   * 밝은 배경 위에서 면이 사라진다 — 폴백에서만 hairline 을 긋는다.
   */
  edge?: boolean;
}

/** 블러 강도 — BlurView 폴백 전용. */
const BLUR_INTENSITY = 20;

export function GlassSurface({ children, style, edge }: GlassSurfaceProps) {
  const { mode, colors } = useTheme();

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={mode}
        style={[styles.base, style]}
      >
        {children}
      </GlassView>
    );
  }
  // expo-blur 폴백 (iOS 26 미만)
  return (
    <BlurView
      intensity={BLUR_INTENSITY}
      tint={mode}
      style={[
        styles.base,
        edge && { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border.default },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
