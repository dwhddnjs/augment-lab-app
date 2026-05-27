# 라우트 구조

## 파일 규칙

- 라우트는 `app` 디렉토리에 위치해야 합니다.
- 동적 라우트에는 `[]` 사용, 예: `[id].tsx`
- 라우트는 절대 `(foo).tsx`로 이름 지을 수 없습니다 — `(foo)/index.tsx`를 사용하세요.
- URL 구조를 단순화하려면 `(group)` 라우트를 사용하세요.
- 컴포넌트, 타입, 유틸리티를 app 디렉토리에 함께 두지 마세요 — `components/`, `utils/` 등 별도 디렉토리에 위치해야 합니다.
- app 디렉토리에는 라우트 파일과 `_layout` 파일만 있어야 하며, 모든 파일은 기본 컴포넌트를 export해야 합니다.
- 앱이 빈 화면이 되지 않도록 항상 "/"에 매칭되는 라우트가 있어야 합니다.
- 스택 정의에는 **항상** `_layout.tsx` 파일을 사용하세요.

## 동적 라우트

동적 세그먼트에는 대괄호를 사용하세요:

```
app/
  users/
    [id].tsx        # /users/123, /users/abc에 매칭
    [id]/
      posts.tsx     # /users/123/posts에 매칭
```

### 전체 포함 라우트

`[...slug]`를 사용해 모든 경로를 포함하는 라우트 만들기:

```
app/
  docs/
    [...slug].tsx   # /docs/a, /docs/a/b, /docs/a/b/c에 매칭
```

## 쿼리 파라미터

`useLocalSearchParams` 훅으로 쿼리 파라미터에 접근:

```tsx
import { useLocalSearchParams } from "expo-router";

function Page() {
  const { id } = useLocalSearchParams<{ id: string }>();
}
```

동적 라우트의 경우 파라미터 이름은 파일명과 일치합니다:

- `[id].tsx` → `useLocalSearchParams<{ id: string }>()`
- `[slug].tsx` → `useLocalSearchParams<{ slug: string }>()`

## 현재 경로

`usePathname` 훅으로 현재 경로에 접근:

```tsx
import { usePathname } from "expo-router";

function Component() {
  const pathname = usePathname(); // 예: "/users/123"
}
```

## 그룹 라우트

URL에 영향을 주지 않는 그룹에는 괄호를 사용하세요:

```
app/
  (auth)/
    login.tsx       # URL: /login
    register.tsx    # URL: /register
  (main)/
    index.tsx       # URL: /
    settings.tsx    # URL: /settings
```

그룹의 활용:

- 관련 라우트 정리
- 라우트 그룹에 다른 레이아웃 적용
- URL을 깔끔하게 유지

## 스택과 탭 구조

앱에 탭이 있는 경우, 헤더와 타이틀은 각 탭 **안에** 중첩된 Stack에서 설정해야 합니다. 이렇게 하면 탭마다 독립적인 헤더와 히스토리를 가질 수 있습니다. 루트 레이아웃은 보통 헤더가 없어야 합니다.

- 탭 레이아웃에서 `headerShown` 옵션을 false로 설정하세요.
- URL 구조 단순화를 위해 `(group)` 라우트를 사용하세요.
- 이 구조에 맞게 기존 라우트를 삭제하거나 리팩토링해야 할 수 있습니다.

예시 구조:

```
app/
  _layout.tsx — <Tabs />
  (home)/
    _layout.tsx — <Stack />
    index.tsx — <ScrollView />
  (settings)/
    _layout.tsx — <Stack />
    index.tsx — <ScrollView />
  (home,settings)/
    info.tsx — <ScrollView /> (탭 간 공유 화면)
```

## 여러 스택을 위한 배열 라우트

`(index,settings)` 형태의 배열 라우트로 여러 스택을 만들 수 있습니다. 탭 간에 화면을 공유해야 할 때 유용합니다.

```
app/
  _layout.tsx — <Tabs />
  (index,settings)/
    _layout.tsx — <Stack />
    index.tsx — <ScrollView />
    settings.tsx — <ScrollView />
```

명시적인 앵커 라우트가 있는 특별한 레이아웃이 필요합니다:

```tsx
// app/(index,settings)/_layout.tsx
import { useMemo } from "react";
import Stack from "expo-router/stack";

export const unstable_settings = {
  index: { anchor: "index" },
  settings: { anchor: "settings" },
};

export default function Layout({ segment }: { segment: string }) {
  const screen = segment.match(/\((.*)\)/)?.[1]!;

  const options = useMemo(() => {
    switch (screen) {
      case "index":
        return { headerRight: () => <></> };
      default:
        return {};
    }
  }, [screen]);

  return (
    <Stack>
      <Stack.Screen name={screen} options={options} />
    </Stack>
  );
}
```

## 완전한 앱 구조 예시

```
app/
  _layout.tsx — <NativeTabs />
  (index,search)/
    _layout.tsx — <Stack />
    index.tsx — 메인 목록
    search.tsx — 검색 뷰
    i/[id].tsx — 상세 페이지
components/
  theme.tsx
  list.tsx
utils/
  storage.ts
  use-search.ts
```

## 레이아웃 파일

모든 디렉토리에 해당 디렉토리의 모든 라우트를 감싸는 `_layout.tsx` 파일을 가질 수 있습니다:

```tsx
// app/_layout.tsx
import { Stack } from "expo-router/stack";

export default function RootLayout() {
  return <Stack />;
}
```

```tsx
// app/(tabs)/_layout.tsx
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>홈</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

## 라우트 설정

라우트 동작 설정을 위해 `unstable_settings`를 export하세요:

```tsx
export const unstable_settings = {
  anchor: "index",
};
```

- `initialRouteName`은 v4에서 `anchor`로 이름이 변경되었습니다.

## 404 라우트

매칭되지 않는 라우트를 처리하려면 `+not-found.tsx` 파일을 만드세요:

```tsx
// app/+not-found.tsx
import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function NotFound() {
  return (
    <View>
      <Text>페이지를 찾을 수 없습니다</Text>
      <Link href="/">홈으로 가기</Link>
    </View>
  );
}
```
