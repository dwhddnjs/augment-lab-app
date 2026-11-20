import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, useSegments } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/navigation/animated-splash-overlay';
import { SetupScreen } from '@/components/navigation/setup-screen';
import { Theme } from '@/constants/theme';
import { useImagePrewarm } from '@/hooks/use-image-prewarm';
import { loadLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { loadThemePreference } from '@/hooks/use-theme-preference';
import { trackScreen } from '@/lib/analytics';

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

/**
 * 드래프트(가로) 화면 — 가로 전용 전체 화면 모달로 띄운다.
 *
 * 회전은 iOS 가 맡는다. 지원 방향이 다른 전체 화면 모달을 띄우거나 닫으면 UIKit 이 그 전환과 회전을
 * 한 동작으로 처리해, 새 화면이 처음부터 그 방향으로 배치된 채 돌며 들어온다. 예전처럼 코드로 회전을
 * 걸면 도는 동안 화면이 찌그러져 빈 화면으로 가려야 했다(검은 화면).
 * 드래프트끼리(칼바람 → 아이템)는 모달 위에 모달을 쌓는다 — 갈아 끼우면(replace) 앞 모달을 닫는 순간
 * 세로로 돌아갔다가 다시 가로로 돈다.
 */
const DRAFT_OPTIONS = {
  presentation: 'fullScreenModal',
  orientation: 'landscape',
  headerShown: false,
  gestureEnabled: false,
  animation: 'fade',
} as const;

function RootLayout() {
  const { mode } = useTheme();
  // 첫 설치 시 챔피언 아이콘을 받는 동안 설치 화면(진행률)을 보여준다.
  const { showSetup, progress } = useImagePrewarm();

  // 앱 시작 시 저장된 테마·로케일 선택을 1회 복원한다.
  useEffect(() => {
    loadThemePreference();
    loadLocale();
  }, []);

  // 앱의 기본 방향은 세로다 — 이 잠금 하나로 정한다. 드래프트 모달은 iOS 가 모달 자신의 방향을 따로 묻는다.
  // 드래프트가 아닌 화면에 orientation 옵션을 주지 말 것: 하나라도 있으면 루트 컨트롤러가 이 잠금 대신
  // react-native-screens 에 묻고, 그쪽은 탭 안 홈 화면(옵션 없음)을 "거꾸로 빼고 전부"로 답한다. 그래서
  // 빌드 상세에서 뒤로 오면 홈이 가로로 돌았다.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  // 화면 이름 = 라우트 파일 경로(`/(tabs)/(home)`, `/build/[id]` …). usePathname 은 탭 그룹 index가
  // 전부 `/` 로 뭉치고 빌드 id가 섞여 화면별로 묶을 수 없다.
  const screen = '/' + useSegments().join('/');
  useEffect(() => trackScreen(screen), [screen]);

  return (
    <ThemeProvider value={NAV_THEMES[mode]}>
      {showSetup && <SetupScreen progress={progress} />}
      <AnimatedSplashOverlay />
      {/* 방향은 드래프트 화면만 선언한다(DRAFT_OPTIONS). 나머지는 위 세로 잠금을 따른다. */}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* 빌드 상세 — 탭바 위에 떠서 풀스크린으로 덮는다(탭바 숨김).
            챔피언 배너가 헤더 영역까지 채우는 투명 collapsing 헤더. */}
        {/* 드래프트에서 저장하고 들어올 때(saved)는 드래프트 모달 아래에 애니메이션 없이 깐다. 가려진 채
            밀려 들어오는 애니메이션이 끝나야 세로 회전이 시작돼, 그동안 빌드 상세가 가로로 멈춰 보였다.
            들어온 뒤에는 기본으로 되돌린다 — 그대로 두면 뒤로가기 스와이프가 손가락을 따라가지 않는다. */}
        <Stack.Screen
          name="build/[id]"
          options={({ route }) => ({
            headerTransparent: true,
            headerTitle: '',
            headerBlurEffect: 'none',
            headerBackButtonDisplayMode: 'minimal',
            animation: (route.params as { saved?: string } | undefined)?.saved ? 'none' : 'default',
          })}
          listeners={({ navigation }) => ({
            transitionEnd: (e) => {
              if (!e.data.closing) navigation.setOptions({ animation: 'default' });
            },
          })}
        />
        {/* 헤더 세부(타이틀·검색바)는 화면 내부 Stack.Screen에서 로케일·상태와 함께 주입 */}
        {/* 모달 시트 — large title collapse/검색바는 화면 내부에서 native 헤더로 처리 */}
        {/* 드래프트가 이 시트 위에 쌓인다. 저장할 때는 묶음째 애니메이션 없이 닫는다(close=cut, useCloseDraft). */}
        <Stack.Screen
          name="select-champion-modal"
          options={({ route }) => ({
            presentation: 'modal',
            gestureEnabled: true,
            animation:
              (route.params as { close?: string } | undefined)?.close === 'cut' ? 'none' : 'default',
          })}
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
        <Stack.Screen name="aram" options={DRAFT_OPTIONS} />
        <Stack.Screen name="aram-items" options={DRAFT_OPTIONS} />
        {/* 커스텀 — 증강을 직접 골라 담는 가로 화면(뽑기 없음) */}
        <Stack.Screen name="custom" options={DRAFT_OPTIONS} />
      </Stack>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
