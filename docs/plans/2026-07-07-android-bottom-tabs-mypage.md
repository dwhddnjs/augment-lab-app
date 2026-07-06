# Android 배포용 UI 수정 계획

## Context

안드로이드 배포를 앞두고 세 가지 UI 문제를 고친다.

1. **바텀탭 아이콘이 Android에서 안 나옴** — NativeTabs가 home/mypage 트리거에 `sf=`(SF Symbols)만 지정하고 Android용 소스(`md`/`drawable`)를 안 줘서, Android에선 그릴 아이콘이 없음. (현재 `.android.tsx`는 PNG를 쓰지만 mypage에 home.png를 재사용하는 버그가 있음.)
2. **바텀탭 스타일 요구** — iOS 26+는 현재 NativeTabs(liquid glass) 그대로. iOS 26 미만 + Android는 커스텀 탭바: 왼쪽=메인, 중앙=원형 볼드 플러스 액션버튼(mode-select 모달), 오른쪽=마이페이지.
3. **Android 마이페이지 UI 깨짐 + 다크테마 미반영** — universal `@expo/ui`의 `List`/`ListItem`에는 색/배경 prop이 아예 없어(문서·타입 실측 확인) Compose 기본(OS 외관)에 의존 → 앱 내 다크모드 강제가 반영 안 됨.

### 조사 결론 (universal 통합 가능 여부)
universal `@expo/ui` 한 파일로 iOS/Android 통합은 기술적으로 가능하나, universal 컴포넌트에 색상 prop이 없어 커스텀 다크테마가 불가하고 iOS의 완성된 Section/배경 품질까지 잃는다. → **플랫폼 전용 파일 유지**로 결정: iOS는 `@expo/ui/swift-ui` 현행 유지, Android는 `@expo/ui/jetpack-compose`로 재작성. Android 선택 컨트롤은 **SegmentedButton**으로 확정.

### node_modules 실측으로 검증된 사실
- `NativeTabs.Trigger.Icon`은 `md`(Android Material Symbols) prop 실재. Android 우선순위 `drawable > md > src`.
- `expo-router/ui` export: `Tabs`, `TabSlot`, `TabList`, `TabTrigger`(+`asChild`), `useTabTrigger`. `TabTrigger`는 내 `onPress`를 먼저 호출하고 `event.isDefaultPrevented()`면 탭 전환을 건너뜀 → 중앙 플러스에서 `e.preventDefault()` 후 모달 push하면 기존 동작과 동일.
- `@expo/ui/jetpack-compose`: 색은 전부 RN `ColorValue`(hex 문자열) 직접 수용. `Surface`(color/contentColor/shape/border), `Text`(color), `Icon`(source/tint/size), `Row`/`Column`/`Box`(modifiers), `HorizontalDivider`(color/thickness), `SingleChoiceSegmentedButtonRow`+`SegmentedButton`(colors: activeContainerColor/activeContentColor/inactiveContentColor…). universal `Picker`는 jetpack-compose엔 없음.
- `@expo/material-symbols/*.xml`(home/person/add/account_circle/contrast/language/info/code/feedback) exports 매핑 존재. `@expo/vector-icons ^15`(MaterialIcons) 설치됨.

## 아키텍처 결정: iOS26 분기

`(tabs)/_layout.tsx`는 그대로 `<AppTabs/>` 렌더. iOS 버전 분기는 런타임에서:
- **`app-tabs.android.tsx`** → 항상 `<CustomTabBar/>`.
- **`app-tabs.ios.tsx`** → `parseInt(String(Platform.Version),10) >= 26 ? <NativeTabs>…</NativeTabs> : <CustomTabBar/>`.
- **`app-tabs.tsx`**(fallback) → NativeTabs 유지 + home/mypage에 `md` 보강.

`Platform.Version`은 세션 내 상수라 네비게이터 타입이 도중에 안 바뀜. NativeTabs와 headless Tabs 둘 다 동일 라우트(`(home)`/`(mypage)`/`plus`)를 등록. `plus.tsx`(return null)는 라우트 등록 유지 위해 존치.

## 변경 파일

### 1. NEW `src/components/navigation/custom-tabs.tsx` (공유 커스텀 탭바)
`expo-router/ui` headless Tabs로 구성. Android + iOS<26 공용.
```
<Tabs>
  <TabSlot />
  <TabList style={barStyle}>
    <TabTrigger name="(home)"   href="/(home)"   asChild><TabButton icon="home"/></TabTrigger>
    <TabTrigger name="plus"     href="/plus"     asChild onPress={e=>{e.preventDefault(); router.push('/mode-select')}}><CenterPlusButton/></TabTrigger>
    <TabTrigger name="(mypage)" href="/(mypage)" asChild><TabButton icon="account-circle"/></TabTrigger>
  </TabList>
</Tabs>
```
- **좌/우 `TabButton`**: `asChild`가 주입하는 `isFocused`/`onPress` 사용. `Pressable`+아이콘+라벨. 아이콘은 `@expo/vector-icons/MaterialIcons`(RN Image가 xml drawable 미지원이라 회피). 색: `isFocused ? colors.accent.default : colors.text.secondary`. 라벨은 기존 i18n `t` 딕셔너리 + `useTranslation`.
- **중앙 `CenterPlusButton`**: 원형 `Pressable`(`Radius.full`, `backgroundColor: colors.accent.default`, 살짝 위로 띄움), 볼드 `MaterialIcons name="add"` `color: colors.text.onAccent`. `e.preventDefault()`로 탭 전환 차단 후 `/mode-select` push — 기존 NativeTabs 동작과 동일.
- **스타일**: 전부 토큰만 — 바 배경 `colors.surface.base`, 상단 보더 `colors.border.default`, 반경 `Radius.full`, 간격 `Spacing.*`, 하단 인셋 `useSafeAreaInsets().bottom`. 하드코딩 금지.

### 2. MODIFY `src/components/navigation/app-tabs.ios.tsx`
iOS26 런타임 분기 추가(≥26 기존 NativeTabs, <26 `<CustomTabBar/>`). NativeTabs 경로 home/mypage에 `md="home"`/`md="account_circle"` 보강(안전망).

### 3. MODIFY `src/components/navigation/app-tabs.android.tsx`
PNG 재사용 버그 파일을 통째로 대체 → 항상 `<CustomTabBar/>` 렌더. (요구사항 #1 해결.)

### 4. MODIFY (선택) `src/components/navigation/app-tabs.tsx`
fallback home/mypage `Icon`에 `md` 보강.

### 5. REWRITE `src/features/mypage/screens/mypage-screen.tsx` (Android/fallback)
`@expo/ui/jetpack-compose`로 재작성. **`mypage-screen.ios.tsx`는 변경 없음.**
```
<Host style={{flex:1}} colorScheme={mode}>
  <Column modifiers={[fillMaxSize(), background(colors.surface.base), verticalScroll(), paddingAll(Spacing.three)]}>
    SectionHeader('일반')                         // Text color=text.tertiary
    <Surface color={colors.surface.raised} shape=RoundedCorner(Radius.lg)>
      Row: contrast.xml + Text('테마')    + [SegmentedButton system/light/dark]
      HorizontalDivider(color=border.subtle)
      Row: language.xml + Text('언어')    + [SegmentedButton ko/en]
    </Surface>
    SectionHeader('정보')
    <Surface color={colors.surface.raised}>
      Row: info.xml + Text('버전') + Text(version, color=text.secondary)
      Divider; Row(clickable→GitHub): code.xml + Text('GitHub')
      Divider; Row(clickable→mailto): feedback.xml + Text('피드백')
    </Surface>
    Text(disclaimer, color=text.tertiary)
  </Column>
</Host>
```
- 테마/언어 선택기: `SingleChoiceSegmentedButtonRow`+`SegmentedButton`. `colors`로 activeContainerColor=`colors.accent.subtle`, activeContentColor=`colors.accent.default`, inactiveContentColor=`colors.text.secondary`, 보더 `colors.border.default`.
- 행 아이콘: `Icon source={require('@expo/material-symbols/contrast.xml')} tint={colors.text.primary}` 식(기존 xml 경로 재사용).
- 상태 훅 `useLocale`/`useThemePreference`/`useTheme` 재사용 → `mode` 변경 시 `colors` 토큰이 배경·텍스트에 반영 → 다크모드 강제 반영(요구사항 #3 해결).
- i18n: 기존 `t` 딕셔너리 유지, 섹션 헤더 `general`/`info` 키 추가.

### 변경 없음
`(tabs)/_layout.tsx`, `plus.tsx`, `mode-select*`, `mypage-screen.ios.tsx`, root `_layout.tsx`, 테마/훅 파일.

## 아이콘 매핑
| 위치 | 아이콘 | 소스 |
|---|---|---|
| 커스텀탭 home / mypage / plus | home / account-circle / add(볼드) | `@expo/vector-icons/MaterialIcons` |
| NativeTabs(iOS≥26/fallback) 보강 | md `home`/`account_circle` | 신규 |
| 마이페이지 행 | contrast/language/info/code/feedback | `@expo/material-symbols/*.xml` |

## 리스크
1. **headless Tabs name/href 정합** — 그룹 라우트(`(home)`/`(mypage)`) 등록. 실패 시 `href`를 index(`/`)로 조정. 첫 구현 시 즉시 확인.
2. **orphan 라우트 경고** — `plus`를 `asChild` 트리거로 포함해 회피(설계 반영).
3. **SegmentedButton 확정** — DropdownMenu 대신 세그먼트(앵커 이슈 없음).
4. **jetpack Icon xml require** — `@expo/ui/jetpack-compose` index 경유로 transformer 로드(정상 확인). 탭바에선 RN Image가 xml 미지원이라 `@expo/vector-icons` 사용.

## 검증
- 빌드: 네이티브 모듈이라 dev client 필요. `npx expo run:android` / `npx expo run:ios`.
- 타입: `npx tsc --noEmit`.
- **Android 에뮬레이터**: (1) 탭 아이콘 3개 렌더, (2) 중앙 원형 볼드 플러스 → 탭 전환 없이 mode-select 모달, (3) home↔mypage 포커스 accent tint, (4) 마이페이지 테마 light/dark 토글 시 배경·텍스트·세그먼트·구분선이 토큰대로 즉시 반영, 언어 토글, GitHub/피드백 동작.
- **iOS**: 26 시뮬 → NativeTabs 회귀 없음 + 마이페이지 iOS 파일 그대로. <26 시뮬 → 커스텀 탭바 + Android 체크 동일.

## 마무리
- 구현 시작 시 이 계획을 `docs/plans/2026-07-07-android-bottom-tabs-mypage.md`로 복사 저장(CLAUDE.md 규칙).
