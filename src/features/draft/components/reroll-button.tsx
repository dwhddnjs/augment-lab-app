import { Pressable, StyleSheet } from "react-native";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { SynergyIcon } from "./synergy-icon";

interface Props {
  onPress: () => void;
  disabled?: boolean;
  // Already rerolled this round — render in the disabled color and lock further use.
  used?: boolean;
}

export function RerollButton({ onPress, disabled, used }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
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
      <SynergyIcon
        name="refresh"
        size={18}
        color={used ? colors.text.disabled : colors.text.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
