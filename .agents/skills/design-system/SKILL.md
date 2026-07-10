---
name: design-system
description: "이 앱의 디자인 시스템 상세 — useTheme() 색상 토큰, 타이포(ThemedText type), 간격·반경, 리퀴드글라스(GlassSurface), 이미지·아이콘 규칙. RN 단계에서 직접 UI를 그리거나 색/타이포/글라스/아이콘을 다룰 때 읽을 것. 진실의 원천은 src/constants/theme.ts."
version: 1.0.0
license: MIT
---

# 디자인 시스템

**치지직 톤 민트(#00E994 다크 / #18A368 라이트) 액센트. 다크모드가 hero.**
**모든 색상·간격·반경·그림자 값은 `src/constants/theme.ts` 토큰만 사용. 하드코딩 금지.** 토큰의 진실의 원천은 항상 `theme.ts`.

## 3대 원칙

1. **미니멀** — 장식 최소화. 위계는 구분선·여백·표면 레이어로. 강조색(민트)은 핵심 액션 1~2곳에만. 큰 타이틀은 native large title에 위임.
2. **네이티브 우선** — "iOS 내장 UI / `@expo/ui`로 되는가?"를 먼저 검토 (expo-ui skill).
3. **리퀴드글래스** — 떠 있는 표면(시트·오버레이·툴바·플로팅)은 `@/components/ui/glass-surface`의 `GlassSurface`로 통일.

## `useTheme()` 토큰

`const { mode, colors, typography, radius, elevation } = useTheme();`

- `colors.surface.base/raised/sunken/overlay` — 배경 레이어
- `colors.text.primary/secondary/tertiary/disabled/inverse/onAccent` — 텍스트
- `colors.border.default/subtle/strong` — 테두리
- `colors.accent.default/hover/pressed/subtle/onAccent` — 민트 액센트
- `colors.status.success/warning/danger/info` — 상태색(각 `.default`/`.subtle`)

## 타이포 (`ThemedText type=` / `typography.*`)

| type | size | weight | 용도 |
|---|---|---|---|
| `display` | 48 | 700 | 대형 제목 |
| `title` | 32 | 700 | 섹션 제목 |
| `heading` | 22 | 600 | 화면 제목 |
| `body` | 16 | 500 | 본문 |
| `label` | 14 | 600 | 버튼·칩·소제목 |
| `caption` | 12 | 500 | 부가 설명 |
| `code` | 13 | 500 | 코드·모노 |
| `link` | 16 | 500 | body + accent |

## 컴포넌트 사용 규칙 (RN 단계에서만)

- 텍스트: `ThemedText` — `type` + `color`(`primary|secondary|tertiary|disabled|inverse|onAccent|accent`)
- 뷰: `ThemedView` — `surface`(`base|raised|sunken|overlay`) + `elevation`(`0~3`)
- 색상 직접 접근: `const { colors } = useTheme()` 후 인라인 스타일

## 간격·반경·기타

- `Spacing.*` — 여백/패딩(`half`=2 … `six`=64)
- `Radius.*` — `borderRadius`에 **반드시** 토큰(`none`/`sm`/`md`/`lg`/`xl`/`full`). 숫자 리터럴·`Spacing` 값 금지.
- 둥근 모서리(캡슐 아님)에는 `{ borderCurve: 'continuous' }`.
- 그림자는 `elevation` 토큰 또는 CSS `boxShadow`. legacy RN shadow/`elevation` 스타일 prop 금지.
- `SafeAreaView`(RN) 금지 → 헤더/탭/`contentInsetAdjustmentBehavior` 또는 `react-native-safe-area-context`.

## 절대 금지

- 색상 hex 하드코딩 / `StyleSheet.create` 안 동적 색상
- `borderRadius`에 숫자 리터럴 또는 `Spacing` 값

## 리퀴드글라스 (Liquid Glass)

**떠 있는 표면(시트 배경·오버레이·툴바·플로팅 트레이)은 `GlassSurface` 사용. 직접 `GlassView`/`BlurView` 금지.**

- iOS 26+ → `expo-glass-effect` 네이티브 글라스 · 구버전/안드로이드 → `expo-blur` `BlurView` 폴백 · 그 외 → `colors.surface.overlay` 단색
- tint는 테마 토큰만. **본문 카드·섹션·고밀도 목록에 글라스 남발 금지**(성능). 화면 위에 떠 있는 선택 트레이(`ItemSlotGrid`)는 허용.
- `glassStyle='clear'`(얇은 레이어) / `'regular'`(표준 패널)

## 이미지·아이콘

- 원격 이미지: `expo-image`의 `Image` · SF Symbols: `@expo/ui` `Icon` 또는 `expo-image` `source="sf:name"`
- CDragon 챔피언 클래스 아이콘: `championClassIconUrl(tag)`(`src/lib/ddragon.ts`)
