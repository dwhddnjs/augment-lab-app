import { View, type ViewProps } from 'react-native';

import { type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SurfaceVariant = keyof ThemeColors['surface'];

export type ThemedViewProps = ViewProps & {
  surface?: SurfaceVariant;
  elevation?: 0 | 1 | 2 | 3;
};

export function ThemedView({ style, surface = 'base', elevation, ...otherProps }: ThemedViewProps) {
  const { colors, elevation: elevationTokens } = useTheme();

  const elevationLevels = [
    elevationTokens.level0,
    elevationTokens.level1,
    elevationTokens.level2,
    elevationTokens.level3,
  ];

  return (
    <View
      style={[
        { backgroundColor: colors.surface[surface] },
        elevation !== undefined ? elevationLevels[elevation] : undefined,
        style,
      ]}
      {...otherProps}
    />
  );
}
