import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

// Locks the screen to landscape while the draft screen is mounted, and restores
// portrait on unmount. Calls are wrapped so a failure (e.g. unsupported in some
// Expo Go contexts) never crashes the screen.
export function useLandscapeLock() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);
}
