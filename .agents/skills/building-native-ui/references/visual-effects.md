# 시각 효과

## 배경 블러

블러 효과에는 `expo-blur`를 사용하세요. systemMaterial 틴트는 다크모드에 자동 적응하므로 선호하세요.

```tsx
import { BlurView } from "expo-blur";

<BlurView tint="systemMaterial" intensity={100} />;
```

### 틴트 옵션

```tsx
// 시스템 재질 (다크모드에 적응)
<BlurView tint="systemMaterial" />
<BlurView tint="systemThinMaterial" />
<BlurView tint="systemUltraThinMaterial" />
<BlurView tint="systemThickMaterial" />
<BlurView tint="systemChromeMaterial" />

// 기본 틴트
<BlurView tint="light" />
<BlurView tint="dark" />
<BlurView tint="default" />

// 강조 (더 뚜렷함)
<BlurView tint="prominent" />

// 매우 밝음/어두움
<BlurView tint="extraLight" />
```

### 강도

`intensity`로 블러 강도 조절 (0-100):

```tsx
<BlurView tint="systemMaterial" intensity={50} />  // 은은함
<BlurView tint="systemMaterial" intensity={100} /> // 최대
```

### 둥근 모서리

BlurView에서 둥근 모서리를 클리핑하려면 `overflow: 'hidden'`이 필요합니다:

```tsx
<BlurView
  tint="systemMaterial"
  intensity={100}
  style={{
    borderRadius: 16,
    overflow: 'hidden',
  }}
/>
```

### 오버레이 패턴

콘텐츠 위에 블러를 오버레이하는 일반적인 패턴:

```tsx
<View style={{ position: 'relative' }}>
  <Image source={{ uri: '...' }} style={{ width: '100%', height: 200 }} />
  <BlurView
    tint="systemUltraThinMaterial"
    intensity={80}
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
    }}
  >
    <Text style={{ color: 'white' }}>캡션</Text>
  </BlurView>
</View>
```

## 글래스 효과 (iOS 26+)

iOS 26+에서 리퀴드 글래스 배경에는 `expo-glass-effect`를 사용하세요.

```tsx
import { GlassView } from "expo-glass-effect";

<GlassView style={{ borderRadius: 16, padding: 16 }}>
  <Text>글래스 안의 콘텐츠</Text>
</GlassView>
```

### 인터랙티브 글래스

버튼과 누를 수 있는 글래스에는 `isInteractive` 추가:

```tsx
import { GlassView } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { PlatformColor } from "react-native";

<GlassView isInteractive style={{ borderRadius: 50 }}>
  <Pressable style={{ padding: 12 }} onPress={handlePress}>
    <SymbolView name="plus" tintColor={PlatformColor("label")} size={36} />
  </Pressable>
</GlassView>
```

### 글래스 버튼

리퀴드 글래스 버튼 만들기:

```tsx
function GlassButton({ icon, onPress }) {
  return (
    <GlassView isInteractive style={{ borderRadius: 50 }}>
      <Pressable style={{ padding: 12 }} onPress={onPress}>
        <SymbolView name={icon} tintColor={PlatformColor("label")} size={24} />
      </Pressable>
    </GlassView>
  );
}

// 사용법
<GlassButton icon="plus" onPress={handleAdd} />
<GlassButton icon="gear" onPress={handleSettings} />
```

### 글래스 카드

```tsx
<GlassView style={{ borderRadius: 20, padding: 20 }}>
  <Text style={{ fontSize: 18, fontWeight: '600', color: PlatformColor("label") }}>
    카드 제목
  </Text>
  <Text style={{ color: PlatformColor("secondaryLabel"), marginTop: 8 }}>
    카드 내용이 여기에 들어갑니다
  </Text>
</GlassView>
```

### 사용 가능 여부 확인

```tsx
import { isLiquidGlassAvailable } from "expo-glass-effect";

if (isLiquidGlassAvailable()) {
  // GlassView 사용
} else {
  // BlurView 또는 단색 배경으로 대체
}
```

### 폴백 패턴

```tsx
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";

function AdaptiveGlass({ children, style }) {
  if (isLiquidGlassAvailable()) {
    return <GlassView style={style}>{children}</GlassView>;
  }

  return (
    <BlurView tint="systemMaterial" intensity={80} style={style}>
      {children}
    </BlurView>
  );
}
```

## 글래스 배경이 있는 시트

iOS 26+에서 시트 배경을 리퀴드 글래스로 만들기:

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

## 모범 사례

- 자동 다크모드 지원을 위해 `systemMaterial` 틴트를 사용하세요.
- BlurView에서 둥근 모서리를 위해 항상 `overflow: 'hidden'`을 설정하세요.
- 버튼과 누를 수 있는 요소에는 GlassView에 `isInteractive`를 사용하세요.
- `isLiquidGlassAvailable()`을 확인하고 폴백을 제공하세요.
- 블러 뷰 중첩을 피하세요 (성능 영향).
- 가독성을 위해 블러 강도를 적절하게 유지하세요 (50-100).
