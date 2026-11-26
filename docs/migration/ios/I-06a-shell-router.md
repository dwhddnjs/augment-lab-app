---
id: I-06a
title: 셸·탭·라우터·스텁
wave: W0
status: done
depends: I-01, I-03, I-07
owns: native/ios/AugmentLab/App/Shell/
stubs: native/ios/AugmentLab/App/Draft/AppDelegate.swift (→ I-06b), native/ios/AugmentLab/App/Draft/DraftPresenter.swift (→ I-06b), native/ios/AugmentLab/App/Draft/CloseDraft.swift (→ I-06b), native/ios/AugmentLab/App/Boot/Boot.swift (→ I-06c), native/ios/AugmentLab/Features/Home/HomeScreen.swift (→ I-20), native/ios/AugmentLab/Features/BuildList/BuildListScreen.swift (→ I-21), native/ios/AugmentLab/Features/BuildDetail/BuildDetailScreen.swift (→ I-22), native/ios/AugmentLab/Features/Launch/ModeSelectOverlay.swift (→ I-23), native/ios/AugmentLab/Features/Launch/ChampionSelectScreen.swift (→ I-23), native/ios/AugmentLab/Features/Aram/Screen/AramScreen.swift (→ I-25b), native/ios/AugmentLab/Features/ItemSelect/ItemSelectScreen.swift (→ I-28), native/ios/AugmentLab/Features/Custom/Screen/CustomScreen.swift (→ I-29d), native/ios/AugmentLab/Features/Tierlist/List/TierlistScreen.swift (→ I-30), native/ios/AugmentLab/Features/Tierlist/List/TopTierSection.swift (→ I-30), native/ios/AugmentLab/Features/Tierlist/Champion/TierlistChampionScreen.swift (→ I-31), native/ios/AugmentLab/Features/MyPage/MyPageScreen.swift (→ I-32), native/ios/AugmentLab/Features/DataManage/DataManageScreen.swift (→ I-33)
spec: app-shell.md §1~§4·§7, design-system.md §2.10
rn: src/app/_layout.tsx, src/app/(tabs)/**, src/components/navigation/{app-tabs,custom-tabs,stack-screen-options}.tsx
---

# I-06a 셸·탭·라우터·스텁

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
앱 뼈대와 화면 이동 계약을 만든다. **모든 피처 진입 View를 시그니처 고정 스텁으로 먼저 만들어** W2 작업이 서로 기다리지 않게 한다.

## 체크리스트
- [x] `AugmentLabApp`(@main, I-00 스텁 인수): AppSettings 주입, 테마 적용, `Boot.start()` 호출, `@UIApplicationDelegateAdaptor(AppDelegate.self)`
- [x] `Route` enum(전 라우트 + 파라미터 타입 `AramParams`·`ItemSelectParams` 등) + `augmentlab://` URL 파싱(방어적)
- [x] `@Observable Router`
    - 탭 선택, 탭별 NavigationPath
    - 시트(챔피언 선택·티어리스트 챔피언), 모드 선택 오버레이
    - `startDraft` / `pushItems`는 `DraftPresenter`(I-06b)에 위임
    - `back`, `selectTab`
- [x] 탭
    - iOS 26+: `TabView` + `Tab(role: .search)` `+`(누르면 오버레이)
    - 26 미만: CustomTabBar(§2.10)
- [x] 탭별 NavigationStack: 큰 제목, tint accent, 그림자 없음, 뒤로 버튼 화살표만
- [x] 화면 표시 → `Analytics.trackScreen` (app-shell §7의 문자열 그대로)
- [x] **스텁 생성**(시그니처 고정, 본문은 화면 이름 Text). 파일 목록은 frontmatter `stubs`. 만든 뒤에는 각 작업이 소유한다.
- [x] 드래프트 스텁 3개(칼바람·아이템·커스텀)에는 임시 버튼 "저장(가짜 id)"·"나가기"를 넣어 `CloseDraft`를 부르게 한다. I-06b 흐름 확인용이고, 각 피처 작업이 지운다.
- [x] `CloseDraft`·`DraftPresenter`는 시그니처만 있는 스텁으로 만든다(구현은 I-06b).

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-06a` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 탭 3개와 `+`: iOS 26 시뮬레이터와 iOS 18 시뮬레이터 둘 다 RN과 같은 모양이다
- [ ] 큰 제목이 스크롤에 따라 접힌다
- [ ] `xcrun simctl openurl booted augmentlab://build/abc`로 빌드 상세 스텁이 열린다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- 없음. 공용 파일은 건드리지 않았다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 셸·라우터·스텁 완료 (세션 5d)
**한 일**
- `App/Shell/` 5개: `AugmentLabApp`(@main) · `Route`(딥링크 파싱) · `Router` · `RootView`(탭·스택·시트·오버레이) · `CustomTabBar`(26 미만)
- 스텁 17개(frontmatter `stubs`): Draft 3 · Boot 1 · 피처 진입 View 13
- `make -C native/ios build` 통과, 경고 0

**고정한 계약** — 피처는 `@Environment(Router.self) private var router`로 받아 아래만 부른다.
- 이동: `push(.builds | .build(id:saved:) | .data)` · `presentChampionSelect(_ mode: LaunchMode, headliner:)` · `presentTierlistChampion(_ key:)` · `showModeSelect()` · `startDraft(.aram(AramParams) | .custom(championId:))` · `pushItems(ItemSelectParams)` · `selectTab(.home | .tierlist | .mypage)` · `back()`
- 드래프트 닫기: `router.closeDraft.openBuild(id)` · `router.closeDraft.confirmExit(title:cancel:ok:)` (구현은 I-06b)
- 파라미터 타입(`Route.swift`)
  - `AramParams{championId, mode: GameMode, headliner: HeadlinerId?}`
  - `ItemSelectParams{picked: [Augment], headliner: BuildHeadliner?, championId, mode}`
  - `LaunchMode{aram, custom}` (+ `init(param:)` 폴백)
- 스텁 시그니처
  - 인자 없음: `HomeScreen()` · `BuildListScreen()` · `TierlistScreen()` · `TopTierSection()` · `MyPageScreen()` · `DataManageScreen()` · `ModeSelectOverlay()`
  - 인자 있음: `BuildDetailScreen(id:saved:)` · `ChampionSelectScreen(mode:headliner:)` · `TierlistChampionScreen(key:)` · `AramScreen(params:)` · `ItemSelectScreen(params:)` · `CustomScreen(championId:)`
- I-06b가 채울 자리
  - `DraftPresenter(router:)`: `start(_:)` · `pushItems(_:)` · `screenName: String?`(맨 위 드래프트의 분석 이름. 셸이 읽는다)
  - `router.settings`: 표시할 화면에 환경을 다시 넣을 때 쓴다
  - `AppDelegate`: 빈 클래스
- I-06c가 채울 자리: `Boot.start(settings:)`(앱 init에서 호출) · `BootOverlay`(셸 ZStack 맨 위에 깔린다)
- **전역 환경**(후속 커밋): 앱 루트에서 아래를 하나씩 만들고 `.appEnvironment(router)`로 한 번에 넣는다.
  - `AppSettings` · `GameDataStore`(로케일이 바뀌면 `setLocale`) · `BuildStore`
  - 같은 함수를 드래프트 풀스크린(I-06b)도 쓴다. 전역 저장소가 늘면 `Router.swift`의 `appEnvironment` 한 곳만 고친다.

**설계 메모**
- 빌드 상세는 RN의 루트 스택 대신 **현재 탭 스택**에 push 하고 탭바를 숨긴다. 탭 상태가 남는 결과는 같다.
  - 26+: `.toolbar(.hidden, for: .tabBar)`
  - 26 미만: `CustomTabBar`를 뺀다
- 시트는 `Sheet` 하나로 관리한다. id가 종류별로 고정이라 두 겹으로 쌓이지 않는다(RN `dangerouslySingular`).
- 분석: `router.screenName`이 바뀔 때 `trackScreen`을 부른다. 우선순위는 드래프트 → 모드 선택 → 시트 → 탭 스택 맨 위. 포그라운드·백그라운드 전환은 `scenePhase`로 잡는다.
- 헤더 배경은 RN 테마 card를 따라 불투명 `surface.base`, 그림자 없음, 제목 `text.primary`. 큰 제목이 펼쳐진 상태(scroll edge)에서는 투명하다. `UINavigationBar.appearance` 한 곳에서 정한다.
- 딥링크 파싱 점검은 `Route.selfCheck()`가 한다. 디버그 실행 때 한 번 돈다(앱 타깃에 테스트 타깃이 없다).

**주의점**
- **브랜치**: `native/I-04a`(#88) 위에 쌓았다. `GameMode`·`BuildHeadliner`·`JSONValue`가 I-04a 소유이기 때문이다. **#88을 먼저 머지**해야 이 PR diff가 깔끔해진다.
- `status.sh diff I-06a`는 `owns`(Shell)만 보므로 스텁 17개를 밖으로 잡는다. frontmatter `stubs`에 적힌 대로 의도한 것이다. I-04a 대비 변경은 Shell 5개, 스텁 17개, 이 파일뿐이다.
- 스텁 탭 루트는 큰 제목 접힘을 볼 수 있게 40줄짜리 `List`로 만들었다.
- 드래프트는 I-06b 전까지 뜨지 않는다(`DraftPresenter` 본문이 비어 있다). 챔피언 선택 스텁의 "시작"을 눌러도 아무 일이 없는 게 정상이다.

**사용자가 볼 것**: 위 **사용자 확인** 3줄. 모드 선택(`+`) → 챔피언 시트 → 닫기, 티어리스트 탭 전환도 함께 본다.
