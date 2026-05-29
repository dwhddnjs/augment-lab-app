import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  round: number;
  total?: number;
}

export function RoundIndicator({ round, total = 4 }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i < round ? colors.accent.default : colors.border.default,
            },
          ]}
        />
      ))}
      <ThemedText type="caption" color="secondary" style={{ marginLeft: Spacing.two }}>
        {round} / {total}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
});
