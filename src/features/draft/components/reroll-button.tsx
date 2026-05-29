import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export function RerollButton({ onPress, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: colors.surface.raised,
          borderColor: colors.border.default,
          opacity: disabled ? 0.35 : pressed ? 0.65 : 1,
        },
      ]}
    >
      <Image
        source="sf:arrow.counterclockwise"
        style={styles.icon}
        tintColor={colors.text.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 20,
    height: 20,
  },
});
