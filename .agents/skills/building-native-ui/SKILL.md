---
name: building-native-ui
description: Expo Router로 아름다운 앱을 만들기 위한 완전한 가이드. 기초, 스타일링, 컴포넌트, 네비게이션, 애니메이션, 패턴, 네이티브 탭 등을 다룹니다.
version: 1.0.1
license: MIT
---

# Expo UI 가이드라인

## 참고 자료

필요에 따라 아래 자료를 참고하세요:

```
references/
  animations.md          Reanimated: 진입/퇴장 애니메이션, 레이아웃, 스크롤 기반, 제스처
  controls.md            네이티브 iOS: Switch, Slider, SegmentedControl, DateTimePicker, Picker
  form-sheet.md          expo-router에서 폼 시트: 설정, 하단 버튼, 배경 인터랙션
  gradients.md           experimental_backgroundImage를 통한 CSS 그라디언트 (New Arch 전용)
  icons.md               expo-image를 통한 SF Symbols (sf: 소스), 이름, 애니메이션, 굵기
  media.md               카메라, 오디오, 비디오, 파일 저장
  route-structure.md     라우트 규칙, 동적 라우트, 그룹, 폴더 구조
  search.md              헤더 검색 바, useSearch 훅, 필터링 패턴
  storage.md             SQLite, AsyncStorage, SecureStore
  tabs.md                NativeTabs, JS 탭에서 마이그레이션, iOS 26 기능
  toolbar-and-headers.md Stack 헤더와 툴바 버튼, 메뉴, 검색 (iOS 전용)
  visual-effects.md      블러 (expo-blur)와 리퀴드 글래스 (expo-glass-effect)
  webgpu-three.md        WebGPU와 Three.js를 이용한 3D 그래픽, 게임, GPU 시각화
  zoom-transitions.md    Apple Zoom: Link.AppleZoom을 이용한 유연한 줌 트랜지션 (iOS 18+)
```

## 앱 실행

**중요: 커스텀 빌드 전에 반드시 Expo Go를 먼저 시도하세요.**

대부분의 Expo 앱은 커스텀 네이티브 코드 없이 Expo Go에서 작동합니다. `npx expo run:ios` 또는 `npx expo run:android`를 실행하기 전에:

1. **Expo Go로 시작**: `npx expo start`를 실행하고 Expo Go 앱으로 QR 코드를 스캔
2. **기능 테스트**: Expo Go에서 앱을 충분히 테스트
3. **꼭 필요할 때만 커스텀 빌드** — 아래 내용 참고

### 커스텀 빌드가 필요한 경우

`npx expo run:ios/android` 또는 `eas build`는 아래 경우에만 필요합니다:

- **로컬 Expo 모듈** (`modules/`에 커스텀 네이티브 코드가 있는 경우)
- **Apple 타겟** (위젯, 앱 클립, 익스텐션 — `@bacons/apple-targets` 사용)
- **Expo Go에 포함되지 않은 서드파티 네이티브 모듈**
- **app.json으로 표현할 수 없는 커스텀 네이티브 설정**

### Expo Go로 가능한 것들

Expo Go는 기본적으로 매우 다양한 기능을 지원합니다:

- 모든 `expo-*` 패키지 (카메라, 위치, 알림 등)
- Expo Router 네비게이션
- 대부분의 UI 라이브러리 (reanimated, gesture handler 등)
- 푸시 알림, 딥링크 등

**확실하지 않으면 Expo Go를 먼저 시도하세요.** 커스텀 빌드는 복잡도를 높이고, 반복 작업을 느리게 하며, Xcode/Android Studio 설정이 필요합니다.

## 코드 스타일

- 종료되지 않은 문자열에 주의하세요. 중첩된 백틱은 반드시 이스케이프하고, 따옴표도 올바르게 이스케이프하세요.
- 항상 파일 상단에 import 구문을 작성하세요.
- 파일명은 항상 kebab-case를 사용하세요. 예: `comment-card.tsx`
- 네비게이션을 이동하거나 재구성할 때는 이전 라우트 파일을 반드시 삭제하세요.
- 파일명에 특수문자를 사용하지 마세요.
- tsconfig.json에 경로 별칭을 설정하고, 리팩토링 시 상대 경로보다 별칭을 선호하세요.

## 라우트

자세한 라우트 규칙은 `./references/route-structure.md`를 참고하세요.

- 라우트는 `app` 디렉토리에 위치해야 합니다.
- 컴포넌트, 타입, 유틸리티를 app 디렉토리에 함께 두지 마세요. 이는 안티패턴입니다.
- 앱은 항상 "/"에 매칭되는 라우트를 가져야 하며, 그룹 라우트 안에 있을 수 있습니다.

## 라이브러리 선호사항

- React Native에서 제거된 Picker, WebView, SafeAreaView, AsyncStorage는 절대 사용하지 마세요.
- legacy expo-permissions는 사용하지 마세요.
- `expo-av` 대신 `expo-audio` 사용
- `expo-av` 대신 `expo-video` 사용
- SF Symbols는 `expo-symbols`나 `@expo/vector-icons` 대신 `expo-image`의 `source="sf:name"` 사용
- React Native의 SafeAreaView 대신 `react-native-safe-area-context` 사용
- `Platform.OS` 대신 `process.env.EXPO_OS` 사용
- `React.useContext` 대신 `React.use` 사용
- 기본 `img` 엘리먼트 대신 `expo-image`의 Image 컴포넌트 사용
- 리퀴드 글래스 배경에는 `expo-glass-effect` 사용

## 반응형

- 반응형을 위해 루트 컴포넌트를 항상 스크롤 뷰로 감싸세요.
- `<SafeAreaView>` 대신 `<ScrollView contentInsetAdjustmentBehavior="automatic" />`을 사용해 스마트한 안전 영역 인셋 적용
- `contentInsetAdjustmentBehavior="automatic"`은 FlatList와 SectionList에도 적용하세요.
- Dimensions API 대신 flexbox를 사용하세요.
- 화면 크기 측정은 `Dimensions.get()` 대신 **항상** `useWindowDimensions`를 사용하세요.

## 동작

- iOS에서는 `expo-haptics`를 조건부로 사용해 더 유쾌한 경험을 만드세요.
- React Native의 `<Switch />`나 `@react-native-community/datetimepicker`처럼 햅틱이 내장된 뷰를 활용하세요.
- Stack에 속한 라우트의 첫 번째 자식은 거의 항상 `contentInsetAdjustmentBehavior="automatic"`이 설정된 ScrollView여야 합니다.
- 페이지에 `ScrollView`를 추가할 때는 거의 항상 라우트 컴포넌트 안의 첫 번째 컴포넌트여야 합니다.
- 검색 바 추가는 Stack.Screen 옵션의 `headerSearchBarOptions`를 선호하세요.
- 복사될 수 있는 데이터가 있는 텍스트에는 `<Text selectable />` prop을 사용하세요.
- 큰 숫자는 1.4M이나 38k처럼 포맷하는 것을 고려하세요.
- webview나 Expo DOM 컴포넌트 안이 아닌 이상 `img`나 `div` 같은 기본 엘리먼트를 절대 사용하지 마세요.

# 스타일링

Apple Human Interface Guidelines를 따르세요.

## 일반 스타일링 규칙

- margin과 padding 스타일보다 flex gap을 선호하세요.
- margin보다 padding을 선호하세요.
- 항상 안전 영역을 고려하세요. 스택 헤더, 탭, 또는 ScrollView/FlatList의 `contentInsetAdjustmentBehavior="automatic"`을 사용하세요.
- 상단과 하단 안전 영역 인셋을 모두 고려하세요.
- 스타일 재사용이 더 빠른 경우가 아니면 StyleSheet.create 대신 인라인 스타일 사용
- 상태 변화에 진입/퇴장 애니메이션을 추가하세요.
- 캡슐 모양이 아닌 경우 둥근 모서리에는 `{ borderCurve: 'continuous' }` 사용
- 페이지에 커스텀 텍스트 엘리먼트 대신 **항상** 네비게이션 스택 타이틀을 사용하세요.
- ScrollView에 패딩을 줄 때는 ScrollView 자체가 아닌 `contentContainerStyle`에 padding과 gap을 사용하세요 (클리핑 방지).
- CSS와 Tailwind는 지원되지 않습니다. 인라인 스타일을 사용하세요.

## 텍스트 스타일링

- 중요한 데이터나 에러 메시지를 표시하는 모든 `<Text/>` 엘리먼트에 `selectable` prop을 추가하세요.
- 카운터에는 정렬을 위해 `{ fontVariant: 'tabular-nums' }` 사용

## 그림자

CSS `boxShadow` 스타일 prop을 사용하세요. legacy React Native shadow 또는 elevation 스타일은 **절대 사용하지 마세요**.

```tsx
<View style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }} />
```

`inset` 그림자도 지원됩니다.

# 네비게이션

## Link

라우트 간 이동에는 'expo-router'의 `<Link href="/path" />`를 사용하세요.

```tsx
import { Link } from 'expo-router';

// 기본 링크
<Link href="/path" />

// 커스텀 컴포넌트 래핑
<Link href="/path" asChild>
  <Pressable>...</Pressable>
</Link>
```

가능하면 iOS 관례에 맞게 `<Link.Preview>`를 포함하세요. 네비게이션 향상을 위해 컨텍스트 메뉴와 프리뷰를 자주 추가하세요.

## Stack

- 스택 정의에는 **항상** `_layout.tsx` 파일을 사용하세요.
- 네이티브 네비게이션 스택에는 'expo-router/stack'의 Stack을 사용하세요.

### 페이지 타이틀

Stack.Screen 옵션에 페이지 타이틀을 설정하세요:

```tsx
<Stack.Screen options={{ title: "Home" }} />
```

## 컨텍스트 메뉴

Link 컴포넌트에 길게 누르기 컨텍스트 메뉴를 추가하세요:

```tsx
import { Link } from "expo-router";

<Link href="/settings" asChild>
  <Link.Trigger>
    <Pressable>
      <Card />
    </Pressable>
  </Link.Trigger>
  <Link.Menu>
    <Link.MenuAction
      title="공유"
      icon="square.and.arrow.up"
      onPress={handleSharePress}
    />
    <Link.MenuAction
      title="차단"
      icon="nosign"
      destructive
      onPress={handleBlockPress}
    />
    <Link.Menu title="더보기" icon="ellipsis">
      <Link.MenuAction title="복사" icon="doc.on.doc" onPress={() => {}} />
      <Link.MenuAction
        title="삭제"
        icon="trash"
        destructive
        onPress={() => {}}
      />
    </Link.Menu>
  </Link.Menu>
</Link>;
```

## 링크 프리뷰

네비게이션 향상을 위해 링크 프리뷰를 자주 사용하세요:

```tsx
<Link href="/settings">
  <Link.Trigger>
    <Pressable>
      <Card />
    </Pressable>
  </Link.Trigger>
  <Link.Preview />
</Link>
```

링크 프리뷰는 컨텍스트 메뉴와 함께 사용할 수 있습니다.

## 모달

화면을 모달로 표시하기:

```tsx
<Stack.Screen name="modal" options={{ presentation: "modal" }} />
```

커스텀 모달 컴포넌트를 만드는 것보다 이 방법을 선호하세요.

## 시트

화면을 동적 폼 시트로 표시하기:

```tsx
<Stack.Screen
  name="sheet"
  options={{
    presentation: "formSheet",
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.5, 1.0],
    contentStyle: { backgroundColor: "transparent" },
  }}
/>
```

- `contentStyle: { backgroundColor: "transparent" }`를 사용하면 iOS 26+에서 배경이 리퀴드 글래스로 적용됩니다.

## 일반적인 라우트 구조

탭과 각 탭 안에 스택이 있는 표준 앱 레이아웃:

```
app/
  _layout.tsx — <NativeTabs />
  (index,search)/
    _layout.tsx — <Stack />
    index.tsx — 메인 목록
    search.tsx — 검색 뷰
```

```tsx
// app/_layout.tsx
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { Theme } from "../components/theme";

export default function Layout() {
  return (
    <Theme>
      <NativeTabs>
        <NativeTabs.Trigger name="(index)">
          <Icon sf="list.dash" />
          <Label>항목</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(search)" role="search" />
      </NativeTabs>
    </Theme>
  );
}
```

두 탭이 공통 화면을 push할 수 있도록 공유 그룹 라우트를 만드세요:

```tsx
// app/(index,search)/_layout.tsx
import { Stack } from "expo-router/stack";
import { PlatformColor } from "react-native";

export default function Layout({ segment }) {
  const screen = segment.match(/\((.*)\)/)?.[1]!;
  const titles: Record<string, string> = { index: "항목", search: "검색" };

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerTitleStyle: { color: PlatformColor("label") },
        headerLargeTitle: true,
        headerBlurEffect: "none",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name={screen} options={{ title: titles[screen] }} />
      <Stack.Screen name="i/[id]" options={{ headerLargeTitle: false }} />
    </Stack>
  );
}
```
