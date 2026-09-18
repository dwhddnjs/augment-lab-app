import { useColorScheme } from 'react-native';

import { Theme } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

export function useTheme() {
  const { preference } = useThemePreference();
  const scheme = useColorScheme();
  const system = scheme === 'unspecified' || scheme == null ? 'light' : scheme;
  // 사용자가 'system'을 고르면 기기 설정을 따르고, 아니면 선택값으로 강제 고정.
  const mode = preference === 'system' ? system : preference;

  return { mode, colors: Theme[mode] };
}
