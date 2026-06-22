/**
 * GlassButtonFallback — GlassButton의 폴백 구현.
 *
 * `@expo/ui/swift-ui`의 네이티브 glass 버튼을 쓸 수 없는 환경
 * (iOS 26 미만 / Android / Expo Go)에서 기존 GlassChip(블러 글래스)으로 렌더한다.
 * iOS 파일(glass-button.ios.tsx)과 기본 파일(glass-button.tsx)이 공유한다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedText } from "@/components/themed/themed-text";
import { GlassChip } from "@/components/ui/glass-chip";
import { useTheme } from "@/hooks/use-theme";

export interface GlassButtonProps {
  /** 버튼 라벨. 생략하면 아이콘 전용 버튼이 된다. */
  label?: string;
  /** iOS SF Symbol 이름 (네이티브 expo-ui Button systemImage 전용) */
  systemImage?: string;
  /** 폴백 GlassChip용 MaterialCommunityIcons 아이콘 이름 */
  fallbackIcon?: string;
  /** 강조 틴트(민트 등). 지정 시 accent 스타일. */
  tint?: string;
  /** 버튼 시맨틱 역할 (네이티브 전용) */
  role?: "default" | "cancel" | "destructive";
  onPress: () => void;
}

export function GlassButtonFallback({
  label,
  fallbackIcon,
  tint,
  onPress,
}: GlassButtonProps) {
  const { colors } = useTheme();
  const isAccent = !!tint;

  return (
    <GlassChip variant={isAccent ? "accent" : "glass"} onPress={onPress}>
      {fallbackIcon ? (
        <MaterialCommunityIcons
          name={
            fallbackIcon as React.ComponentProps<
              typeof MaterialCommunityIcons
            >["name"]
          }
          size={18}
          color={isAccent ? colors.accent.default : colors.text.secondary}
        />
      ) : null}
      {label ? (
        <ThemedText type="label" color={isAccent ? "accent" : "secondary"}>
          {label}
        </ThemedText>
      ) : null}
    </GlassChip>
  );
}
