import { View, type ViewProps } from 'react-native';

import { type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThemedViewProps = ViewProps & {
  surface?: keyof ThemeColors['surface'];
};

export function ThemedView({ style, surface = 'base', ...otherProps }: ThemedViewProps) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.surface[surface] }, style]} {...otherProps} />;
}
