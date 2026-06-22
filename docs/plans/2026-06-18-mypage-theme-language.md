# 마이페이지 테마 화면 분리 + 언어 네이티브 메뉴

## Context

현재 `mypage-screen.tsx`는 "화면(테마)"과 "언어"를 각각 커스텀 `Segment`(3단/2단 토글)로 노출한다. 사용자는 이를 iOS 설정 앱에 가까운 형태로 바꾸고 싶어한다:

1. **테마** — 마이페이지 리스트의 한 줄(Row)로 두고, 탭하면 별도 화면으로 이동. 그 화면에 시스템/라이트/다크 3개 리스트 항목이 있고 현재 모드에 체크(✓) 표시. 다른 항목을 고르면 체크가 이동하고 앱 테마가 즉시 변경.
2. **언어** — 리스트의 한 줄로 두고, 탭하면 iOS 내장 pull-down 메뉴(selector)가 떠서 한국어/English 선택.

기존 UI 스타일(테마 토큰, Section/Row 카드)을 최대한 유지한다.

기존 store 훅이 이미 전역(`useSyncExternalStore`)이라, 어느 화면에서 `setPreference`/`setLocale`을 호출해도 앱 전체가 즉시 리렌더된다 — 추가 상태 배선 불필요.

## 변경 사항

### 1. Section/Row 공통 컴포넌트 추출
`mypage-screen.tsx` 내부에만 있는 `Section`/`Row`를 두 화면이 공유하도록 분리.

- 신규: `src/features/mypage/components/settings-list.tsx`
  - `Section`, `Row` 이동.
  - `Row`에 prop 추가: `selected?: boolean`(우측에 `checkmark` SF Symbol을 `colors.accent.default`로 표시), `trailing?: React.ReactNode`(언어 Row의 네이티브 메뉴를 끼울 슬롯).
  - 우측 표시 우선순위: `trailing` > `selected`(체크) > `value`+chevron.
  - 스타일(`section`/`sectionTitle`/`card`/`row`/`rowRight` 등)도 함께 이동. 색/간격/반경은 기존대로 테마 토큰만 사용.

### 2. 테마 선택 화면 (신규)
- 신규 라우트: `src/app/(tabs)/(mypage)/theme.tsx` — `ThemeScreen`을 default export로 재노출(`index.tsx`와 동일 패턴).
- 신규 컴포넌트: `src/features/mypage/components/theme-screen.tsx`
  - `useThemePreference()`로 `preference`/`setPreference` 사용.
  - `ScrollView`(`contentInsetAdjustmentBehavior="automatic"`) + `Section` 1개 안에 `Row` 3개: 시스템 / 라이트 / 다크.
  - 각 Row `onPress={() => setPreference(value)}`, `selected={preference === value}`, 마지막 Row만 `last`.
  - i18n dictionary는 기존 `appearance/system/light/dark` 키 재사용(필요 시 화면 제목 키 `themeTitle` 추가).

### 3. `_layout.tsx`에 라우트 등록
`src/app/(tabs)/(mypage)/_layout.tsx`:
- i18n dict에 `theme`(헤더 타이틀: ko `테마`, en `Theme`) 추가.
- `<Stack.Screen name="theme" options={{ title: translate('theme'), headerLargeTitle: false, headerBackButtonDisplayMode: 'minimal' }} />` 추가. 색상은 기존 `screenOptions`가 주입하므로 hex 금지 준수.

### 4. `mypage-screen.tsx` 재구성
- 기존 "화면" 섹션의 `Segment`와 "언어" 섹션의 `Segment` 제거. `Segment` 컴포넌트와 관련 스타일 삭제.
- `Section`/`Row`는 `settings-list.tsx`에서 import.
- 새 구조(iOS 설정 앱 스타일, 한 카드에 묶음 가능):
  - **테마 Row**: `label=appearance`, `value=`현재 모드명(시스템/라이트/다크), `onPress={() => router.push('/theme')}`(`expo-router`의 `useRouter`).
  - **언어 Row**: `label=language`, `trailing=`아래 `LanguageMenu`.
  - 기존 **정보** 섹션(version/github/feedback)은 그대로 유지.

### 5. 언어 네이티브 메뉴 — `LanguageMenu` (iOS pull-down)
- 신규: `src/features/mypage/components/language-menu.ios.tsx`
  - `@expo/ui/swift-ui`의 `Host`(`matchContents`) + `Menu` 사용.
  - `Menu`의 `label`=현재 언어명(`한국어`/`English`), `systemImage="chevron.up.chevron.down"`.
  - 자식으로 `Button` 2개(`한국어`, `English`) — `onPress`에서 `setLocale('ko'|'en')`. 현재 선택 항목 표시는 `Button`의 `systemImage="checkmark"`를 선택된 언어에만 부여(또는 `Picker` + `tag` 사용 — Picker가 inline 체크를 자동 제공하므로 우선 검토).
  - label 텍스트 색은 `tint` modifier로 `colors.text.secondary` 톤에 맞춤(PlatformColor 또는 토큰 hex 전달은 `tint(...)` 인자로만, 스타일 하드코딩 금지).
  - `@expo/ui` import 전 `expo:expo-ui` 스킬 규칙대로 `swift-ui` 플랫폼 트리에서만 import.
- 폴백: `src/features/mypage/components/language-menu.tsx`(비-iOS) — RN `Pressable`로 두 언어 토글하거나 간단한 액션시트. (웹 미지원이므로 Android만 고려; 최소 동작 제공.)
  - 플랫폼 분기는 `.ios.tsx`/기본 파일 확장자 규칙 사용(CLAUDE.md 플랫폼 파일 원칙).

## 참고 (재사용 대상)
- `src/hooks/use-theme-preference.ts` — `useThemePreference()`, `ThemePreference`.
- `src/hooks/use-locale.ts` — `useLocale()`, `Locale`.
- `src/components/ui/glass-button.ios.tsx` — `Host`+`@expo/ui/swift-ui` 사용·`tint`/modifier 패턴 참고.
- `src/lib/i18n.ts` — `useTranslation`.
- `src/constants/theme.ts` — `Spacing`/`Radius`/`BottomTabInset` 토큰.

## 검증
1. `npm run ios`로 시뮬레이터 실행.
2. 마이페이지에서 **테마** Row 탭 → 새 화면 진입, 현재 모드에 체크. 시스템/라이트/다크 전환 시 체크 이동 + 앱 색상 즉시 변경, 뒤로 가도 유지(앱 재시작 후도 AsyncStorage 복원).
3. **언어** Row 탭 → iOS pull-down 메뉴 표시, 한국어/English 전환 시 앱 텍스트 즉시 로케일 변경 + 현재 언어에 체크.
4. 다크/라이트 양쪽에서 카드·구분선·체크 색이 토큰대로 보이는지 확인.
5. `npm run lint` 통과.

## 비고
- 이 plan 문서를 실행 시작 시 `docs/plans/2026-06-18-mypage-theme-language.md`로도 복사(CLAUDE.md 규칙).
- 데이터(`augments.*.json`) 변경 없음 → 검수 페이지 재생성 불필요.
