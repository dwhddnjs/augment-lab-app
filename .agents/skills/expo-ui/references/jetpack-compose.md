# `@expo/ui/jetpack-compose` (Android)

Jetpack Compose + Material 3를 미러링한다. universal로 부족할 때 **`name.android.tsx`** 파일에서 사용한다. iOS를 swift-ui로 분리하면 Android도 같은 화면을 여기서 짝으로 구현하거나, **universal `.tsx`를 Android 폴백으로 공유**한다(권장 — universal `ListItem.android`가 이미 Compose로 렌더됨).

- 컴포넌트: `import { Host, ... } from '@expo/ui/jetpack-compose'`
- modifier: `import { ... } from '@expo/ui/jetpack-compose/modifiers'`

실제 export는 `node_modules/@expo/ui/build/jetpack-compose/index.d.ts` 확인.

## Host와 크기

```tsx
import { Host } from '@expo/ui/jetpack-compose';

<Host matchContents>...</Host>     {/* intrinsic */}
<Host style={{ flex: 1 }}>...</Host>  {/* 채움 */}
```

## 핵심

- 대량 리스트는 `LazyColumn`. 단, 진짜 고밀도는 RN `FlatList` 유지.
- 아이콘은 Android 벡터 드로어블/`Icon`.
- RN 섞기는 `RNHostView`.
- `useNativeState` + `'worklet'` 패턴은 iOS와 동일.

## 이 프로젝트 전략

마이페이지처럼 iOS를 swift-ui `Section`으로 분리한 화면은, Android는 **universal `List`/`ListItem` 단일 `.tsx`** 로 처리한다(섹션 헤더 없는 평면 리스트로 충분). 별도 `.android.tsx`를 만들지 않는다 — 정말 Compose 고유 UI가 필요할 때만 분리한다.

색은 hex 금지, `useTheme()` 토큰 주입.
