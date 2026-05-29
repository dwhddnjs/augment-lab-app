import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/navigation/animated-icon';
import { Theme } from '@/constants/theme';

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Theme.dark.accent.default,
    background: Theme.dark.surface.base,
    card: Theme.dark.surface.base,
    text: Theme.dark.text.primary,
    border: Theme.dark.border.default,
    notification: Theme.dark.status.danger.default,
  },
};

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Theme.light.accent.default,
    background: Theme.light.surface.base,
    card: Theme.light.surface.base,
    text: Theme.light.text.primary,
    border: Theme.light.border.default,
    notification: Theme.light.status.danger.default,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <ThemeProvider value={mode === 'dark' ? darkNavTheme : lightNavTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="select-champion-modal" options={{ presentation: 'modal', headerShown: false, gestureEnabled: true }} />
        <Stack.Screen name="draft" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="draft-result" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}
