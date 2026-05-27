# CSS 그라디언트

> **New Architecture 전용**: CSS 그라디언트는 React Native의 New Architecture(Fabric)가 필요합니다. 구 아키텍처나 Expo Go에서는 사용 불가합니다.

`experimental_backgroundImage` 스타일 속성으로 CSS 그라디언트를 사용하세요.

## 선형 그라디언트

```tsx
// 위에서 아래로
<View style={{
  experimental_backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)'
}} />

// 왼쪽에서 오른쪽으로
<View style={{
  experimental_backgroundImage: 'linear-gradient(to right, #ff0000 0%, #0000ff 100%)'
}} />

// 대각선
<View style={{
  experimental_backgroundImage: 'linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)'
}} />

// 각도 값 사용
<View style={{
  experimental_backgroundImage: 'linear-gradient(135deg, transparent 0%, black 100%)'
}} />
```

## 방사형 그라디언트

```tsx
// 중앙에서 원형
<View style={{
  experimental_backgroundImage: 'radial-gradient(circle at center, rgba(255, 0, 0, 1) 0%, rgba(0, 0, 255, 1) 100%)'
}} />

// 타원형
<View style={{
  experimental_backgroundImage: 'radial-gradient(ellipse at center, #fff 0%, #000 100%)'
}} />

// 위치 지정
<View style={{
  experimental_backgroundImage: 'radial-gradient(circle at top left, #ff0000 0%, transparent 70%)'
}} />
```

## 여러 그라디언트 겹치기

쉼표로 구분해 여러 그라디언트를 쌓을 수 있습니다:

```tsx
<View style={{
  experimental_backgroundImage: `
    linear-gradient(to bottom, transparent 0%, black 100%),
    radial-gradient(circle at top right, rgba(255, 0, 0, 0.5) 0%, transparent 50%)
  `
}} />
```

## 자주 쓰는 패턴

### 이미지 위 오버레이

```tsx
<View style={{ position: 'relative' }}>
  <Image source={{ uri: '...' }} style={{ width: '100%', height: 200 }} />
  <View style={{
    position: 'absolute',
    inset: 0,
    experimental_backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 50%)'
  }} />
</View>
```

### 프로스티드 글래스 효과

```tsx
<View style={{
  experimental_backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  backdropFilter: 'blur(10px)',
}} />
```

### 버튼 그라디언트

```tsx
<Pressable style={{
  experimental_backgroundImage: 'linear-gradient(to bottom, #4CAF50 0%, #388E3C 100%)',
  padding: 16,
  borderRadius: 8,
}}>
  <Text style={{ color: 'white', textAlign: 'center' }}>제출</Text>
</Pressable>
```

## 주의사항

- `expo-linear-gradient`는 사용하지 마세요 — CSS 그라디언트를 사용하세요.
- 그라디언트는 객체가 아닌 문자열입니다.
- 투명도에는 `rgba()`를 사용하거나 `transparent` 키워드를 사용하세요.
- 색상 정지점은 퍼센트를 사용합니다 (0%, 50%, 100%).
- 방향 키워드: `to top`, `to bottom`, `to left`, `to right`, `to top left` 등
- 각도 값: `45deg`, `90deg`, `135deg` 등
