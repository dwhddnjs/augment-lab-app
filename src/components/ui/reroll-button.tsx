/**
 * RerollButton — 카드 아래 원형 리롤 버튼. 칼바람·클래식·아레나 공용.
 *
 * 카드당 1회만 쓸 수 있고, 소진되면(used) 가라앉은 표면 + 흐린 아이콘으로 잠긴 상태를
 * 보여준다. 픽 연출이 도는 동안(disabled)에는 아직 안 쓴 버튼도 흐려진다 — 눌러도
 * 소용없는 순간임을 알려야 해서다. 소진된 버튼은 이미 가라앉아 있으므로 더 흐리지 않는다.
 */
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface Props {
  /** 이번 라운드에 이미 리롤했다 — 영구 잠금. */
  used: boolean;
  /** 픽·리롤 연출 중이라 지금은 못 누른다. */
  disabled?: boolean;
  onPress: () => void;
}

export function RerollButton({ used, disabled, onPress }: Props) {
  const { colors } = useTheme();
  const locked = used || disabled;

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.button,
        used
          ? {
              backgroundColor: colors.surface.sunken,
              borderColor: colors.border.subtle,
            }
          : {
              backgroundColor: colors.surface.raised,
              borderColor: colors.border.strong,
            },
        { opacity: disabled && !used ? 0.35 : pressed ? 0.65 : 1 },
      ]}
    >
      <MaterialCommunityIcons
        name="refresh"
        size={18}
        color={used ? colors.text.disabled : colors.text.primary}
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
