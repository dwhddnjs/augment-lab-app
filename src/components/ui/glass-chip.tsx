/**
 * GlassChip — 헤더/HUD용 플로팅 글라스 칩(pill).
 *
 * 네이티브 리퀴드글래스(blur)를 베이스로 쓰되, 어두운 hero 배경 위에서는 "비칠 콘텐츠"가
 * 없어 유리 질감이 드러나지 않으므로 가시성 fill + 상단 sheen(광택)으로 질감을 보강한다.
 * 단, 과하게 튀던 드롭섀도/민트 글로우와 차등 림 라이트는 쓰지 않는다.
 *
 *   - iOS 26+ : GlassSurface(isInteractive)의 네이티브 리퀴드글래스 + fill/sheen
 *   - 폴백    : GlassSurface(BlurView) + fill/sheen + 헤어라인 테두리
 *
 * - variant='glass'  : 중성(무채색) 글래스 (기본 — 나가기/건너뛰기/Picks 등)
 * - variant='accent' : accent 틴트 글래스 (주요 액션 — 완료 등). 글로우 없이 구분만.
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

export function GlassChip({
  children,
  onPress,
  variant = 'glass',
  style,
}: GlassChipProps) {
  const { colors } = useTheme();
  const isAccent = variant === 'accent';

  const body = (
    <GlassSurface
      glassStyle="regular"
      isInteractive={!!onPress}
      tintColor={isAccent ? colors.accent.default : undefined}
      style={[
        styles.surface,
        { borderColor: isAccent ? colors.accent.default : colors.glass.rim },
      ]}
    >
      {/* 가시성 채움 — 어두운 배경에서도 유리알 질감이 드러나도록 */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isAccent
              ? colors.accent.subtle
              : colors.glass.fill,
          },
        ]}
        pointerEvents="none"
      />
      {/* 상단 광택 — 리퀴드글래스 특유의 빛 반사 */}
      <LinearGradient
        colors={[colors.glass.sheen, 'transparent']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        locations={[0, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.inner}>{children}</View>
    </GlassSurface>
  );

  const wrapped = <View style={style}>{body}</View>;

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
  surface: {
    borderRadius: Radius.full,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 1,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
