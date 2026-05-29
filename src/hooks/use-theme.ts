/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Elevation, Radius, Theme, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const mode = scheme === 'unspecified' ? 'light' : scheme;

  return {
    mode,
    colors: Theme[mode],
    typography: Typography,
    radius: Radius,
    elevation: Elevation,
  };
}
