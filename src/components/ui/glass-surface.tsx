/**
 * GlassSurface — 범용 리퀴드글라스/블러 배경 프리미티브.
 *
 * 우선순위:
 *   1. iOS 26+ 네이티브 리퀴드글라스 (expo-glass-effect GlassView)
 *   2. expo-blur BlurView 폴백
 *   3. colors.surface.overlay 단색 최종 폴백
 *
 * 직접 GlassView / BlurView를 호출하지 말고 이 컴포넌트를 사용할 것.
 */
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 블러 강도 — BlurView 폴백에서만 사용 (default 20) */
  intensity?: number;
  /** GlassView glassEffectStyle (default 'regular') */
  glassStyle?: 'clear' | 'regular' | 'none';
}

export function GlassSurface({
  children,
  style,
  intensity = 20,
  glassStyle = 'regular',
}: GlassSurfaceProps) {
  const { mode } = useTheme();

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        colorScheme={mode === 'dark' ? 'dark' : 'light'}
        style={[styles.base, style]}
      >
        {children}
      </GlassView>
    );
  }
  // expo-blur 폴백 (iOS 구버전, 안드로이드)
  return (
    <BlurView
      intensity={intensity}
      tint={mode === 'dark' ? 'dark' : 'light'}
      style={[styles.base, style]}
    >
      {children}
    </BlurView>
  );
}

/** 글래스 효과가 불가능한 환경을 위한 단색 폴백 래퍼 */
export function GlassSurfaceFallback({
  children,
  style,
}: Pick<GlassSurfaceProps, 'children' | 'style'>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.base, { backgroundColor: colors.surface.overlay }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
