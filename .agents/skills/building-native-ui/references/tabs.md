# 네이티브 탭

최고의 iOS 경험을 위해 'expo-router/unstable-native-tabs'의 NativeTabs를 항상 사용하세요.

**SDK 54 이상. SDK 55 권장.**

## SDK 호환성

| 항목 | SDK 54 | SDK 55+ |
| ------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| Import | `import { NativeTabs, Icon, Label, Badge, VectorIcon }` | `import { NativeTabs }` 만 |
| 아이콘 | `<Icon sf="house.fill" />` | `<NativeTabs.Trigger.Icon sf="house.fill" />` |
| 레이블 | `<Label>홈</Label>` | `<NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>` |
| 배지 | `<Badge>9+</Badge>` | `<NativeTabs.Trigger.Badge>9+</NativeTabs.Trigger.Badge>` |
| Android 아이콘 | `drawable` prop | `md` prop (Material Symbols) |

아래 예시는 모두 SDK 55 문법을 사용합니다. SDK 54의 경우 `NativeTabs.Trigger.Icon/Label/Badge`를 독립적인 `Icon`, `Label`, `Badge` import로 대체하세요.

## 기본 사용법

```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge>9+</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
        <NativeTabs.Trigger.Label>설정</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <NativeTabs.Trigger.Label>검색</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

## 규칙

- 각 탭에 대한 trigger를 반드시 포함해야 합니다.
- `NativeTabs.Trigger`의 `name`은 괄호 포함 라우트 이름과 정확히 일치해야 합니다 (예: `<NativeTabs.Trigger name="(search)">`)
- 검색 탭은 검색 바와 잘 결합되도록 목록 마지막에 두는 것이 좋습니다.
- 일반적인 탭 타입에는 `role` prop을 사용하세요.
- 탭은 정적이어야 합니다 — 런타임에 동적으로 추가/제거 불가 (네비게이터가 리마운트되고 상태가 손실됩니다)

## 플랫폼 기능

네이티브 탭은 플랫폼별 탭 바 구현을 사용합니다:

- **iOS 26+**: 시스템 네이티브 외관의 리퀴드 글래스 효과
- **Android**: Material 3 하단 네비게이션
- 더 나은 성능과 네이티브 느낌

## Icon 컴포넌트

```tsx
// SF Symbol (iOS) + Material Symbol (Android)
<NativeTabs.Trigger.Icon sf="house.fill" md="home" />

// 상태별 변형
<NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />

// 커스텀 이미지
<NativeTabs.Trigger.Icon src={require('./icon.png')} />

// Xcode asset catalog — iOS 전용 (SDK 55+)
<NativeTabs.Trigger.Icon xcasset="home-icon" />
<NativeTabs.Trigger.Icon xcasset={{ default: "home-outline", selected: "home-filled" }} />

// 렌더링 모드 — iOS 전용 (SDK 55+)
<NativeTabs.Trigger.Icon src={require('./icon.png')} renderingMode="template" />
<NativeTabs.Trigger.Icon src={require('./gradient.png')} renderingMode="original" />
```

`renderingMode`: `"template"`은 틴트 색상 적용 (단색 아이콘), `"original"`은 원본 색상 유지 (그라디언트). Android는 항상 original 사용.

## Label & Badge

```tsx
// 레이블
<NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
<NativeTabs.Trigger.Label hidden>홈</NativeTabs.Trigger.Label>  {/* 아이콘만 있는 탭 */}

// 배지
<NativeTabs.Trigger.Badge>9+</NativeTabs.Trigger.Badge>
<NativeTabs.Trigger.Badge />  {/* 점 인디케이터 */}
```

## iOS 26 기능

### 리퀴드 글래스 탭 바

iOS 26+에서 탭 바가 자동으로 리퀴드 글래스 외관을 적용합니다.

### 스크롤 시 최소화

```tsx
<NativeTabs minimizeBehavior="onScrollDown">
```

### 검색 탭

```tsx
<NativeTabs.Trigger name="(search)" role="search">
  <NativeTabs.Trigger.Label>검색</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

**참고**: 최고의 UX를 위해 검색 탭을 목록 마지막에 배치하세요.

### Role Prop

특별한 탭 타입에 시맨틱 역할을 사용하세요:

```tsx
<NativeTabs.Trigger name="search" role="search" />
<NativeTabs.Trigger name="favorites" role="favorites" />
<NativeTabs.Trigger name="more" role="more" />
```

사용 가능한 역할: `search` | `more` | `favorites` | `bookmarks` | `contacts` | `downloads` | `featured` | `history` | `mostRecent` | `mostViewed` | `recents` | `topRated`

## 커스터마이징

### 틴트 색상

```tsx
<NativeTabs tintColor="#007AFF">
```

### 동적 색상 (iOS)

리퀴드 글래스에 적응하는 색상에는 DynamicColorIOS 사용:

```tsx
import { DynamicColorIOS, Platform } from 'react-native';

const adaptiveBlue = Platform.select({
  ios: DynamicColorIOS({ light: '#007AFF', dark: '#0A84FF' }),
  default: '#007AFF',
});

<NativeTabs tintColor={adaptiveBlue}>
```

## 조건부 탭

```tsx
<NativeTabs.Trigger name="admin" hidden={!isAdmin}>
  <NativeTabs.Trigger.Label>관리자</NativeTabs.Trigger.Label>
  <NativeTabs.Trigger.Icon sf="shield.fill" md="shield" />
</NativeTabs.Trigger>
```

**탭이 표시된 상태에서 숨기지 마세요 — 가시성 토글은 네비게이터를 리마운트하고 상태를 잃습니다. 초기 렌더링에서만 사용하세요.**

**참고**: 숨겨진 탭으로는 네비게이션할 수 없습니다!

## 동작 옵션

```tsx
<NativeTabs.Trigger
  name="home"
  disablePopToTop           // 활성 탭 탭 시 스택 pop 방지
  disableScrollToTop        // 활성 탭 탭 시 스크롤 상단 이동 방지
  disableAutomaticContentInsets  // 자동 안전 영역 인셋 비활성화 (SDK 55+)
>
```

## 탭 바 숨기기 (SDK 55+)

`NativeTabs`의 `hidden` prop으로 전체 탭 바를 동적으로 숨기기:

```tsx
<NativeTabs hidden={isTabBarHidden}>{/* triggers */}</NativeTabs>
```

## 하단 악세서리 (SDK 55+)

`NativeTabs.BottomAccessory`는 탭 바 위에 콘텐츠를 렌더링합니다 (iOS 26+). `usePlacement()`를 사용해 `'regular'`와 `'inline'` 레이아웃 간에 적응합니다.

**중요**: 두 인스턴스가 동시에 렌더링됩니다 — 상태는 컴포넌트 외부(props, context, 또는 외부 스토어)에 저장하세요.

```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

function MiniPlayer({
  isPlaying,
  onToggle,
}: {
  isPlaying: boolean;
  onToggle: () => void;
}) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  if (placement === "inline") {
    return (
      <Pressable onPress={onToggle}>
        <SymbolView name={isPlaying ? "pause.fill" : "play.fill"} />
      </Pressable>
    );
  }
  return <View>{/* 전체 플레이어 UI */}</View>;
}

export default function TabLayout() {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <NativeTabs>
      <NativeTabs.BottomAccessory>
        <MiniPlayer
          isPlaying={isPlaying}
          onToggle={() => setIsPlaying(!isPlaying)}
        />
      </NativeTabs.BottomAccessory>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

## 안전 영역 처리 (SDK 55+)

SDK 55는 안전 영역을 자동으로 처리합니다:

- **Android**: 콘텐츠를 SafeAreaView로 감쌈 (하단 인셋)
- **iOS**: 첫 번째 ScrollView에 자동 `contentInsetAdjustmentBehavior` 적용

탭별로 비활성화하려면 `disableAutomaticContentInsets`를 사용하고 직접 관리하세요:

```tsx
<NativeTabs.Trigger name="index" disableAutomaticContentInsets>
  <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

```tsx
// 화면에서
import { SafeAreaView } from "react-native-screens/experimental";

export default function HomeScreen() {
  return (
    <SafeAreaView edges={{ bottom: true }} style={{ flex: 1 }}>
      {/* 콘텐츠 */}
    </SafeAreaView>
  );
}
```

## 벡터 아이콘 사용

SF Symbols 대신 @expo/vector-icons를 꼭 사용해야 한다면:

```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

<NativeTabs.Trigger name="home">
  <NativeTabs.Trigger.VectorIcon vector={Ionicons} name="home" />
  <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

**네이티브 느낌을 위해 벡터 아이콘보다 SF Symbols + `md` prop을 선호하세요.**

SDK 55 이상을 사용하는 경우 **Android에서 사용할 Material Symbols를 `md` prop으로 지정하세요**.

## 스택과의 구조

네이티브 탭은 헤더를 렌더링하지 않습니다. 네비게이션 헤더를 위해 각 탭 안에 Stack을 중첩하세요:

```tsx
// app/(tabs)/_layout.tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// app/(tabs)/(home)/_layout.tsx
import Stack from "expo-router/stack";

export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "홈", headerLargeTitle: true }}
      />
      <Stack.Screen name="details" options={{ title: "상세" }} />
    </Stack>
  );
}
```

## 웹용 커스텀 레이아웃

네이티브와 웹 탭 레이아웃을 분리하려면 플랫폼별 파일 사용:

```
app/
  _layout.tsx          # iOS/Android용 NativeTabs
  _layout.web.tsx      # 웹용 헤드리스 탭 (expo-router/ui)
```

또는 컴포넌트로 추출: `components/app-tabs.tsx` + `components/app-tabs.web.tsx`

## JS 탭에서 마이그레이션

### 이전 (JS 탭)

```tsx
import { Tabs } from "expo-router";

<Tabs>
  <Tabs.Screen
    name="index"
    options={{
      title: "홈",
      tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
      tabBarBadge: 3,
    }}
  />
</Tabs>;
```

### 이후 (네이티브 탭)

```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";

<NativeTabs>
  <NativeTabs.Trigger name="index">
    <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
    <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
    <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
  </NativeTabs.Trigger>
</NativeTabs>;
```

### 주요 차이점

| JS 탭 | 네이티브 탭 |
| -------------------------- | ---------------------------- |
| `<Tabs.Screen>` | `<NativeTabs.Trigger>` |
| `options={{ title }}` | `<NativeTabs.Trigger.Label>` |
| `options={{ tabBarIcon }}` | `<NativeTabs.Trigger.Icon>` |
| `tabBarBadge` 옵션 | `<NativeTabs.Trigger.Badge>` |
| Props 기반 API | 컴포넌트 기반 API |
| 헤더 내장 | 헤더를 위해 `<Stack>` 중첩 |

## 제한사항

- **Android**: 최대 5개 탭 (Material Design 제약)
- **중첩**: 네이티브 탭을 다른 네이티브 탭 안에 중첩 불가
- **탭 바 높이**: 프로그래밍 방식으로 측정 불가
- **FlatList 투명도**: 문제 발생 시 `disableTransparentOnScrollEdge` 사용
- **동적 탭**: 탭은 정적이어야 하며, 변경 시 네비게이터가 리마운트되고 상태가 손실됩니다

## 키보드 처리 (Android)

app.json에서 설정:

```json
{
  "expo": {
    "android": {
      "softwareKeyboardLayoutMode": "resize"
    }
  }
}
```

## 자주 겪는 문제

1. **Android에서 아이콘이 표시되지 않음**: `md` prop 추가 (SDK 55) 또는 VectorIcon 사용
2. **헤더가 없음**: 각 탭 그룹 안에 Stack 중첩하기
3. **Trigger name 불일치**: `name`은 괄호 포함 정확한 라우트 이름과 일치해야 함
4. **배지가 보이지 않음**: Badge는 Trigger의 prop이 아닌 자식 컴포넌트여야 함
5. **iOS 18 이하에서 탭 바가 투명함**: 화면에 `ScrollView`나 `FlatList`가 있으면 화면 컴포넌트의 첫 번째 불투명 자식인지 확인하세요. 다른 `View`로 감싸야 한다면 `collapsable={false}`를 확인하세요. `ScrollView`나 `FlatList`가 없다면 `NativeTabs.Trigger` 옵션에 `disableTransparentOnScrollEdge`를 `true`로 설정하세요.
6. **맨 위로 스크롤이 안 됨**: 활성 탭의 Trigger에 `disableScrollToTop`이 설정되지 않았는지 확인하고, `ScrollView`가 화면 컴포넌트의 첫 번째 자식인지 확인하세요.
7. **탭 전환 시 헤더 버튼이 깜빡임**: 앱이 `ThemeProvider`로 감싸져 있는지 확인하세요.

```tsx
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";

export default function Layout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack />
    </ThemeProvider>
  );
}
```

앱이 라이트 또는 다크 테마만 사용한다면, 컬러 스킴 확인 없이 직접 `DarkTheme` 또는 `DefaultTheme`을 `ThemeProvider`에 전달할 수 있습니다.

```tsx
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <ThemeProvider theme={DarkTheme}>
      <Stack />
    </ThemeProvider>
  );
}
```
