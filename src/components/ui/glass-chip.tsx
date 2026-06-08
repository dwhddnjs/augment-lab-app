/**
 * GlassChip — 헤더/HUD용 플로팅 글라스 칩(pill).
 *
 * 어두운 hero 배경 위에서는 네이티브 리퀴드글라스만으로는 "비칠 콘텐츠"가 없어
 * 유리 질감이 드러나지 않는다. 그래서 GlassSurface(블러) 위에 유리 질감을 직접
 * 연출한다:
 *   1. glass.fill 반투명 채움
 *   2. 상단 sheen 그라디언트(빛 광택)
 *   3. 차등 림 라이트(상단 가장자리가 밝게 빛을 받는 유리 테두리)
 *
 * - variant='glass'  : 글라스 + 흰 림 (기본)
 * - variant='accent' : accent.subtle 채움 + accent 림 + accent 글로우 (강조 액션)
 *
 * onPress가 없으면 정적 칩(라운드 인디케이터·제목 등), 있으면 눌림 피드백.
 */
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GlassSurface } from './glass-surface';

interface GlassChipProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'glass' | 'accent';
  style?: StyleProp<ViewStyle>;
}

export function GlassChip({ children, onPress, variant = 'glass', style }: GlassChipProps) {
  const { colors } = useTheme();
  const isAccent = variant === 'accent';

  // 칩을 배경에서 띄우는 그림자/글로우. accent는 민트 글로우로 강조.
  const glow: ViewStyle = isAccent
    ? {
        shadowColor: colors.accent.default,
        shadowOpacity: 0.5,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }
    : {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      };

  const inner = (
    <View
      style={[
        styles.inner,
        {
          borderTopColor: isAccent ? colors.accent.hover : colors.glass.rimTop,
          borderLeftColor: isAccent ? colors.accent.default : colors.glass.rim,
          borderRightColor: isAccent ? colors.accent.default : colors.glass.rim,
          borderBottomColor: isAccent ? colors.accent.default : colors.glass.rim,
        },
      ]}
    >
      {/* 상단 광택 — 위에서 빛이 닿는 유리 표면 */}
      <LinearGradient
        colors={[colors.glass.sheen, 'transparent']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        locations={[0, 0.65]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );

  const body = isAccent ? (
    <View style={[styles.surface, { backgroundColor: colors.accent.subtle }]}>{inner}</View>
  ) : (
    <GlassSurface glassStyle="clear" style={styles.surface}>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass.fill }]}
        pointerEvents="none"
      />
      {inner}
    </GlassSurface>
  );

  const wrapped = <View style={[styles.shadow, glow, style]}>{body}</View>;

  if (!onPress) return wrapped;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      {wrapped}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: Radius.full,
    // Android 그림자가 라운드를 따라가도록 배경 필요는 surface가 처리
  },
  surface: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
