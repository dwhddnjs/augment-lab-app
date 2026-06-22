# 드래프트 결과 재디자인(세로) + 빌드 카드 리디자인 + 빌드 상세 collapsing + 헤더 정책 native 전환

## Context

앞선 작업으로 빌드 저장/홈 목록/상세가 동작하지만, 사용자가 4가지 후속 개선을 요청했다.

1. **draft-result** 가 가로(landscape)라 결과를 보기 불편하다 → **세로(portrait)** 로 전환하고 "결과답게" 재구성. 가로로 묶여 있던 증강 카드는 **세로 리스트 행**으로 펼친다.
2. **홈의 빌드 카드(`build-card.tsx`)** 디자인이 마음에 안 든다 → 다시 디자인.
3. **빌드 상세** 에 스크롤 collapsing 애니메이션: 스크롤 0에서 챔피언 이미지가 크게 보이고, 스크롤하면 이미지가 축소되며 본문이 잘 드러나도록.
4. **헤더 정책 전환**: 직접 그린 커스텀 헤더(타이틀/뒤로가기) 지양, Expo Router `Stack.Screen`의 **native 헤더를 기본**으로. 필요할 때만 `headerShown:false`. **홈 탭까지 전면 전환**하고 CLAUDE.md에 규칙을 반영.

확정된 스코프(사용자 응답):
- collapsing 애니메이션은 **build-detail만**. draft-result는 collapsing 아님 — 별도의 결과형 UI.
- 헤더 native 전환은 **홈 탭까지 전면**.
- draft-result 증강 배치는 **세로 리스트 행**.

## 핵심 설계 결정

- **네비게이션 재구조화로 탭에 native 헤더 부여.** `NativeTabs` 트리거는 그룹(스택)을 가리킬 수 있다(SKILL `(index,search)` 패턴). 홈 탭을 `(home)` 그룹+자체 `Stack`으로 바꾸고, `build/[id]` 상세를 그 스택 안으로 옮긴다 → 카드 탭 시 탭바 유지 + native 헤더/뒤로가기 자동. community/mypage도 동일 패턴으로 native 타이틀 헤더 부여(전면 전환).
- **native 헤더 색상은 기존 `ThemeProvider`(루트 `_layout.tsx`)가 이미 주입** — 스택 `screenOptions`에서 large title/transparent 옵션만 설정.
- **draft-result는 `headerShown:false` 유지** — 뒤로가기가 없는 몰입형 종착 화면(다시 시작/확인 CTA가 내비 역할). 이게 "필요할 때만 false"의 정당한 예외. CLAUDE.md에 이 예외를 명시.
- **feature 경계 준수**: draft-result는 builds의 `AugmentTile`을 import하지 않고, draft 자체 `AugmentIcon`(`features/draft/components/augment-icon`)으로 행을 구성.
- collapsing은 reanimated 4.3.1 + `Animated.ScrollView`/`useAnimatedScrollHandler`/`interpolate` 사용(레포에 이미 reanimated 사용처 존재).

## 파일 변경

### A. 네비게이션 재구조 (헤더 전면 native)

| 구분 | 경로 | 내용 |
|---|---|---|
| 이동 | `src/app/(tabs)/index.tsx` → `src/app/(tabs)/(home)/index.tsx` | `BuildListScreen` re-export (그대로) |
| 신규 | `src/app/(tabs)/(home)/_layout.tsx` | `Stack` — index는 `title:'내 빌드'` + `headerLargeTitle`; `build/[id]`는 투명 collapsing 헤더 |
| 이동 | `src/app/build/[id].tsx` → `src/app/(tabs)/(home)/build/[id].tsx` | `BuildDetailScreen` re-export. 기존 `src/app/build/` 삭제 |
| 신규 | `src/app/(tabs)/(community)/_layout.tsx` + `(community)/index.tsx` | community 화면 + native 타이틀 헤더 |
| 신규 | `src/app/(tabs)/(mypage)/_layout.tsx` + `(mypage)/index.tsx` | mypage 화면 + native 타이틀 헤더 |
| 삭제 | `src/app/(tabs)/community.tsx`, `mypage.tsx` | 그룹으로 이동 |
| 수정 | `src/app/_layout.tsx` | 루트 Stack에서 `build/[id]` 등록 제거(스택이 (home)으로 이동). draft-result는 `headerShown:false` 유지 |
| 수정 | `src/components/navigation/app-tabs.{tsx,ios,android}.tsx` | 트리거 `name` 갱신: `index→(home)`, `community→(community)`, `mypage→(mypage)`, `plus` 유지 |

- 그룹 폴더는 URL에 영향 없음 → 기존 `router.push({ pathname:'/build/[id]', params })`(build-list)와 `dismissTo('/')`(draft-result confirm)는 그대로 동작.
- `(home)/_layout.tsx`의 `build/[id]` 옵션: `headerTransparent:true`, `headerTitle:''`(스크롤로 페이드 인은 선택), `headerTintColor: colors.accent.default`(뒤로가기). large title 미사용.
- community/mypage 본문: 현재 가운데 `display` 타이틀 → native 헤더 타이틀로 옮기고 본문은 간단한 플레이스홀더(추후 콘텐츠). `ScrollView contentInsetAdjustmentBehavior="automatic"`로 헤더 인셋 처리.

### B. `build-detail-screen.tsx` — collapsing 헤더 + native 뒤로가기

- 커스텀 `GlassChip` 뒤로가기 제거(`backChip` 삭제) → native 헤더 뒤로가기 사용.
- 최상위 `ScrollView` → `Animated.ScrollView`(reanimated). `useAnimatedScrollHandler`로 `scrollY` 추적.
- 배너(`championLoadingUrl`, 현재 `BANNER_HEIGHT=220`)에 `useAnimatedStyle`:
  - 스크롤 0 이하(당김): scale 확대(parallax) + translateY 따라오기.
  - 스크롤 상승: 배너가 축소/페이드되며 본문이 위로 자연스럽게 노출(`interpolate(scrollY, [0, BANNER_HEIGHT], …)`).
- 본문은 헤더가 투명이므로 배너가 헤더 영역까지 채움. `useFocusEffect` PORTRAIT 락 유지.
- not-found/loading 상태 유지.

### C. `draft-result-screen.tsx` — 세로 결과 화면 재구성

- focus 시 `OrientationLock.LANDSCAPE` → **`PORTRAIT_UP`**. landscape 가드 제거(필요 시 `!isPortrait` 가드로 대체).
- 커스텀 GlassChip 헤더 행 제거. 레이아웃(세로 `ScrollView`):
  1. **결과 히어로**: 챔피언 스플래시(`championLoadingUrl`) 배너 + 하단 페이드 그라디언트, 오버레이로 `check-decagram`(accent) + "드래프트 완료" + 챔피언 이름(title)/칭호.
  2. **증강 섹션**: "증강 N" 라벨 + **세로 리스트 행**. 행 = `ThemedView raised` + `borderLeftWidth 3`(rarity color `AugmentRarityColors[rarity].border`) + draft `AugmentIcon`(48) + 이름(label) + `cleanAugmentDescription` 본문. (build-detail 행과 시각 일관, 단 draft 자체 아이콘 사용)
  3. **아이템 섹션**(있을 때): 44px 타일 그리드.
  4. `ItemStatPanel`(`champion.stats`, itemStatsList).
  5. **하단 CTA 행**: `확인하러 가기`(accent 채움 버튼, `saveBuild`→PORTRAIT 락→`dismissTo('/')`) + `다시 시작`(subtle 버튼). 기존 `saving` 가드/에러 Alert 로직 유지. GlassChip 대신 토큰 기반 `Pressable` 버튼으로 결과형 마감.
- 저장 데이터(`saveBuild` 호출 형태)·라우팅은 변경 없음.

### D. `build-card.tsx` — 카드 리디자인

- `ThemedView raised` elevation 1, `Radius.xl`, `overflow:'hidden'`, `borderCurve:'continuous'`, `boxShadow` 미세 그림자(SKILL 권장).
- 상단 **챔피언 미니 배너**(height ~72): `championLoadingUrl` cover + 좌→우 페이드 그라디언트(→ surface.raised). 좌하단 오버레이: 이름(body)/칭호(caption). 우상단: 날짜 칩(caption, subtle pill).
- 하단(padding `Spacing.three`): 증강 타일 행(rarity 테두리, `AugmentTile` 재사용, 30px) + 얇은 디바이더 + 아이템 타일 행(28px, 없으면 숨김).
- 챔피언 미해석 시 dashed 플레이스홀더 + `unknownChampion`. 증강/아이템 미해석 id는 기존처럼 filter.
- 고밀도 리스트라 글라스 미적용 유지.

### E. CLAUDE.md — 헤더 정책 반영

`## UI 작업 시 참고` 하위에 "헤더 정책" 추가:
- 화면 헤더는 Expo Router `Stack.Screen`의 **native 헤더를 기본**으로 사용. 직접 그린 타이틀/뒤로가기(커스텀 헤더) 지양.
- 색상은 루트 `ThemeProvider`가 주입하므로 스택 `screenOptions`로 제어(`headerLargeTitle`/`headerTransparent` 등).
- `headerShown:false`는 **몰입형 풀스크린 플로우(드래프트 진행·드래프트 결과 등)에서만** 허용.

## i18n

- draft-result: 기존 키 유지(`title, restart, confirm, augments, items, saveError`).
- build-detail/build-list: 기존 키 유지. 헤더 타이틀은 native `options.title`로 이동하되 로케일 분기 필요 → 각 `_layout.tsx`(함수형 레이아웃)에서 `useTranslation`으로 `title` 주입.
- community/mypage: 기존 `title` 키 재사용해 native 헤더 타이틀로.

## 구현 순서

1. 이 플랜을 `docs/plans/2026-06-13-결과세로-카드-collapsing-헤더native.md`로 복사 저장(CLAUDE.md 규칙).
2. 네비 재구조(A): 그룹/스택 생성·파일 이동·`app-tabs.*` 트리거명·루트 `_layout` 정리.
3. build-detail collapsing(B).
4. draft-result 세로 재구성(C).
5. build-card 리디자인(D).
6. CLAUDE.md 갱신(E).
7. `npm run lint` + `npx tsc --noEmit`(기존 19줄 baseline 대비 신규 0 확인).

## 검증

1. `npm run lint`, `npx tsc --noEmit`(baseline 동일).
2. `npm run ios` 수동:
   - 홈 탭: native large-title "내 빌드" 헤더 표시, 목록 스크롤이 헤더 인셋 아래 안착.
   - 카드 탭 → 상세: 탭바 유지 + native 뒤로가기, 스크롤 0에서 이미지 큼 → 스크롤 시 축소/본문 노출(collapsing) 확인.
   - 드래프트 완료 → result가 **세로**로 진입, 증강이 세로 리스트 행, 아이템/스탯/CTA 정상. "확인하러 가기" → 홈 카드 생성, "다시 시작" → 저장 안 됨.
   - community/mypage native 타이틀 헤더 확인.
   - en 로케일에서 헤더/본문 텍스트 로케일 분기 확인.
3. Android에서 NativeTabs+그룹 스택 헤더 1회 점검.

## 리스크

- NativeTabs 트리거명 변경(`index→(home)` 등) 누락 시 탭 깨짐 → app-tabs 3종(ios/android/fallback) 모두 갱신.
- `build/[id]` 이동으로 라우트 경로는 그대로(그룹 무시)지만 typedRoutes 재생성 필요 → dev 서버가 자동 생성.
- collapsing에서 native 투명 헤더와 배너 겹침 z-order/인셋 → `headerTransparent` + 배너 상단 패딩으로 처리.
- 회전 전환: result 진입 시 PORTRAIT 락 타이밍 — 기존 draft-screen 패턴(focus에서 lock) 따름.
- reanimated worklet/핸들러는 React Compiler 예외 아님 — 수동 `useMemo/useCallback` 추가 금지(useFocusEffect 콜백만 예외).
