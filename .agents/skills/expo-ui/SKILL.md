---
name: expo-ui
description: "@expo/ui로 진짜 네이티브 UI를 만드는 가이드 — iOS 전용 앱이며 SwiftUI로 렌더된다. universal 컴포넌트(Host/List/ListItem/Picker/Switch/Button/Text/Icon...)를 1순위로, 부족할 때만 @expo/ui/swift-ui 트리로 내려간다. 리스트·폼·토글·피커·시트·메뉴 등 컨트롤 UI를 추가/리뷰할 때 읽을 것."
version: 1.0.0
license: MIT
---

# @expo/ui 가이드

이 프로젝트는 **iOS 전용**(Android·웹 미지원)이며 진짜 네이티브 룩앤필이 hero다.
컨트롤·리스트·폼·토글·피커·시트·메뉴를 만들 때는 **React Native(`View`/`Pressable`)로 직접 그리지 말고 `@expo/ui`를 먼저** 검토한다.

설치 버전: `@expo/ui@~56.0.14` (Expo SDK 56). API의 **진실의 원천은 설치된 타입**이다 — `node_modules/@expo/ui/build/<tree>/...index.d.ts`를 우선 확인하고, 모호하면 `https://docs.expo.dev/versions/v56.0.0/sdk/ui/` 를 본다.

## 의사결정 3단계 — 항상 위에서부터

1. **universal `@expo/ui`** (기본·1순위) — `import { Host, List, ListItem, Picker, Switch, Button, Text, Icon } from '@expo/ui'`.
   SwiftUI로 렌더된다.
   → 자세히: `./references/universal.md`
2. **swift-ui 트리** (universal로 부족할 때만) — `@expo/ui/swift-ui`.
   universal에 없는 컴포넌트(예: `Section` 헤더, `Form`, `Menu`, `Alert`)가 필요할 때 쓴다.
   → `./references/swift-ui.md`
3. **드롭인 교체** (마이그레이션) — `@expo/ui/community/<name>`로 RN 커뮤니티 라이브러리를 네이티브 구현으로 교체.
   → `./references/drop-in-replacements.md`

위 3단계로도 안 되는 진짜 커스텀 UI만 RN(`View`/`Text`/`Pressable`/`FlatList`) + 테마 토큰으로 그린다.

iOS 전용이므로 **`.android.tsx` 분기 파일을 만들지 않는다.** `.ios.tsx` 접미사도 불필요하다 — 그냥 `name.tsx`로 둔다.

**헤더·라우팅** 정책은 `./references/headers.md`를 따른다(화면 헤더는 native `Stack.Screen` 기본, 탭 그룹 구조, 탭 아이콘 sf, `*.web` 금지 등).

## 핵심 컴포넌트 (universal)

| 컴포넌트 | 용도 |
|---|---|
| `Host` | 모든 네이티브 트리의 root 래퍼. `matchContents`(내용 크기) / `style={{ flex: 1 }}`(전체) |
| `List` + `ListItem` | SwiftUI `List`. `ListItem`은 `leading`/`trailing`/`supportingText` 슬롯 + `onPress` |
| `Picker` | 단일 선택. `selectedValue`/`onValueChange` + `Picker.Item`, `appearance='menu'|'wheel'` |
| `Switch` | 토글. `value`/`onValueChange`/`label` |
| `Button` | 네이티브 버튼 |
| `Text` / `Icon` | 텍스트 / 아이콘 |
| `BottomSheet` | 네이티브 시트 |
| `Column`/`Row`/`Spacer` | 레이아웃 (SwiftUI VStack/HStack 대응) |

## 철칙

- **모든 트리는 `Host`로 감싼다.** SwiftUI 호스트는 bare 문자열을 못 그리므로 텍스트는 `Text`로 감싼다.
- **`List`는 소규모(설정·폼)용.** 수백 개 이상 고밀도 스크롤 목록은 RN `FlatList`를 유지한다(`List`의 각 행이 JS 스레드 비용을 가짐).
- **섹션 헤더가 필요하면** universal로는 안 되므로 swift-ui `Section`으로 내려간다.
- **색은 테마 토큰만.** hex 하드코딩 금지. swift-ui modifier(`tint`/`foregroundStyle`)에도 `useTheme()` 색을 주입한다.
- **이미지는 `expo-image`**, SF Symbols는 `@expo/ui`의 `Icon` 또는 `expo-image`의 `source="sf:<name>"`.
- 텍스트 입력의 동기·무깜빡 업데이트가 필요하면 `useNativeState` + `'worklet'`(`react-native-worklets`).

## 이 프로젝트의 실제 예시

- `src/features/mypage/screens/mypage-screen.tsx` — swift-ui `List(insetGrouped)` + `Section` + `Picker` (진짜 iOS 설정앱).
- `src/components/ui/glass-button.tsx` — swift-ui `Button` + `glassEffect`.
