---
id: I-23
title: 모드 선택·챔피언 선택
wave: W2
status: done
depends: I-05, I-06b
owns: native/ios/AugmentLab/Features/Launch/
spec: launch.md, design-system.md §3.3
rn: src/components/navigation/mode-select-overlay.tsx, src/features/champions/**
---

# I-23 모드 선택·챔피언 선택

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
드래프트로 들어가는 두 화면을 만든다.

## 체크리스트
- [x] 모드 선택 오버레이: 딤, 버튼 2개 시차 등장, 오버레이를 교체하며 시트 열기
- [x] 챔피언 선택: 검색(초성), 스크롤 시 검색 취소·키보드 내림, 역할 칩(재탭 해제), 4열 그리드, ✓ 비활성 40%
- [x] 시작: 연타 가드 → `Router.startDraft`
- [x] 진입 시 챔피언·역할 아이콘 prefetch

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-23` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 초성 `ㅇㅌㄹㅅ` → 아트록스
- [ ] 버튼 등장 시차가 RN과 같다
- [ ] ✓ 누르면 가로 드래프트로 바로 전환된다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- **화면별 큰 제목 크기 `LargeTitleSize`**(`ChampionSelectScreen.swift` 안 private): 티어리스트 챔피언 모달(I-31)도 큰 제목이 28이다. 두 곳에서 쓰게 되면 `UI/Common`(I-15)으로 옮긴다.
- **눌림 효과 없는 버튼 스타일 `NoFeedback`**: 이 작업 두 파일과 Shell `CustomTabBar`의 `Bare`가 같은 코드다. `UI/Common`으로 옮길 후보.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 모드 선택·챔피언 선택 완료 (세션 5d)
**한 일** (`make -C native/ios build` 통과, 경고 0)
- `ModeSelectOverlay`
  - 딤(`surface.overlay`)을 누르면 `router.back()`
  - 버튼: 원 60, 테두리 1.5, 다크 민트 고정. MCI 24 + caption 라벨
  - 등장: 아래 +20에서 opacity와 함께 220ms ease-out(cubic). 칼바람 0ms, 커스텀 70ms
  - 고르면 `router.presentChampionSelect(mode)`. Router가 오버레이를 걷고 시트를 연다(RN `replace`).
  - 배경 페이드 150ms는 셸(I-06a)이 오버레이 전체에 건다.
- `ChampionSelectScreen`
  - 자체 `NavigationStack`: 큰 제목 28, `.searchable`(drawer, 스크롤 시 숨김), X / ✓(선택 전 40%)
  - 데이터: `GameDataStore` 환경의 `champions`. 역할 필터 → `matchName`(초성) → `compare(locale:)` 정렬
  - 역할 칩은 리스트 헤더로 함께 스크롤된다. All은 SF `square.grid.2x2.fill`, 역할 6개는 CDragon 아이콘(template 틴트). 다시 누르면 해제
  - 4열 `LazyVGrid`. 셀 padding 4, 이미지 radius md, 테두리 1.5 → 선택 시 2.5 accent. 라벨 label 1줄
  - 시작: `starting` 연타 가드 → `router.startDraft(.aram(...) | .custom(...))`. 시트 위에 드래프트가 뜬다(I-06b). RN의 `close=cut` 파라미터는 필요 없다(CloseDraft가 닫을 때 정한다).
  - 진입 시 `SDWebImagePrefetcher`로 챔피언 square 전부와 역할 아이콘 6개를 받는다.

**RN과 다를 수 있는 점**
- 스크롤을 시작하면 빈 검색을 취소하는 동작은 iOS 18+(`onScrollPhaseChange`)만 된다. iOS 17은 키보드만 내린다(`ponytail:` 주석).
- 명세의 "눌림 0.7"은 RN 코드(`champion-select-grid.tsx`, Pressable에 pressed 스타일 없음)에 없다. 그래서 눌림 효과 없이 RN 코드를 따랐다.

**주의점**
- **브랜치**: `native/I-06b`(#97) + `native/I-05`(#89) 위에 쌓았다. 머지 순서: #88 → #93 → #97, #89 → 이 PR.

**사용자가 볼 것**: 위 **사용자 확인** 3줄. 라이트 모드에서도 버튼 민트가 잘 보이는지 함께 본다.
