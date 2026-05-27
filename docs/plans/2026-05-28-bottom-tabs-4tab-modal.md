# 4-Tab Bottom Bar + Plus Modal 구현 계획

## Context

현재 앱의 바텀탭은 `Home` / `Explore` 2개로 구성되어 있고 (`src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`), 루트 레이아웃(`src/app/_layout.tsx`)은 `Stack` 없이 `<AppTabs />`를 바로 렌더링한다. 모달 라우트 패턴은 아직 도입되지 않았다.

사용자가 원하는 최종 구조:
- 바텀탭 4개: **Main / Community / MyPage / Plus** (Plus는 탭바 우측 끝)
- Plus 버튼 탭 시 라우트 기반 모달(`src/app/modal.tsx`)이 올라옴
- 모달 내용은 placeholder (제목 + 닫기 버튼)
- iOS는 SF Symbols, Android는 Material Icons 사용
- CLAUDE.md의 플랫폼 분리 원칙에 따라 `app-tabs.ios.tsx` / `app-tabs.android.tsx` / `app-tabs.web.tsx`로 분리

## 파일 변경 사항

### 1. 라우트 구조 재편

기존:
```
src/app/
  _layout.tsx     # ThemeProvider + AnimatedSplashOverlay + AppTabs (직접 렌더)
  index.tsx       # Home
  explore.tsx     # Explore (삭제 대상)
```

변경 후:
```
src/app/
  _layout.tsx           # ThemeProvider + AnimatedSplashOverlay + <Stack>
  (tabs)/
    _layout.tsx         # <AppTabs /> 만 렌더 (탭 그룹의 레이아웃)
    index.tsx           # Main (기존 index.tsx 이동)
    community.tsx       # 신규 - placeholder 화면
    mypage.tsx          # 신규 - placeholder 화면
  modal.tsx             # 신규 - presentation: 'modal'
```

### 2. `src/app/_layout.tsx` 수정

`<AppTabs />` 직접 렌더링을 `<Stack>`으로 대체:
- `<Stack.Screen name="(tabs)" options={{ headerShown: false }} />`
- `<Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />` (iOS에서 시트 형태로 올라옴, Android는 새 화면)
- `ThemeProvider`, `AnimatedSplashOverlay`는 유지

### 3. `src/app/(tabs)/_layout.tsx` (신규)

```tsx
import { AppTabs } from '@/components/app-tabs';
export default function TabsLayout() {
  return <AppTabs />;
}
```

### 4. `src/components/app-tabs.tsx` 삭제 → 플랫폼별 분리

#### `src/components/app-tabs.ios.tsx` (신규)
- `expo-router/unstable-native-tabs`의 `NativeTabs` 사용
- 아이콘은 SF Symbols (`expo-symbols`의 `<Icon sf="..." />` 또는 `NativeTabs.Trigger.Icon`의 `sf` prop)
- 4개 Trigger: `index`(house), `community`(person.2), `mypage`(person.crop.circle), `modal`(plus)
- Plus는 `name="modal"`로 라우트를 가리키되, `onPress`에서 `e.preventDefault()` 호출 후 `router.push('/modal')` — `NativeTabs.Trigger`의 `onPress` 패턴이 SDK 56에서 동작하지 않으면 대안: `name="plus"` dummy 라우트(`src/app/(tabs)/plus.tsx`)에서 `useFocusEffect`로 모달 push + 이전 탭으로 복귀

#### `src/components/app-tabs.android.tsx` (신규)
- 동일한 `NativeTabs` API 사용 (cross-platform 컴포넌트)
- 아이콘은 `@expo/vector-icons`의 `MaterialIcons` 또는 drawable 리소스 (NativeTabs.Trigger.Icon이 Android에서 PNG `src`를 받음)
- 우선 PNG 방식으로 진행하고, Material Icons SVG 변환은 후속 작업 — 또는 `@expo/vector-icons` 임포트 후 trigger 내부에서 사용
- 4개 Trigger 구성은 iOS와 동일, Plus 처리도 동일 패턴

#### `src/components/app-tabs.web.tsx` 수정
- 기존 `Tabs`/`TabList`/`TabTrigger` 구조 유지
- Trigger 2개 → 4개로 확장: `index`, `community`, `mypage`
- Plus는 `<TabTrigger>`가 아닌 `<Pressable>`로 처리, `onPress={() => router.push('/modal')}` — `CustomTabList` 내부에 추가

### 5. 신규 화면 파일

#### `src/app/(tabs)/community.tsx`, `src/app/(tabs)/mypage.tsx`
- `index.tsx`(`src/app/index.tsx:31-62`)와 동일한 구조의 placeholder
- `ThemedView` + `ThemedText` 사용, `BottomTabInset` (`src/constants/theme.ts:64`) 적용
- 화면 제목만 다름

#### `src/app/modal.tsx`
- `ThemedView` 풀스크린 컨테이너
- `ThemedText type="title"`로 "새로 만들기" 같은 placeholder 제목
- `Pressable`로 닫기 버튼 → `router.back()`
- iOS는 자동으로 시트 형태로 올라오고, Android는 풀스크린 모달

## 재사용 컴포넌트/유틸

- `ThemedView`, `ThemedText` — placeholder 화면과 모달에 그대로 사용
- `useTheme()` (`src/hooks/use-theme.ts`) — 색상 팔레트
- `Spacing`, `Colors`, `BottomTabInset` (`src/constants/theme.ts`)
- `AnimatedSplashOverlay` — 그대로 유지

## 의존성 확인

이미 설치됨 (변경 불필요):
- `expo-router ~56.2.7` — `Stack`, `unstable-native-tabs`, `ui` 모두 사용 가능
- `expo-symbols ~56.0.5` — iOS SF Symbols
- `@expo/ui ~56.0.14` — 현재는 사용 안 함

Android Material Icons용으로 `@expo/vector-icons`가 필요할 수 있음 (Expo SDK에 기본 포함, 확인만).

## 검증 방법

1. `npm run ios` — 4개 탭 표시 확인, 우측 끝 Plus 탭 시 모달이 시트로 올라오는지, 닫기 버튼으로 닫히는지
2. `npm run android` — 동일 검증, 모달이 새 화면으로 뜨는지
3. `npm run web` — 4개 탭 + Plus Pressable 동작 확인
4. `npm run lint` — 린트 통과 확인
5. 각 탭 전환 시 화면이 올바르게 렌더되는지, Main 탭이 기존 Home 화면 그대로인지 확인

## 미확정 / 후속 결정

- **NativeTabs Plus 처리 패턴**: SDK 56의 `NativeTabs.Trigger.onPress` 동작 여부를 구현 시점에 검증. 안 되면 dummy 라우트 + `useFocusEffect` 방식으로 폴백
- **Android 아이콘 소스**: Material Icons SVG vs PNG drawable — 초기 구현은 단순한 방식 선택, 디자인 확정 후 교체
