---
id: I-06a
title: 셸·탭·라우터·스텁
wave: W0
status: todo
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
- [ ] `AugmentLabApp`(@main, I-00 스텁 인수): AppSettings 주입, 테마 적용, `Boot.start()` 호출, `@UIApplicationDelegateAdaptor(AppDelegate.self)`
- [ ] `Route` enum(전 라우트 + 파라미터 타입 `AramParams`·`ItemSelectParams` 등) + `augmentlab://` URL 파싱(방어적)
- [ ] `@Observable Router`
    - 탭 선택, 탭별 NavigationPath
    - 시트(챔피언 선택·티어리스트 챔피언), 모드 선택 오버레이
    - `startDraft` / `pushItems`는 `DraftPresenter`(I-06b)에 위임
    - `back`, `selectTab`
- [ ] 탭
    - iOS 26+: `TabView` + `Tab(role: .search)` `+`(누르면 오버레이)
    - 26 미만: CustomTabBar(§2.10)
- [ ] 탭별 NavigationStack: 큰 제목, tint accent, 그림자 없음, 뒤로 버튼 화살표만
- [ ] 화면 표시 → `Analytics.trackScreen` (app-shell §7의 문자열 그대로)
- [ ] **스텁 생성**(시그니처 고정, 본문은 화면 이름 Text). 파일 목록은 frontmatter `stubs`. 만든 뒤에는 각 작업이 소유한다.
- [ ] 드래프트 스텁 3개(칼바람·아이템·커스텀)에는 임시 버튼 "저장(가짜 id)"·"나가기"를 넣어 `CloseDraft`를 부르게 한다. I-06b 흐름 확인용이고, 각 피처 작업이 지운다.
- [ ] `CloseDraft`·`DraftPresenter`는 시그니처만 있는 스텁으로 만든다(구현은 I-06b).

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-06a` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 탭 3개와 `+`: iOS 26 시뮬레이터와 iOS 18 시뮬레이터 둘 다 RN과 같은 모양이다
- [ ] 큰 제목이 스크롤에 따라 접힌다
- [ ] `xcrun simctl openurl booted augmentlab://build/abc`로 빌드 상세 스텁이 열린다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
