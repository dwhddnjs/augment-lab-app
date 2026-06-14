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

- 검수 페이지(`docs/augment-check.html`)는 ko/en을 `id`로 병합해 199개 증강을 rarity별로 보여주고, 앱과 동일한 `augmentImageUrl(large)` 규칙으로 CDragon 아이콘을 렌더한다.
- 같은 아이콘 파일을 공유하는 증강은 카드에 **"공유" 배지**로 표시(오류 아님 — 게임이 의도적으로 공유하는 아이콘 식별용).
- 아이콘 경로 원칙: **ARAM Mayhem 증강은 `.../UX/Kiwi/Augments/Icons/...` 폴더 사용**. `Cherry`/`Strawberry`(Arena) 폴더 아이콘을 쓰지 말 것 — 같은 이름의 증강이라도 게임 모드가 다르면 아이콘이 다르다. CDragon `cherry-augments.json`에서 rarity(`kSilver`/`kGold`/`kPrismatic`)가 데이터와 일치하는 `Kiwi` 항목을 정답으로 삼는다.
- 데이터 변경 후 `docs/augment-check.html`도 함께 커밋할 것.

## UI 작업 시 참고

UI 컴포넌트, 네비게이션, 스타일링, 애니메이션 작업 전에 반드시 `.agents/skills/building-native-ui/SKILL.md`를 읽을 것.
`@expo/ui` 작업 전에는 `expo:expo-ui` 스킬도 참조할 것(universal 컴포넌트 vs `@expo/ui/swift-ui`·`@expo/ui/jetpack-compose` 플랫폼 트리 구분).

### 컴포넌트 선택 우선순위 — iOS 네이티브 우선

새 UI를 만들 때는 **항상 더 위 단계부터** 검토하고, 불가능할 때만 아래로 내려간다:

1. **네이티브 셸** — 헤더·탭바·검색바·모달 시트는 Expo Router 네이티브 사용 (아래 [헤더 정책](#헤더-정책) 준수). 탭바는 `NativeTabs`(`expo-router/unstable-native-tabs`).
2. **네이티브 컴포넌트** — 리스트·설정 폼·토글·메뉴·시트·피커·슬라이더는 **`@expo/ui`**로 구현 (`Host`, `List`, `Section`, `Button`, `Switch`, `ContextMenu`, `BottomSheet`, `Picker`, `Slider` 등). 진짜 iOS 룩앤필 우선.
3. **RN 컴포넌트** — 위 단계로 표현 불가능한 커스텀 UI에 한해 `View`/`Text`/`Pressable`/`FlatList`/`ScrollView`/`TextInput`/`SafeAreaView` + 테마 토큰.
4. **이미지·아이콘** — 원격 URL 이미지(Data Dragon CDN 등)는 `expo-image`의 `Image`, 아이콘은 `expo-symbols`/SF Symbols.

### 헤더 정책

화면 헤더는 **Expo Router `Stack.Screen`의 native 헤더를 기본**으로 사용한다. 직접 그린 타이틀/뒤로가기(커스텀 헤더)는 지양:

- 탭 화면도 native 헤더를 쓰기 위해 각 탭을 그룹+자체 `Stack`으로 구성한다 (`(home)`/`(community)`/`(mypage)`). `NativeTabs.Trigger`의 `name`은 그룹명(`(home)` 등)을 가리킨다.
- 헤더 색상은 루트 `_layout.tsx`의 `ThemeProvider`가 주입하므로, 스택 `screenOptions`로 동작만 제어한다 (`headerLargeTitle` / `headerTransparent` / `headerTintColor` 등). hex 하드코딩 금지.
- 목록형 화면은 `headerLargeTitle: true` + 첫 자식 스크롤뷰에 `contentInsetAdjustmentBehavior="automatic"`.
- 배너가 헤더 영역까지 차오르는 몰입형 상세는 `headerTransparent: true`로 두고 본문이 헤더 뒤로 스크롤되게 한다. 스크롤에 따라 헤더 배경/타이틀을 페이드인하려면 `headerBackground`/`headerTitle`에 reanimated `Animated.View`/`Animated.Text`를 주입한다(상세 화면 collapsing 패턴).
- 모달(`presentation: 'modal'`)도 native 헤더를 쓴다. 검색은 직접 `TextInput`을 그리지 말고 `headerSearchBarOptions`(iOS 네이티브 검색바)를 사용하고, 닫기는 `headerLeft`에 취소 버튼을 둔다. grabber는 native 시트가 제공하므로 직접 그리지 않는다.
- `headerShown: false`는 **몰입형 풀스크린 플로우(드래프트 진행·드래프트 결과 등, 보통 가로 전환)에서만** 허용. 그 외에는 native 헤더를 쓴다.

### 플랫폼 파일 원칙

**웹 지원 없음** — `*.web.tsx` / `*.web.ts` 파일을 만들지 말 것. `npm run web`도 사용하지 않음.

플랫폼별 동작이 꼭 필요한 경우에만 `.ios.tsx` / `.android.tsx`로 분리. 대부분은 단일 파일로 구현.

### i18n / 로케일 원칙

글로벌 서비스이므로 **모든 사용자 노출 텍스트는 로케일 분기**할 것. 텍스트를 하드코딩하지 말고 `src/lib/i18n.ts`의 `useTranslation()` 훅을 사용:

- 컴포넌트 파일 상단에 `const t = { ko: {...}, en: {...} }` 형태의 dictionary 정의
- 컴포넌트 안에서 `const translate = useTranslation(t)` → `translate('key')`로 사용
- 키 누락 시 자동으로 `en` 폴백
- 데이터(챔피언/아이템/증강 이름 등)는 `useChampions()` 등 훅이 이미 로케일 분기하므로 그대로 사용
- `src/hooks/use-locale.ts`의 `useLocale()`이 현재 로케일을 반환 (`'ko' | 'en'`)

## 명령어

```bash
npm install            # 의존성 설치
npm start              # Expo 개발 서버 시작 (Expo Go용 QR 코드 출력)
npm run ios            # iOS 시뮬레이터로 시작
npm run android        # Android 에뮬레이터로 시작
npm run lint           # expo lint로 ESLint 실행
npm run reset-project  # 스타터 코드를 app-example/로 이동하고 src/app/ 초기화
```

테스트 러너는 아직 설정되지 않았음 — Jest 추가는 [Expo 단위 테스트 가이드](https://docs.expo.dev/develop/unit-testing/) 참고.

## 아키텍처

**Expo SDK 56 / React 19 / React Native 0.85** 기반의 iOS·Android 크로스플랫폼 앱 (웹 미지원). iOS 네이티브 룩앤필을 hero로 삼는다.

### 폴더 구조 — 필수 규칙

```
src/
├── app/                        # Expo Router 라우트만 (얇게 유지)
├── features/                   # 도메인별 응집 모듈
│   ├── champions/
│   │   ├── components/         # 이 도메인 전용 UI (ChampionSelectModal 등)
│   │   ├── hooks/              # use-champions.ts
│   │   ├── data/               # champions.{ko,en}.json
│   │   └── types.ts
│   ├── augments/
│   ├── items/
│   └── builds/
│       └── queries/            # builds.ts, favorites.ts
├── components/                 # 도메인 무관한 공용 UI만
│   ├── themed/                 # ThemedText, ThemedView
│   ├── navigation/             # app-tabs.*, animated-icon
│   └── ui/                     # hint-row, collapsible, web-badge, external-link
├── hooks/                      # 여러 feature가 공유하는 글로벌 훅
│   ├── use-theme.ts
│   ├── use-color-scheme.ts
│   └── use-locale.ts
├── lib/                        # 외부 클라이언트 + 순수 유틸 (React 의존 X)
│   ├── supabase.ts
│   ├── ddragon.ts
│   ├── i18n.ts
│   └── hangul.ts
├── constants/
│   └── theme.ts
└── styles/
    └── global.css
```

#### 폴더 경계 규칙

1. **`src/app/`** — 라우트 파일만. 실제 UI는 `features/*/components`에서 import.
2. **`src/features/<도메인>/`** — 해당 도메인에 종속된 모든 것. **다른 feature를 import하지 않는다** (공유가 필요하면 `hooks/` 또는 `lib/`로 끌어올림).
3. **`src/components/`** — 도메인 무관한 공용 프리미티브만. feature 폴더를 import하지 않는다.
4. **`src/hooks/`** — 여러 feature가 공유하는 글로벌 훅만 (테마·로케일·색상 스킴).
5. **`src/lib/`** — 외부 클라이언트 + 순수 유틸. React 훅이 아님 (`i18n.ts`의 `useTranslation` 예외 — 로케일 인프라로 lib 유지).
6. **새 도메인 코드** — 해당 feature가 있으면 그 안에, 없으면 `features/` 아래 신설.
7. **공용 UI 후보 판단** — 한 feature에서만 쓰면 feature 안에, 2개 이상이면 `components/ui`로 승격.
8. **`src/types/` 폴더 만들지 말 것** — 타입은 사용처(feature)와 동거.

### 라우팅

파일 기반 라우팅을 사용하는 Expo Router v56. 라우트 파일은 `src/app/`에 위치. 각 탭은 native 헤더를 쓰기 위해 **그룹 + 자체 `Stack`** 구조로 구성한다([헤더 정책](#헤더-정책) 참고):

- `_layout.tsx` — 루트 레이아웃 (`ThemeProvider`로 헤더 색상 주입 + 스플래시/탭 부트스트랩)
- `(tabs)/_layout.tsx` — `NativeTabs`. `Trigger`의 `name`은 그룹명(`(home)`/`(community)`/`(mypage)`)을 가리킴
- `(tabs)/(home)/` — Home 탭 그룹 (`_layout.tsx` 자체 Stack + `index.tsx`)
- `(tabs)/(community)/` — 커뮤니티 탭 그룹
- `(tabs)/(mypage)/` — 마이페이지 탭 그룹
- `(tabs)/plus.tsx` — 가운데 추가(+) 탭
- `select-champion-modal.tsx` — 챔피언 선택 모달 (UI는 `features/champions/components/champion-select-modal.tsx`)
- `draft.tsx` / `draft-items.tsx` / `draft-result.tsx` — 드래프트 풀스크린 플로우 (몰입형, `headerShown: false` 허용)

`package.json`의 `main` 진입점이 `expo-router/entry`이므로 Expo Router가 앱을 부트스트랩함. `experiments.typedRoutes`로 타입이 있는 라우트 활성화.

### 플랫폼별 파일

컴포넌트는 React Native의 플랫폼 확장 규칙을 사용함:

- `src/components/navigation/app-tabs.tsx` — 네이티브 탭 바 (fallback)
- `src/components/navigation/app-tabs.ios.tsx` — iOS 탭 바
- `src/components/navigation/app-tabs.android.tsx` — Android 탭 바
- `src/components/navigation/animated-icon.tsx` — 애니메이션 스플래시/아이콘
- `src/hooks/use-color-scheme.ts` — 색상 스킴 훅

### 디자인 시스템 — 필수 규칙

**치지직 톤 민트(#1ED7A0 다크 / #10B187 라이트) 액센트. 다크모드가 hero.**
**모든 색상·간격·반경·그림자 값은 반드시 `src/constants/theme.ts` 토큰을 사용. 하드코딩 금지.**

#### 디자인 철학 — 최상위 3대 원칙

1. **미니멀** — 장식 최소화. 커스텀 그림자(`elevation`) 사용 자제하고 위계는 **구분선·여백·표면 레이어(surface)**로 표현. 화면당 강조색(민트)은 핵심 액션 1~2곳에만. 큰 타이틀은 native large title에 위임.
2. **iOS 네이티브 우선** — 직접 그리기 전에 항상 "iOS 내장 UI로 되는가?"를 먼저 검토. 헤더·탭·검색바·시트·컨텍스트 메뉴·리스트·폼은 네이티브(`Stack.Screen`/`NativeTabs`/`@expo/ui`)를 기본값으로. 자세한 컴포넌트 선택은 [컴포넌트 선택 우선순위](#컴포넌트-선택-우선순위--ios-네이티브-우선) 참고.
3. **리퀴드글래스** — 패널·오버레이·시트·툴바 등 떠 있는 표면은 `GlassSurface`로 통일 (아래 [리퀴드글라스](#리퀴드글라스-liquid-glass) 규칙).

#### `useTheme()` 반환값

```ts
const { mode, colors, typography, radius, elevation } = useTheme();
```

#### 색상 토큰 (`colors.*`)

- `colors.surface.base/raised/sunken/overlay` — 배경 레이어 (어두울수록 더 깊음)
- `colors.text.primary/secondary/tertiary/disabled/inverse/onAccent` — 텍스트
- `colors.border.default/subtle/strong` — 테두리
- `colors.accent.default/hover/pressed/subtle/onAccent` — 민트 액센트
- `colors.status.success/warning/danger/info` — 상태 색상 (각 `.default` / `.subtle`)

#### 타이포 (`typography.*` 또는 `ThemedText type=`)

| type | size | weight | 용도 |
|---|---|---|---|
| `display` | 48 | 700 | 대형 제목 |
| `title` | 32 | 700 | 섹션 제목 |
| `heading` | 22 | 600 | 화면 제목 |
| `body` | 16 | 500 | 본문 |
| `label` | 14 | 600 | 버튼·칩·소제목 |
| `caption` | 12 | 500 | 부가 설명 |
| `code` | 13 | 500 | 코드·모노 |
| `link` | 16 | 500 | body + accent 색 |

#### 컴포넌트 사용 규칙

- **텍스트**: `ThemedText` — `type` + `color` prop
  - `color`: `primary | secondary | tertiary | disabled | inverse | onAccent | accent`
- **뷰**: `ThemedView` — `surface` + `elevation` prop
  - `surface`: `base | raised | sunken | overlay`
  - `elevation`: `0 | 1 | 2 | 3`
- **색상 직접 접근**: `const { colors } = useTheme()` 후 인라인 스타일

#### 간격·반경 토큰

- `Spacing.*` — 여백/패딩 (`half`=2, `one`=4, `two`=8, `three`=16, `four`=24, `five`=32, `six`=64)
- `Radius.*` — `borderRadius`에 반드시 사용 (`none`=0, `sm`=4, `md`=8, `lg`=12, `xl`=16, `full`=9999)

#### 절대 금지

- 색상 hex 값 하드코딩
- `StyleSheet.create` 안에서 동적 색상 직접 작성
- `borderRadius`에 숫자 리터럴 사용 — `Radius.*` 토큰 사용
- `Spacing.*` 값을 `borderRadius`에 사용

#### 리퀴드글라스 (Liquid Glass)

**패널/오버레이/툴팁/시트 배경/툴바/플로팅 컨테이너는 반드시 `@/components/ui/glass-surface`의 `GlassSurface`를 사용. 직접 `GlassView`/`BlurView` 호출 금지.**

- iOS 26+ → `expo-glass-effect` 네이티브 글라스 (`isLiquidGlassAvailable()` true)
- 구버전 iOS / 안드로이드 → `expo-blur`의 `BlurView` 폴백
- 그 외(BlurView 불가) → `colors.surface.overlay` 단색 최종 폴백
- 색조(tint)는 테마 토큰(`colors.accent.*` / `colors.surface.*`)만 주입, hex 직접 기입 금지
- **미니멀과의 균형** — 글라스는 **떠 있는 표면(모달 시트·오버레이·툴바·플로팅 액션)에만**. 본문 카드·섹션 배경에 글라스를 남발하지 말 것.
- **고밀도 리스트 셀(아이템 그리드, 카드 목록 등)에는 글라스 미적용** — 성능 유의
- `GlassSurface`의 `glassStyle='clear'`는 얇은 레이어, `'regular'`는 표준 패널에 사용

#### 이미지 및 아이콘

- SF Symbols: `expo-image`의 `source="sf:symbol-name"` 사용
- 원격 이미지: `expo-image`의 `Image` 사용
- CDragon 챔피언 클래스 아이콘: `championClassIconUrl(tag)` (`src/lib/ddragon.ts`)
- 아이콘 색상: `tintColor={colors.text.secondary}` 등 토큰 사용

#### (예정) 토큰 미니멀화

미니멀 방향으로의 토큰 재조정이 후속 작업으로 예정되어 있다. **확정 전까지는 기존 토큰을 그대로 사용**하되, 방향을 인지하고 작업할 것:

- `src/constants/theme.ts`의 타이포 스케일(특히 `display 48` / `title 32`)과 `elevation` 그림자 토큰을 미니멀하게 재조정.
- 대형 타이틀은 native large title 헤더에 위임하고, 본문 타이포 대비를 낮춤.
- 토큰 변경 시 위 [타이포 표](#타이포-typography-또는-themedtext-type)와 elevation 관련 서술도 반드시 함께 갱신할 것.

### 경로 별칭

`@/`는 `src/`로, `@/assets/`는 `assets/`로 매핑 (`tsconfig.json`에 설정).

### React Compiler

`app.json`에 `experiments.reactCompiler: true`가 설정되어 있어 React Compiler가 자동으로 실행됨. 프로파일링으로 필요가 확인되지 않는 한 `useMemo`/`useCallback`을 수동으로 추가하지 말 것.

**예외**: `useFocusEffect` (Expo Router)는 안정적인 콜백 참조를 요구하므로 `useCallback`을 반드시 함께 사용할 것.
