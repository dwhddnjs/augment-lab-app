/**
 * ArenaRerollButton — 카드 아래 원형 리롤 버튼. 카드당 1회만 쓸 수 있고,
 * 소진되면(rerolled) 가라앉은 표면 + 흐린 아이콘으로 잠긴 상태를 보여준다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  rerolled: boolean;
  disabled?: boolean;
  onPress: () => void;
  /** 호출부별 추가 스타일(예: 애니메이션 중 흐리게). */
  style?: StyleProp<ViewStyle>;
}

export function ArenaRerollButton({
  rerolled,
  disabled,
  onPress,
  style,
}: Props) {
  const { colors } = useTheme();
  const locked = rerolled || disabled;

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      style={[
        styles.button,
        {
          backgroundColor: rerolled
            ? colors.surface.sunken
            : colors.surface.raised,
          borderColor: rerolled ? colors.border.subtle : colors.border.strong,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name="refresh"
        size={18}
        color={rerolled ? colors.text.disabled : colors.text.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
