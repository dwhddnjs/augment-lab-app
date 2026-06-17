# expo-ui 적극 채택 + 폴더 구조 정리 + 마이페이지 리팩토링

## Context (왜 하는가)

현재 앱은 `@expo/ui`(SwiftUI/Compose)와 React Native(`View`/`Pressable`/`ThemedText`)가 난잡하게 혼용되어 있다. 사용자는 **iOS=SwiftUI, Android=JetpackCompose**의 진짜 네이티브 룩앤필을 hero로 삼고 싶어 하며, `@expo/ui`를 1순위로, RN은 어쩔 수 없을 때만 쓰는 방향으로 정리하려 한다.

확인된 사실:
- `@expo/ui@56.0.14`의 **universal 트리에 `Host`/`List`/`ListItem`/`Picker`/`Switch`/`Button`/`Text`/`Icon` 등이 모두 존재** → 한 파일로 iOS·Android 네이티브 렌더 가능 (`node_modules/@expo/ui/build/universal/index.d.ts`).
- 마이페이지는 RN 기반 `settings-list.tsx`(`Pressable`/`View`/`ThemedText`)와 `language-menu.ios.tsx`(swift-ui) 혼용 상태.
- `.agents/skills/building-native-ui`는 expo-ui보다 RN 컨트롤(controls.md의 `@react-native-community/*`)을 권장하는 등 새 방향과 충돌.

목표: ⓐ 프로젝트용 **expo-ui 스킬 신규 작성** + building-native-ui 제거, ⓑ **폴더 구조 정리**(screens/components 분리, universal 우선·필요시 .ios/.android), ⓒ **CLAUDE.md를 컴팩트하게 갱신**, ⓓ 첫 실험으로 **마이페이지를 universal `@expo/ui`로 전면 교체**.

사용자 결정(확정): building-native-ui **완전 제거** · **universal 우선, 필요시만 분리** · **screens/ + components/ 분리** · 마이페이지 **universal 전면 교체**.

---

## 1. expo-ui 스킬 신규 작성 + building-native-ui 제거

### 1-1. 신규 스킬 `.agents/skills/expo-ui/`
expo 공식 스킬(github.com/expo/skills/.../expo-ui) 구조를 참고하되 **한국어 + 프로젝트 규칙**(테마 토큰, 헤더 정책, iOS/Android 전용) 반영.

```
.agents/skills/expo-ui/
  SKILL.md                      # 진입점: 3단계 우선순위, 설치, 핵심 컴포넌트 표, References 링크
  references/
    universal.md                # @expo/ui universal (Host/List/ListItem/Picker/Switch/Button/Text/Icon...) + Host 래핑 규칙
    swift-ui.md                 # @expo/ui/swift-ui + modifiers, RNHostView, .ios.tsx 분리 시점
    jetpack-compose.md          # @expo/ui/jetpack-compose + modifiers, LazyColumn, .android.tsx
    drop-in-replacements.md     # @expo/ui/community/* (bottom-sheet, datetime-picker, picker, slider, segmented-control, menu, masked-view, pager-view)
```

핵심 메시지(공식 스킬에서 차용):
- **의사결정 3단계**: ① universal `@expo/ui`(단일 파일) → ② 부족할 때 `@expo/ui/swift-ui`·`@expo/ui/jetpack-compose` 플랫폼 트리(`.ios.tsx`/`.android.tsx`) → ③ 커뮤니티 라이브러리 마이그레이션 시 `@expo/ui/community/*`.
- 모든 트리는 **`Host`로 감싼다** (`matchContents`=내용 크기, `style={{flex:1}}`=전체).
- **"진실의 원천은 설치된 `.d.ts`"** — `node_modules/@expo/ui/build/...` 타입을 우선 확인.
- `List`는 소규모(설정/폼)용. 고밀도 대량 리스트는 RN `FlatList` 유지.
- 텍스트 입력 동기 업데이트는 `useNativeState` + `'worklet'`.

### 1-2. building-native-ui 제거
- `.agents/skills/building-native-ui/` 폴더 전체 삭제.
- 그 스킬이 담던 **expo-ui와 직교하는 핵심 규칙은 CLAUDE.md로 흡수**(아래 3절): 라우트 첫 자식 ScrollView + `contentInsetAdjustmentBehavior="automatic"`, `SafeAreaView` 금지(→`react-native-safe-area-context`), `borderCurve:'continuous'`, 그림자는 `boxShadow`/`elevation` 토큰, SF Symbols·원격이미지=`expo-image`. (애니메이션/미디어/스토리지 등 상세는 필요 시 expo 공식 문서 참조로 대체.)
- `app-store-preflight-skills`는 무관하므로 유지.

---

## 2. 폴더 구조 정리 — screens/ + components/

### 2-1. 새 규칙
```
features/<도메인>/
  screens/        # 라우트가 직접 렌더하는 "화면" 단위 (*-screen.tsx)
  components/     # 화면을 구성하는 작은 조각 (카드/타일/슬롯/메뉴 등)
  hooks/          # 도메인 훅
  data/           # *.ko.json / *.en.json
  types.ts
```
- 라우트 파일(`src/app/**`)은 **screens/**에서 import.
- **플랫폼 분기**: universal 단일 파일이 기본. universal로 부족하거나 플랫폼 최적화가 필요할 때만 같은 폴더에 `name.ios.tsx`(swift-ui) / `name.android.tsx`(jetpack-compose)로 분리.

### 2-2. 이번 작업 범위
- **마이페이지만** 새 구조로 이전(실험). 나머지 도메인(champions/items/builds/draft)은 **현행 유지**하고, 후속 작업으로 동일 패턴 적용(별도 PR). CLAUDE.md에는 새 규칙을 "정본"으로 기재.

---

## 3. CLAUDE.md 컴팩트 갱신

수정 파일: `CLAUDE.md`

- **`## UI 작업 시 참고`**: building-native-ui 참조 줄 제거. `expo-ui` 스킬을 **UI 작업 전 필독**으로 지정.
- **컴포넌트 선택 우선순위** 재작성(현 4단계 → expo-ui 중심):
  1. 네이티브 셸(헤더/탭/검색/모달 시트) — Expo Router `Stack.Screen`/`NativeTabs`.
  2. **universal `@expo/ui`** — 리스트/폼/토글/버튼/피커/시트 등은 단일 파일 universal 우선.
  3. 플랫폼 트리 `@expo/ui/swift-ui`·`@expo/ui/jetpack-compose` — universal로 부족할 때 `.ios.tsx`/`.android.tsx`.
  4. RN(`View`/`Text`/`Pressable`/`FlatList`/`ScrollView`) + 테마 토큰 — **최후 수단**. 이때만 `ThemedText`/`ThemedView`/`useTheme` 사용.
  5. 이미지=`expo-image`, 아이콘=`@expo/ui` `Icon` 또는 `expo-image`의 `sf:` 소스.
- **플랫폼 파일 원칙**: "웹 미지원(iOS·Android 전용), `*.web.*` 금지" 유지 + "universal 우선, 필요할 때만 `.ios/.android` 분리" 추가.
- **폴더 구조 규칙**: `features/<도메인>/{screens,components,hooks,data}` 반영(현 `components/` 단일 → screens 분리).
- building-native-ui에서 흡수한 짧은 규칙들을 디자인/스타일 섹션에 1~2줄로 통합.
- 장황한 문단 압축(전체 분량 축소). 헤더 정책·디자인 토큰·리퀴드글라스·i18n 규칙은 **핵심 유지**.
- 플랜 문서 저장 규칙(`docs/plans/...`)에 따라 이 계획을 `docs/plans/2026-06-18-expo-ui-migration-mypage.md`로 복사 저장.

---

## 4. 마이페이지 universal 전면 교체 (첫 실험)

### 4-1. 신규/이전 파일
- `src/features/mypage/screens/mypage-screen.tsx` — universal `Host`+`List`+`ListItem`로 재작성.
  - 일반 섹션: 테마(→ `/theme` push, `ListItem` `onPress`+`trailing` chevron/현재값), 언어(`ListItem`의 `trailing`에 universal `Picker` `appearance="menu"`).
  - 정보 섹션: 버전(값 표시), GitHub(`openBrowserAsync`), 피드백(`Linking` mailto).
  - 섹션 구분은 SwiftUI `List`의 네이티브 그룹 스타일 활용(여러 `List` 또는 헤더). `.d.ts`로 섹션 표현 방식 확인 후 결정.
- `src/features/mypage/screens/theme-screen.tsx` — universal `List`/`ListItem`(현재 모드 체크) 또는 `Picker appearance="wheel"`로 재작성. `useThemePreference` 그대로 사용.
- 라우트 파일 갱신: `src/app/(tabs)/(mypage)/index.tsx`·`theme.tsx`가 `@/features/mypage/screens/...`를 import.

### 4-2. 삭제
- `src/features/mypage/components/settings-list.tsx`
- `src/features/mypage/components/language-menu.tsx`
- `src/features/mypage/components/language-menu.ios.tsx`
- (기존) `src/features/mypage/components/mypage-screen.tsx`·`theme-screen.tsx` → screens로 이전.
- 언어 선택은 universal `Picker`로 통합되어 iOS/폴백 분기 파일 불필요.

### 4-3. 재사용
- `useThemePreference`(`@/hooks/use-theme-preference`), `useLocale`(`@/hooks/use-locale`), `useTranslation`(`@/lib/i18n`) 그대로.
- 색조가 필요한 곳은 `useTheme()` 토큰을 `Picker`/`Icon` tint 등에 주입(hex 금지).

---

## 검증 (end-to-end)

1. `npm run lint` 통과.
2. `npm run ios`로 시뮬레이터 실행 → 마이페이지 탭:
   - 설정 리스트가 **네이티브 SwiftUI List** 룩으로 표시되는지.
   - 테마 행 탭 → 테마 화면 push, 모드 변경 시 전역 테마 즉시 반영.
   - 언어 Picker(menu) 동작 → ko/en 전환 시 텍스트 즉시 리렌더.
   - 버전/GitHub/피드백 행 동작.
   - 라이트/다크 모두 토큰 색 정상.
3. `npm run android`로 동일 화면이 **JetpackCompose**로 정상 렌더되는지(universal 단일 파일 검증).
4. `.agents/skills/building-native-ui` 삭제 후 잔존 참조(grep `building-native-ui`) 없는지 확인.

## 범위 밖(후속)
- champions/items/builds/draft의 screens/components 분리 + universal 이전은 별도 PR.
