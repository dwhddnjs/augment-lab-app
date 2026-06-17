# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

@AGENTS.md

## 플랜 문서 저장

플랜모드로 작성한 계획 문서는 **매번** `docs/plans/<YYYY-MM-DD>-<주제>.md` 형식으로 저장할 것. 폴더가 없으면 생성.

## 증강 데이터 변경 시 검수 페이지 갱신

`src/features/augments/data/augments.{ko,en}.json`을 **수정·추가·삭제할 때마다** 검수 페이지를 반드시 재생성할 것:

```bash
node scripts/gen-augment-check.mjs   # → docs/augment-check.html
```

- 검수 페이지는 ko/en을 `id`로 병합해 199개 증강을 rarity별로 보여주고, 앱과 동일한 `augmentImageUrl(large)` 규칙으로 CDragon 아이콘을 렌더한다.
- 같은 아이콘 파일을 공유하는 증강은 **"공유" 배지**로 표시(오류 아님).
- 아이콘 경로 원칙: **ARAM Mayhem 증강은 `.../UX/Kiwi/Augments/Icons/...` 폴더 사용**. `Cherry`/`Strawberry`(Arena) 폴더를 쓰지 말 것. CDragon `cherry-augments.json`에서 rarity(`kSilver`/`kGold`/`kPrismatic`)가 데이터와 일치하는 `Kiwi` 항목을 정답으로 삼는다.
- 데이터 변경 후 `docs/augment-check.html`도 함께 커밋할 것.

## UI 작업 — @expo/ui 우선

**UI(컴포넌트·리스트·폼·컨트롤·시트·메뉴) 작업 전 반드시 `.agents/skills/expo-ui/SKILL.md`를 읽을 것.**

진짜 네이티브 룩앤필이 hero다. **iOS·Android 전용**(웹 미지원). React Native로 직접 그리기 전에 항상 위 단계부터 검토하고, 불가능할 때만 내려간다:

1. **네이티브 셸** — 헤더·탭·검색바·모달/시트는 Expo Router 네이티브. 탭바는 `NativeTabs`(`expo-router/unstable-native-tabs`). [헤더 정책](#헤더-정책) 준수.
2. **universal `@expo/ui`** — 리스트·폼·토글·버튼·피커·시트 등은 `import { Host, List, ListItem, Picker, Switch, Button, Text, Icon } from '@expo/ui'`. **단일 파일**로 iOS=SwiftUI, Android=Compose 렌더. 1순위 기본값.
3. **플랫폼 트리** — universal로 부족할 때만(섹션 헤더 `Section`, `Form`, `Menu`, `Alert` 등). iOS `@expo/ui/swift-ui`(+`/modifiers`), Android `@expo/ui/jetpack-compose`. 이때만 `name.ios.tsx` / `name.android.tsx`로 분리.
4. **드롭인 교체** — RN 커뮤니티 라이브러리 마이그레이션은 `@expo/ui/community/*`.
5. **RN(최후 수단)** — 위로 안 되는 커스텀 UI만 `View`/`Text`/`Pressable`/`FlatList`/`ScrollView` + 테마 토큰. **이때만** `ThemedText`/`ThemedView`/`useTheme` 사용.
6. **이미지·아이콘** — 원격 이미지는 `expo-image`의 `Image`. 아이콘은 `@expo/ui`의 `Icon` 또는 `expo-image`의 `source="sf:<name>"`(SF Symbols).

모든 트리는 `Host`로 감싼다. 고밀도 대량 스크롤 목록은 `@expo/ui` `List` 대신 RN `FlatList` 유지. 색·tint는 테마 토큰만 주입(hex 금지). 실제 API는 설치된 타입(`node_modules/@expo/ui/build/...index.d.ts`)이 진실의 원천.

마이페이지가 이 정책의 레퍼런스 구현이다: `src/features/mypage/screens/`.

### 헤더 정책

화면 헤더는 **Expo Router `Stack.Screen`의 native 헤더를 기본**으로 사용한다. 커스텀 헤더(직접 그린 타이틀/뒤로가기) 지양:

- 각 탭을 그룹+자체 `Stack`으로 구성한다(`(home)`/`(community)`/`(mypage)`). `NativeTabs.Trigger`의 `name`은 그룹명을 가리킨다.
- 헤더 색은 루트 `_layout.tsx`의 `ThemeProvider`가 주입. 스택 `screenOptions`로 동작만 제어(`headerLargeTitle`/`headerTransparent`/`headerTintColor`). hex 하드코딩 금지.
- 목록형 화면은 `headerLargeTitle: true`. RN 스크롤뷰가 첫 자식이면 `contentInsetAdjustmentBehavior="automatic"`.
- 몰입형 상세는 `headerTransparent: true` + 본문이 헤더 뒤로 스크롤. 스크롤에 따른 헤더 페이드인은 `headerBackground`/`headerTitle`에 reanimated `Animated.View`/`Animated.Text` 주입.
- 모달(`presentation: 'modal'`)도 native 헤더. 검색은 직접 그리지 말고 `headerSearchBarOptions`, 닫기는 `headerLeft` 취소 버튼. grabber는 native 시트가 제공.
- `headerShown: false`는 **몰입형 풀스크린 플로우(드래프트 진행/결과 등)에서만** 허용.

### 플랫폼 파일 원칙

- **웹 미지원** — `*.web.tsx` / `*.web.ts` 금지. `npm run web` 미사용.
- **universal 우선, 필요시만 분리** — `@expo/ui` universal 단일 파일이 기본. universal로 부족하거나 플랫폼 고유 UI가 필요할 때만 `name.ios.tsx`(swift-ui) / `name.android.tsx`(jetpack-compose)로 분리. iOS만 분리하고 Android는 universal `.tsx`를 폴백으로 공유해도 된다(예: 마이페이지).

### i18n / 로케일 원칙

글로벌 서비스이므로 **모든 사용자 노출 텍스트는 로케일 분기**. 하드코딩 금지:

- 파일 상단에 `const t = { ko: {...}, en: {...} }` dictionary 정의 → 컴포넌트 안 `const translate = useTranslation(t)` → `translate('key')`. 키 누락 시 `en` 폴백.
- 데이터(챔피언/아이템/증강 이름)는 `useChampions()` 등 훅이 이미 로케일 분기.
- `useLocale()`(`src/hooks/use-locale.ts`)이 현재 로케일 반환(`'ko' | 'en'`).

## 명령어

```bash
npm install            # 의존성 설치
npm start              # Expo 개발 서버 시작
npm run ios            # iOS 시뮬레이터
npm run android        # Android 에뮬레이터
npm run lint           # ESLint
```

테스트 러너 미설정.

## 아키텍처

**Expo SDK 56 / React 19 / React Native 0.85** 기반 iOS·Android 앱(웹 미지원). 파일 기반 라우팅(Expo Router v56), `experiments.typedRoutes` + `reactCompiler` 활성.

### 폴더 구조 — 필수 규칙

```
src/
├── app/                        # Expo Router 라우트만 (얇게 — screens에서 import)
├── features/                   # 도메인별 응집 모듈
│   └── <도메인>/
│       ├── screens/            # 라우트가 렌더하는 화면 단위 (*-screen.tsx)
│       ├── components/         # 화면을 구성하는 작은 조각 (카드/타일/슬롯/메뉴)
│       ├── hooks/              # 도메인 훅
│       ├── data/               # *.ko.json / *.en.json
│       └── types.ts
├── components/                 # 도메인 무관 공용 UI (themed/, navigation/, ui/)
├── hooks/                      # 여러 feature 공유 글로벌 훅 (테마/로케일/색상스킴)
├── lib/                        # 외부 클라이언트 + 순수 유틸 (supabase/ddragon/i18n/hangul)
├── constants/theme.ts
└── styles/global.css
```

경계 규칙:
1. `src/app/` — 라우트 파일만. UI는 `features/*/screens`에서 import.
2. `features/<도메인>/` — **screens(화면)와 components(조각)를 분리**. 다른 feature를 import하지 않는다(공유는 `hooks/`·`lib/`로 승격).
3. `src/components/` — 도메인 무관 공용 프리미티브만. feature를 import하지 않는다.
4. `src/hooks/` — 여러 feature 공유 글로벌 훅만.
5. `src/lib/` — 외부 클라이언트 + 순수 유틸(React 훅 아님. `i18n.ts`의 `useTranslation`만 예외).
6. 공용 UI는 2개 이상 feature에서 쓰일 때 `components/ui`로 승격.
7. `src/types/` 폴더 만들지 말 것 — 타입은 사용처(feature)와 동거.

### 라우팅

- `_layout.tsx` — 루트(`ThemeProvider` 헤더 색 주입 + 스플래시/탭 부트스트랩)
- `(tabs)/_layout.tsx` — `NativeTabs`. `Trigger`의 `name`은 그룹명
- `(tabs)/(home|community|mypage)/` — 각 탭 그룹(자체 `Stack` + 화면)
- `(tabs)/plus.tsx` — 가운데 추가(+) 탭
- `draft.tsx` 등 — 몰입형 풀스크린 플로우(`headerShown: false` 허용)

## 디자인 시스템 — 필수 규칙

**치지직 톤 민트(#1ED7A0 다크 / #10B187 라이트) 액센트. 다크모드가 hero.**
**모든 색상·간격·반경·그림자 값은 `src/constants/theme.ts` 토큰만 사용. 하드코딩 금지.**

### 3대 원칙

1. **미니멀** — 장식 최소화. 위계는 구분선·여백·표면 레이어로. 강조색(민트)은 핵심 액션 1~2곳에만. 큰 타이틀은 native large title에 위임.
2. **네이티브 우선** — "iOS 내장 UI / `@expo/ui`로 되는가?"를 먼저 검토. ([UI 작업](#ui-작업--expoui-우선))
3. **리퀴드글래스** — 떠 있는 표면(시트·오버레이·툴바·플로팅)은 `@/components/ui/glass-surface`의 `GlassSurface`로 통일.

### `useTheme()` 토큰

`const { mode, colors, typography, radius, elevation } = useTheme();`

- `colors.surface.base/raised/sunken/overlay` — 배경 레이어
- `colors.text.primary/secondary/tertiary/disabled/inverse/onAccent` — 텍스트
- `colors.border.default/subtle/strong` — 테두리
- `colors.accent.default/hover/pressed/subtle/onAccent` — 민트 액센트
- `colors.status.success/warning/danger/info` — 상태색(각 `.default`/`.subtle`)

### 타이포 (`ThemedText type=` / `typography.*`)

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

### 컴포넌트 사용 규칙 (RN 단계에서만)

- 텍스트: `ThemedText` — `type` + `color`(`primary|secondary|tertiary|disabled|inverse|onAccent|accent`)
- 뷰: `ThemedView` — `surface`(`base|raised|sunken|overlay`) + `elevation`(`0~3`)
- 색상 직접 접근: `const { colors } = useTheme()` 후 인라인 스타일

### 간격·반경·기타

- `Spacing.*` — 여백/패딩(`half`=2 … `six`=64)
- `Radius.*` — `borderRadius`에 **반드시** 토큰(`none`/`sm`/`md`/`lg`/`xl`/`full`). 숫자 리터럴·`Spacing` 값 금지.
- 둥근 모서리(캡슐 아님)에는 `{ borderCurve: 'continuous' }`.
- 그림자는 `elevation` 토큰 또는 CSS `boxShadow`. legacy RN shadow/`elevation` 스타일 prop 금지.
- `SafeAreaView`(RN) 금지 → 헤더/탭/`contentInsetAdjustmentBehavior` 또는 `react-native-safe-area-context`.

### 절대 금지

- 색상 hex 하드코딩 / `StyleSheet.create` 안 동적 색상
- `borderRadius`에 숫자 리터럴 또는 `Spacing` 값

### 리퀴드글라스 (Liquid Glass)

**떠 있는 표면(시트 배경·오버레이·툴바·플로팅 트레이)은 `GlassSurface` 사용. 직접 `GlassView`/`BlurView` 금지.**

- iOS 26+ → `expo-glass-effect` 네이티브 글라스 · 구버전/안드로이드 → `expo-blur` `BlurView` 폴백 · 그 외 → `colors.surface.overlay` 단색
- tint는 테마 토큰만. **본문 카드·섹션·고밀도 목록에 글라스 남발 금지**(성능). 화면 위에 떠 있는 선택 트레이(`ItemSlotGrid`)는 허용.
- `glassStyle='clear'`(얇은 레이어) / `'regular'`(표준 패널)

### 이미지·아이콘

- 원격 이미지: `expo-image`의 `Image` · SF Symbols: `@expo/ui` `Icon` 또는 `expo-image` `source="sf:name"`
- CDragon 챔피언 클래스 아이콘: `championClassIconUrl(tag)`(`src/lib/ddragon.ts`)
- **탭/네이티브 아이콘**(`NativeTabs.Trigger.Icon`)은 플랫폼별로 지정: iOS=SF Symbol(`sf`), Android=Material Symbol(`md`). 한 컴포넌트에 `sf`+`md`를 함께 줄 수 있다(iOS는 `sf`, Android는 `md` 사용). SF Symbol은 **weight 제어 불가** → 굵기는 `*.fill`/형태 variant로. 색은 `selectedColor`(또는 `NativeTabs` `tintColor`)에 테마 토큰 주입.

## 경로 별칭 / React Compiler

- `@/`→`src/`, `@/assets/`→`assets/`(`tsconfig.json`)
- React Compiler 자동 실행 — 프로파일링 없이 `useMemo`/`useCallback` 수동 추가 금지. **예외**: `useFocusEffect`(Expo Router)는 `useCallback` 필수.
