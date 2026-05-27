# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

@AGENTS.md

## 플랜 문서 저장

플랜모드로 작성한 계획 문서는 **매번** `docs/plans/<YYYY-MM-DD>-<주제>.md` 형식으로 저장할 것. 폴더가 없으면 생성.

## UI 작업 시 참고

Expo UI(`@expo/ui`) 적극적으로 사용하고 컴포넌트 및 UI를 만들때 https://docs.expo.dev/versions/latest/sdk/ui/를 참고 할 것
UI 컴포넌트, 네비게이션, 스타일링, 애니메이션 작업 전에 반드시 `.agents/skills/building-native-ui/SKILL.md`를 읽을 것.

### 플랫폼 분리 원칙

**웹 지원 없음** — `*.web.tsx` / `*.web.ts` 파일을 만들지 말 것. `npm run web`도 사용하지 않음.

Expo UI(`@expo/ui`)를 사용하므로 **모든 UI 컴포넌트는 iOS/Android로 분리**해서 구현할 것:

- `ComponentName.ios.tsx` — iOS 전용 구현 (`@expo/ui/swift-ui` 사용)
- `ComponentName.android.tsx` — Android 전용 구현 (`@expo/ui/jetpack-compose` 사용)
- `ComponentName.tsx` — 공통 타입 정의 및 폴백 (필요 시)

Expo의 플랫폼 확장 규칙에 따라 Metro/Expo Router가 자동으로 올바른 파일을 선택함. 단일 파일에 `Platform.OS` 분기를 쓰지 말고 파일 자체를 분리할 것.

### i18n / 로케일 원칙

글로벌 서비스이므로 **모든 사용자 노출 텍스트는 로케일 분기**할 것. 텍스트를 하드코딩하지 말고 `src/lib/i18n.ts`의 `useTranslation()` 훅을 사용:

- 컴포넌트 파일 상단에 `const t = { ko: {...}, en: {...} }` 형태의 dictionary 정의
- 컴포넌트 안에서 `const translate = useTranslation(t)` → `translate('key')`로 사용
- 키 누락 시 자동으로 `en` 폴백
- 데이터(챔피언/아이템/증강 이름 등)는 `useChampions()` 등 훅이 이미 로케일 분기하므로 그대로 사용
- `src/hooks/use-locale.ts`의 `useLocale()`이 현재 로케일을 반환 (`'ko' | 'en'`)

## 명령어

```bash
npm install            # 의존성 설치
npm start              # Expo 개발 서버 시작 (Expo Go용 QR 코드 출력)
npm run ios            # iOS 시뮬레이터로 시작
npm run android        # Android 에뮬레이터로 시작
npm run web            # 웹 브라우저로 시작
npm run lint           # expo lint로 ESLint 실행
npm run reset-project  # 스타터 코드를 app-example/로 이동하고 src/app/ 초기화
```

테스트 러너는 아직 설정되지 않았음 — Jest 추가는 [Expo 단위 테스트 가이드](https://docs.expo.dev/develop/unit-testing/) 참고.

## 아키텍처

**Expo SDK 56 / React 19 / React Native 0.85** 기반의 iOS, Android, 웹을 단일 코드베이스로 지원하는 크로스플랫폼 앱.

### 라우팅

파일 기반 라우팅을 사용하는 Expo Router v56. 라우트 파일은 `src/app/`에 위치:

- `_layout.tsx` — 루트 레이아웃. 전체를 `ThemeProvider`로 감싸고 `AnimatedSplashOverlay`와 `AppTabs`를 렌더링
- `index.tsx` — Home 탭
- `explore.tsx` — Explore 탭

`package.json`의 `main` 진입점이 `expo-router/entry`이므로 Expo Router가 앱을 부트스트랩함. `experiments.typedRoutes`로 타입이 있는 라우트 활성화.

### 플랫폼별 파일

컴포넌트는 React Native의 플랫폼 확장 규칙을 사용함. `.web.tsx`로 끝나는 파일은 웹에서 기본 `.tsx`를 대체:

- `src/components/app-tabs.tsx` — `expo-router/unstable-native-tabs`(`NativeTabs`)를 사용하는 네이티브 탭 바
- `src/components/app-tabs.web.tsx` — `expo-router/ui`(`Tabs`, `TabList`, `TabTrigger`, `TabSlot`)를 사용하는 웹 탭 바
- `src/components/animated-icon.tsx` / `.web.tsx` — 애니메이션 스플래시/아이콘
- `src/hooks/use-color-scheme.ts` / `.web.ts` — 색상 스킴 훅

### 테마

모든 테마 값은 `src/constants/theme.ts`에 집중 관리:

- `Colors` — 라이트/다크 팔레트 (`text`, `background`, `backgroundElement`, `backgroundSelected`, `textSecondary`)
- `Fonts` — 플랫폼별 폰트 패밀리 (iOS 시스템 폰트, 웹 CSS 변수)
- `Spacing` — 숫자 스케일 (`half`=2, `one`=4, `two`=8, `three`=16, `four`=24, `five`=32, `six`=64)
- `BottomTabInset`, `MaxContentWidth` — 레이아웃 상수

`useTheme()` (`src/hooks/use-theme.ts`)는 현재 활성화된 `Colors` 팔레트를 반환. `ThemedText`와 `ThemedView`는 `type` 또는 `themeColor` prop을 받아 인라인 색상 로직 없이 테마 기반 스타일 적용.

### 경로 별칭

`@/`는 `src/`로, `@/assets/`는 `assets/`로 매핑 (`tsconfig.json`에 설정).

### React Compiler

`app.json`에 `experiments.reactCompiler: true`가 설정되어 있어 React Compiler가 자동으로 실행됨. 프로파일링으로 필요가 확인되지 않는 한 `useMemo`/`useCallback`을 수동으로 추가하지 말 것.
