# 헤더 정책 · 플랫폼 파일 원칙

## 헤더 정책

화면 헤더는 **Expo Router `Stack.Screen`의 native 헤더를 기본**으로 사용한다. 커스텀 헤더(직접 그린 타이틀/뒤로가기) 지양:

- 각 탭을 그룹+자체 `Stack`으로 구성한다(`(home)`/`(community)`/`(mypage)`). `NativeTabs.Trigger`의 `name`은 그룹명을 가리킨다.
- 헤더 색은 루트 `_layout.tsx`의 `ThemeProvider`가 주입. 스택 `screenOptions`로 동작만 제어(`headerLargeTitle`/`headerTransparent`/`headerTintColor`). hex 하드코딩 금지.
- 목록형 화면은 `headerLargeTitle: true`. RN 스크롤뷰가 첫 자식이면 `contentInsetAdjustmentBehavior="automatic"`.
- 몰입형 상세는 `headerTransparent: true` + 본문이 헤더 뒤로 스크롤. 스크롤에 따른 헤더 페이드인은 `headerBackground`/`headerTitle`에 reanimated `Animated.View`/`Animated.Text` 주입.
- 모달(`presentation: 'modal'`)도 native 헤더. 검색은 직접 그리지 말고 `headerSearchBarOptions`, 닫기는 `headerLeft` 취소 버튼. grabber는 native 시트가 제공.
- `headerShown: false`는 **몰입형 풀스크린 플로우(드래프트 진행/결과 등)에서만** 허용.

## 플랫폼 파일 원칙

- **웹 미지원** — `*.web.tsx` / `*.web.ts` 금지. `npm run web` 미사용.
- **universal 우선, 필요시만 swift-ui** — `@expo/ui` universal 단일 파일이 기본. universal로 부족할 때만 `@expo/ui/swift-ui`로 내려간다. iOS 전용 앱이므로 `.ios.tsx`/`.android.tsx` 분기 파일은 만들지 않는다.

## 라우팅 구조

- `_layout.tsx` — 루트(`ThemeProvider` 헤더 색 주입 + 스플래시/탭 부트스트랩)
- `(tabs)/_layout.tsx` — `NativeTabs`. `Trigger`의 `name`은 그룹명
- `(tabs)/(home|community|mypage)/` — 각 탭 그룹(자체 `Stack` + 화면)
- `(tabs)/plus.tsx` — 가운데 추가(+) 탭
- `draft.tsx` 등 — 몰입형 풀스크린 플로우(`headerShown: false` 허용)

## 탭/네이티브 아이콘

`NativeTabs.Trigger.Icon`은 SF Symbol(`sf`)로 지정한다. SF Symbol은 **weight 제어 불가** → 굵기는 `*.fill`/형태 variant로. 색은 `selectedColor`(또는 `NativeTabs` `tintColor`)에 테마 토큰 주입.
