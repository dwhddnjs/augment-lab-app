import 'react-native-url-polyfill/auto';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/navigation/animated-icon';

const darkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#1ED7A0',
    background: '#0E0F12',
    card: '#0E0F12',
    text: '#F2F4F7',
    border: '#26292F',
    notification: '#F26D6D',
  },
};

const lightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#10B187',
    background: '#FAFBFC',
    card: '#FAFBFC',
    text: '#0E0F12',
    border: '#D7DAE0',
    notification: '#D0463F',
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
      </Stack>
    </ThemeProvider>
  );
}
