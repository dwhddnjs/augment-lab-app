import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/navigation/animated-splash-overlay';
import { SetupScreen } from '@/components/navigation/setup-screen';
import { Theme } from '@/constants/theme';
import { useImagePrewarm } from '@/hooks/use-image-prewarm';
import { loadLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { loadThemePreference } from '@/hooks/use-theme-preference';

/** 네비게이션 컨테이너(헤더·배경) 색을 앱 테마 토큰에 맞춘다. */
function navTheme(base: typeof DefaultTheme, c: (typeof Theme)[keyof typeof Theme]) {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent.default,
      background: c.surface.base,
      card: c.surface.base,
      text: c.text.primary,
      border: c.border.default,
      notification: c.status.danger.default,
    },
  };
}

const NAV_THEMES = {
  dark: navTheme(DarkTheme, Theme.dark),
  light: navTheme(DefaultTheme, Theme.light),
};

export default function RootLayout() {
  const { mode } = useTheme();
  // 첫 설치 시 챔피언 아이콘을 받는 동안 설치 화면(진행률)을 보여준다.
  const { showSetup, progress } = useImagePrewarm();

  // 앱 시작 시 저장된 테마·로케일 선택을 1회 복원한다.
  useEffect(() => {
    loadThemePreference();
    loadLocale();
  }, []);

  return (
    <ThemeProvider value={NAV_THEMES[mode]}>
      {showSetup && <SetupScreen progress={progress} />}
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* 빌드 상세 — 탭바 위에 떠서 풀스크린으로 덮는다(탭바 숨김).
            챔피언 배너가 헤더 영역까지 채우는 투명 collapsing 헤더. */}
        <Stack.Screen
          name="build/[id]"
          options={{
            headerTransparent: true,
            headerTitle: '',
            headerBlurEffect: 'none',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        {/* 헤더 세부(타이틀·검색바)는 화면 내부 Stack.Screen에서 로케일·상태와 함께 주입 */}
        {/* 모달 시트 — large title collapse/검색바는 화면 내부에서 native 헤더로 처리 */}
        <Stack.Screen
          name="select-champion-modal"
          options={{ presentation: 'modal', gestureEnabled: true }}
        />
        {/* 티어리스트 챔피언 상세 — 증강·아이템 성적표.
            dangerouslySingular: 카드를 빠르게 두 번 누르면 push 가 두 번 들어가 모달이 두 겹 쌓인다. */}
        <Stack.Screen
          name="tierlist-champion-modal"
          options={{ presentation: 'modal', gestureEnabled: true }}
          dangerouslySingular
        />
        {/* 모드 선택 — + 버튼이 띄우는 투명 오버레이(딤 + 원형 버튼) */}
        <Stack.Screen name="mode-select" options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false, gestureEnabled: true }} />
        <Stack.Screen name="aram" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="aram-items" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
        {/* 커스텀 — 증강을 직접 골라 담는 가로 화면(뽑기 없음) */}
        <Stack.Screen name="custom" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}
