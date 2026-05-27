# Apple 줌 트랜지션

화면 간 이동을 위한 유연한 줌 트랜지션. iOS 18+, Expo SDK 55+, Stack 네비게이터 전용.

```tsx
import { Link } from "expo-router";
```

## 기본 줌

`Link.Trigger`에 `withAppleZoom`을 사용하면 트리거 전체 엘리먼트가 목적지 화면으로 줌됩니다:

```tsx
<Link href="/photo" asChild>
  <Link.Trigger withAppleZoom>
    <Pressable>
      <Image
        source={{ uri: "https://example.com/thumb.jpg" }}
        style={{ width: 120, height: 120, borderRadius: 12 }}
      />
    </Pressable>
  </Link.Trigger>
</Link>
```

## `Link.AppleZoom`으로 대상 지정 줌

애니메이션할 엘리먼트만 감싸세요. `Link.AppleZoom` 바깥의 형제 요소는 트랜지션에 포함되지 않습니다:

```tsx
<Link href="/photo" asChild>
  <Link.Trigger>
    <Pressable style={{ alignItems: "center" }}>
      <Link.AppleZoom>
        <Image
          source={{ uri: "https://example.com/thumb.jpg" }}
          style={{ width: 200, aspectRatio: 4 / 3 }}
        />
      </Link.AppleZoom>
      <Text>캡션 텍스트 (줌 안됨)</Text>
    </Pressable>
  </Link.Trigger>
</Link>
```

`Link.AppleZoom`은 단일 자식 엘리먼트만 허용합니다.

## 목적지 대상

목적지 화면에 `Link.AppleZoomTarget`을 사용하면 특정 엘리먼트에 줌 애니메이션을 맞출 수 있습니다:

```tsx
// 목적지 화면 (예: app/photo.tsx)
import { Link } from "expo-router";

export default function PhotoScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Link.AppleZoomTarget>
        <Image
          source={{ uri: "https://example.com/full.jpg" }}
          style={{ width: "100%", aspectRatio: 4 / 3 }}
        />
      </Link.AppleZoomTarget>
      <Text>아래 사진 설명</Text>
    </View>
  );
}
```

대상이 없으면 줌이 목적지 화면 전체를 채우도록 애니메이션됩니다.

## 커스텀 정렬 사각형

목적지에서 줌이 어디에 착지할지 수동으로 제어하려면 `Link.AppleZoomTarget` 대신 `alignmentRect`를 사용하세요:

```tsx
<Link.AppleZoom alignmentRect={{ x: 0, y: 0, width: 200, height: 300 }}>
  <Image source={{ uri: "https://example.com/thumb.jpg" }} />
</Link.AppleZoom>
```

좌표는 목적지 화면의 좌표계를 기준으로 합니다. 가능하면 `Link.AppleZoomTarget`을 선호하고, 대상 엘리먼트를 React 컴포넌트로 사용할 수 없을 때만 `alignmentRect`를 사용하세요.

## 닫기 제어

줌 화면은 기본적으로 인터랙티브 닫기 제스처를 지원합니다 (핀치, 상단까지 스크롤 시 아래로 스와이프, 왼쪽 가장자리에서 스와이프). 목적지 화면에서 `usePreventZoomTransitionDismissal`로 이를 제어할 수 있습니다.

### 모든 닫기 제스처 비활성화

```tsx
import { usePreventZoomTransitionDismissal } from "expo-router";

export default function PhotoScreen() {
  usePreventZoomTransitionDismissal();
  return <Image source={{ uri: "https://example.com/full.jpg" }} />;
}
```

### 특정 영역으로 닫기 제한

스크롤 가능한 콘텐츠와의 충돌을 방지하려면 `unstable_dismissalBoundsRect` 사용:

```tsx
usePreventZoomTransitionDismissal({
  unstable_dismissalBoundsRect: {
    minX: 0,
    minY: 0,
    maxX: 300,
    maxY: 300,
  },
});
```

목적지에 줌 가능한 스크롤 뷰가 있을 때 유용합니다 — 시스템이 닫기 제스처보다 해당 스크롤 뷰를 우선시합니다.

## Link.Preview와 함께 사용

줌 트랜지션은 길게 누르기 프리뷰와 함께 사용할 수 있습니다:

```tsx
<Link href="/photo" asChild>
  <Link.Trigger withAppleZoom>
    <Pressable>
      <Image
        source={{ uri: "https://example.com/thumb.jpg" }}
        style={{ width: 120, height: 120 }}
      />
    </Pressable>
  </Link.Trigger>
  <Link.Preview />
</Link>
```

## 모범 사례

**좋은 사용 사례:**
- 썸네일 → 전체 이미지 (갤러리, 프로필 사진)
- 카드 → 유사한 시각적 콘텐츠가 있는 상세 화면
- 출발지와 목적지의 가로세로 비율이 비슷한 경우

**피해야 할 것:**
- 가로로 꽉 찬 얇은 리스트 행을 줌 소스로 사용 — 트랜지션이 어색하게 보입니다
- `alignmentRect` 없이 출발지와 목적지의 가로세로 비율이 맞지 않는 경우
- 시트나 팝오버에서 줌 사용 — Stack 네비게이터에서만 작동합니다
- 네비게이션 바 숨기기 — 트랜지션 중 헤더 가시성 관련 알려진 문제가 있습니다

**팁:**
- 항상 닫기 또는 뒤로 버튼을 제공하세요 — 닫기 제스처는 직관적으로 알기 어렵습니다.
- 목적지에 줌 가능한 스크롤 뷰가 있다면 제스처 충돌을 피하기 위해 `unstable_dismissalBoundsRect`를 사용하세요.
- 소스 뷰가 탭 대상과 일치할 필요는 없습니다 — `Link.AppleZoom`으로 감싼 엘리먼트만 애니메이션됩니다.
- 소스가 화면 밖으로 스크롤된 경우, 트랜지션은 화면 중앙에서 줌됩니다.
