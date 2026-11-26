---
id: I-27
title: 픽 현황 서랍
wave: W2
status: done
depends: I-11, I-12b
owns: native/ios/AugmentLab/Features/Aram/Drawer/
spec: aram.md §3, design-system.md §3.10
rn: src/features/aram/components/{picked-drawer,champion-summary}.tsx
---

# I-27 픽 현황 서랍

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
오른쪽 서랍과 내용을 만든다.

## 체크리스트
- [x] 서랍: 오른쪽 front, 폭 min(340, 38%), 스프링 수치, 딤 0.5, 가장자리 스와이프 규칙, 스와이프 허용 여부를 바깥에서 받음
- [x] `ChampionSummary`, `HeadlinerSummary compact`, 3열 증강 그리드(`max(6, n)` 칸, "n/6")
- [x] 라이트 모드 이름 색 규칙

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-27` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 열고 닫는 속도가 RN과 같다
- [ ] 가장자리 스와이프

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- `SideDrawer`(`Drawer/SideDrawer.swift`) — 커스텀 설정 서랍(I-29d)도 같은 서랍(spec §3.10, 스와이프 끔)이다. 피처끼리 참조할 수 없으니 `UI/`로 올려 같이 쓰기. 그 전까지 I-29d는 같은 코드를 자기 폴더에 둔다.
- `WrapLayout`(`Drawer/ChampionSummary.swift`) — RN `flexWrap: wrap` 대응 Layout. 다른 화면도 필요하면 `UI/`로.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 한 일: `Features/Aram/Drawer/` 3개
  - `SideDrawer(isOpen:swipeEnabled:content:panel:)` — RN `react-native-drawer-layout` 소스(Drawer.native.tsx) 값 그대로: 폭 `min(340, 0.38W)`, 스프링 1000/500/3(`interpolatingSpring`, 손 뗀 속도 전달, 그릴 때 0~1 클램프 = overshootClamping), 딤 rgba(0,0,0,0.5)×진행도·탭하면 닫힘, 닫혀 있으면 오른쪽 32에서만 스와이프, 가로 5 시작·세로 먼저면 포기, 60 또는 5+속도 500 판정, 열린 서랍 밖에서 잡으면 손가락이 서랍 끝에 닿을 때까지 안 따라옴(front touchDistance)
  - `PickedDrawer(picked:width:championId:headlinerId:skills:stickers:)`, `ChampionSummary(champion:)`, `WrapLayout`
- 검증: `make build` 통과. **native/I-11(#96, #89 포함) + native/I-12b(#90) 위에 쌓았다.** 이 작업 파일은 `Features/Aram/Drawer/` 3개와 이 파일뿐.
- I-25b 연결: `SideDrawer(isOpen: $drawerOpen, swipeEnabled: introDone) { 화면 } panel: { w in PickedDrawer(picked:, width: w, championId:, headlinerId: progress.id.rawValue, skills: progress.skills, stickers: progress.stickers.map(\.rawValue)) }`. 환경에 `GameDataStore`·`AppSettings` 필요.
- 주의점
  - 빈 칸 점선은 RN iOS `RCTBorderDrawing` 그대로 dash = 선 두께 × 3(1.5 → 4.5/4.5).
  - 스와이프는 `simultaneousGesture`라 버튼 탭을 막지 않는다(5pt 넘게 움직여야 시작).
  - 잡는 순간 진행도는 SwiftUI 상태(목표값)라, 스프링이 도는 도중에 잡으면 목표 위치에서 시작한다(RN은 현재 위치). 드문 경우라 그대로 둔다.
- 사용자가 볼 것: 아래 **사용자 확인** 두 줄. Preview `서랍 — 열기·스와이프`.

