/**
 * GlassButtonFallback — GlassButton의 폴백 구현 (iOS 26 미만 / Expo Go).
 *
 * 리퀴드글래스가 없는 환경에서 블러 글래스는 배경이 단색(어두운 게임 화면 / 밝은 splash)이라
 * 유리 질감이 드러나지 않고 뿌연 회색 덩어리로 튄다. 그래서 폴백은 유리 흉내를
 * 버리고 불투명 solid 원형 아이콘 버튼으로 간다(design-system 미니멀).
 * `glass-button.tsx`의 네이티브 리퀴드글래스와 역할만 맞춘다.
 *
 *   - 아이콘 전용     : 44×44 정원형 (iOS 네이티브 글래스 버튼과 크기 통일)
 *   - label 포함      : 캡슐(pill)
 *   - tint(주요 액션) : 채워진 accent 원 + onAccent 아이콘으로 위계 부여
 *   - role=destructive: danger 색 아이콘
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed/themed-text";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface GlassButtonProps {
  /** 버튼 라벨. 생략하면 아이콘 전용(원형) 버튼이 된다. */
  label?: string;
  /** iOS SF Symbol 이름 (네이티브 expo-ui Button systemImage 전용) */
  systemImage?: string;
  /** 폴백용 MaterialCommunityIcons 아이콘 이름 */
  fallbackIcon?: string;
  /** 강조 틴트(민트 등). 지정 시 채워진 accent 버튼(주요 액션). */
  tint?: string;
  /** 버튼 시맨틱 역할. 폴백은 destructive를 danger 색으로 반영한다. */
  role?: "default" | "cancel" | "destructive";
  onPress: () => void;
}

export function GlassButtonFallback({
  label,
  fallbackIcon,
  tint,
  role,
  onPress,
}: GlassButtonProps) {
  const { colors } = useTheme();
  const isProminent = !!tint; // 완료 등 주요 액션 — 채워진 민트 원
  const isDestructive = role === "destructive";
  const iconOnly = !label;

  const backgroundColor = isProminent
    ? colors.accent.default
    : colors.surface.raised;
  const iconColor = isProminent
    ? colors.accent.onAccent
    : isDestructive
      ? colors.status.danger.default
      : colors.text.secondary;
  const borderColor = isProminent ? "transparent" : colors.border.subtle;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        iconOnly ? styles.circle : styles.pill,
        { backgroundColor, borderColor, opacity: pressed ? 0.7 : 1 },
        Elevation.level1,
      ]}
    >
      {fallbackIcon ? (
        <MaterialCommunityIcons
          name={
            fallbackIcon as React.ComponentProps<
              typeof MaterialCommunityIcons
            >["name"]
          }
          size={22}
          color={iconColor}
        />
      ) : null}
      {label ? (
        <ThemedText type="label" style={{ color: iconColor }}>
          {label}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
  },
  pill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
});
