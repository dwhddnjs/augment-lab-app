# 애니메이션

Reanimated v4를 사용하세요. React Native 내장 Animated API는 사용하지 마세요.

## 진입/퇴장 애니메이션

진입/퇴장 애니메이션에 Animated.View를 사용하세요. 레이아웃 애니메이션으로 상태 변화를 애니메이션할 수 있습니다.

```tsx
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

function App() {
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition}
    />
  );
}
```

## 스크롤 기반 애니메이션

Reanimated 훅을 사용해 고성능 스크롤 애니메이션 만들기:

```tsx
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

function Page() {
  const ref = useAnimatedRef();
  const scroll = useScrollViewOffset(ref);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scroll.value, [0, 30], [0, 1], "clamp"),
  }));

  return (
    <Animated.ScrollView ref={ref}>
      <Animated.View style={style} />
    </Animated.ScrollView>
  );
}
```

## 자주 쓰는 애니메이션 프리셋

### 진입 애니메이션

- `FadeIn`, `FadeInUp`, `FadeInDown`, `FadeInLeft`, `FadeInRight`
- `SlideInUp`, `SlideInDown`, `SlideInLeft`, `SlideInRight`
- `ZoomIn`, `ZoomInUp`, `ZoomInDown`
- `BounceIn`, `BounceInUp`, `BounceInDown`

### 퇴장 애니메이션

- `FadeOut`, `FadeOutUp`, `FadeOutDown`, `FadeOutLeft`, `FadeOutRight`
- `SlideOutUp`, `SlideOutDown`, `SlideOutLeft`, `SlideOutRight`
- `ZoomOut`, `ZoomOutUp`, `ZoomOutDown`
- `BounceOut`, `BounceOutUp`, `BounceOutDown`

### 레이아웃 애니메이션

- `LinearTransition` — 부드러운 선형 보간
- `SequencedTransition` — 순차적 속성 변화
- `FadingTransition` — 상태 간 페이드

## 애니메이션 커스터마이징

```tsx
<Animated.View
  entering={FadeInDown.duration(500).delay(200)}
  exiting={FadeOut.duration(300)}
/>
```

### 수정자

```tsx
// 지속 시간 (밀리초)
FadeIn.duration(300);

// 시작 전 딜레이
FadeIn.delay(100);

// 스프링 물리
FadeIn.springify();
FadeIn.springify().damping(15).stiffness(100);

// 이징 커브
FadeIn.easing(Easing.bezier(0.25, 0.1, 0.25, 1));

// 체이닝
FadeInDown.duration(400).delay(200).springify();
```

## 공유 값 애니메이션

애니메이션을 명령형으로 제어하기:

```tsx
import {
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const offset = useSharedValue(0);

// 스프링 애니메이션
offset.value = withSpring(100);

// 타이밍 애니메이션
offset.value = withTiming(100, { duration: 300 });

// 스타일에서 사용
const style = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));
```

## 제스처 애니메이션

React Native Gesture Handler와 결합하기:

```tsx
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

function DraggableBox() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.box, style]} />
    </GestureDetector>
  );
}
```

## 키보드 애니메이션

키보드 높이 변화에 맞춰 애니메이션하기:

```tsx
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";

function KeyboardAwareView() {
  const keyboard = useAnimatedKeyboard();

  const style = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));

  return <Animated.View style={style}>{/* 콘텐츠 */}</Animated.View>;
}
```

## 리스트 아이템 순차 애니메이션

딜레이를 주어 리스트 아이템 애니메이션하기:

```tsx
{
  items.map((item, index) => (
    <Animated.View
      key={item.id}
      entering={FadeInUp.delay(index * 50)}
      exiting={FadeOutUp}
    >
      <ListItem item={item} />
    </Animated.View>
  ));
}
```

## 모범 사례

- 상태 변화에 진입/퇴장 애니메이션을 추가하세요.
- 리스트에서 아이템이 추가/삭제될 때 레이아웃 애니메이션을 사용하세요.
- 스크롤 기반 애니메이션에는 `useAnimatedStyle`을 사용하세요.
- 경계가 있는 값에는 "clamp"와 함께 `interpolate`를 선호하세요.
- PlatformColors는 reanimated 뷰나 스타일에 전달할 수 없습니다. 정적 색상을 사용하세요.
- 반응성 있는 느낌을 위해 애니메이션은 300ms 이하로 유지하세요.
- 자연스러운 움직임을 위해 스프링 애니메이션을 사용하세요.
- 가능하면 레이아웃 속성(width, height) 애니메이션은 피하고 transform을 선호하세요.
