# Expo Router에서 폼 시트

Expo Router의 Stack 네비게이터와 react-native-screens를 사용해 하단 버튼이 있는 폼 시트를 구현하는 방법입니다.

## 개요

폼 시트는 화면 하단에서 카드 형태로 슬라이드 올라오는 모달 프레젠테이션입니다. 다음 경우에 적합합니다:

- 빠른 액션 및 확인
- 설정 패널
- 로그인/회원가입 플로우
- 커스텀 콘텐츠가 있는 액션 시트

**요구사항:**

- Expo Router Stack 네비게이터

## 기본 사용법

### 하단 버튼이 있는 폼 시트

투명 배경과 시트 프레젠테이션으로 Stack.Screen 설정하기:

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="about"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.25],
          headerTransparent: true,
          contentStyle: { backgroundColor: "transparent" },
          sheetGrabberVisible: true,
        }}
      >
        <Stack.Header style={{ backgroundColor: "transparent" }}></Stack.Header>
      </Stack.Screen>
    </Stack>
  );
}
```

### 폼 시트 화면 콘텐츠

> Expo SDK 55 이상 필요.

`flex: 1`을 사용해 콘텐츠가 가용 공간을 채우도록 하여 하단 버튼 위치 지정이 가능합니다:

```tsx
// app/about.tsx
import { View, Text, StyleSheet } from "react-native";

export default function AboutSheet() {
  return (
    <View style={styles.container}>
      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        <Text>시트 콘텐츠</Text>
      </View>

      {/* 하단 버튼 - 하단에 고정 */}
      <View style={styles.footer}>
        <Text>하단 버튼 콘텐츠</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 16,
  },
});
```

### 아래 콘텐츠와 상호작용 가능한 폼 시트

`sheetLargestUndimmedDetentIndex` (0부터 시작)를 사용해 폼 시트 뒤의 콘텐츠와 상호작용할 수 있게 합니다 — 예: 시트 아래의 지도를 패닝할 수 있도록. `1`로 설정하면 처음 두 detent에서는 상호작용이 가능하지만 세 번째에서는 흐려집니다.

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="info-sheet"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.2, 0.5, 1.0],
          sheetLargestUndimmedDetentIndex: 1,
          /* 다른 옵션들 */
        }}
      />
    </Stack>
  )
}
```

## 주요 옵션

| 옵션 | 타입 | 설명 |
| --------------------- | ---------- | ----------------------------------------------------------- |
| `presentation` | `string` | 시트 프레젠테이션을 위해 `'formSheet'`으로 설정 |
| `sheetGrabberVisible` | `boolean` | 시트 상단에 드래그 핸들 표시 |
| `sheetAllowedDetents` | `number[]` | detent 높이 배열 (0-1 범위, 예: `[0.25]`는 25%) |
| `headerTransparent` | `boolean` | 헤더 배경을 투명하게 만들기 |
| `contentStyle` | `object` | 화면 콘텐츠 컨테이너의 스타일 객체 |
| `title` | `string` | 화면 타이틀 (타이틀 없애려면 `''`로 설정) |

## 자주 쓰는 Detent 값

- `[0.25]` - 4분의 1 시트 (간단한 액션)
- `[0.5]` - 반 시트 (중간 콘텐츠)
- `[0.75]` - 4분의 3 시트 (상세 폼)
- `[0.25, 0.5, 1]` - 여러 지점 (확장 가능한 시트)

## 완전한 예시

```tsx
// _layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "홈" }} />
      <Stack.Screen
        name="confirm"
        options={{
          contentStyle: { backgroundColor: "transparent" },
          presentation: "formSheet",
          title: "",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.25],
          headerTransparent: true,
        }}
      >
        <Stack.Header style={{ backgroundColor: "transparent" }}>
          <Stack.Header.Right />
        </Stack.Header>
      </Stack.Screen>
    </Stack>
  );
}
```

```tsx
// app/confirm.tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function ConfirmSheet() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>액션 확인</Text>
        <Text style={styles.description}>
          정말 진행하시겠습니까?
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>
        <Pressable style={styles.confirmButton} onPress={() => router.back()}>
          <Text style={styles.confirmText}>확인</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
});
```

## 문제 해결

### 콘텐츠가 시트를 채우지 않는 경우

루트 View에 `flex: 1`이 있는지 확인하세요:

```tsx
<View style={{ flex: 1 }}>{/* 콘텐츠 */}</View>
```

### 시트 배경이 비쳐 보이는 경우

옵션에 `contentStyle: { backgroundColor: 'transparent' }`를 설정하고, 원하는 배경색은 콘텐츠 컨테이너에 직접 스타일링하세요.
