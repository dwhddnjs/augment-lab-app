---
id: I-29b
title: 커스텀 픽 그리드·드래그
wave: W2
status: done
depends: I-11, I-13, I-29a
owns: native/ios/AugmentLab/Features/Custom/Pick/
spec: custom.md §2, design-system.md §3.9
rn: src/features/custom/components/{augment-pick-grid,item-pick-grid,drag-cell}.tsx
---

# I-29b 커스텀 픽 그리드·드래그

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
왼쪽 그리드와 드래그 앤 드롭을 만든다.

## 체크리스트
- [x] `TierRail` + 3열 카드 그리드(담김 표시), 아이템 그리드
- [x] 드래그: 180ms 길게 누르기 → 고스트 64, 리스트 스크롤 차단, 드롭 경계(6.5/11), 넘은 동안 강조 콜백, 취소 −1
- [x] 햅틱 3종, 빠른 모드(탭 추가)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-29b` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 드래그 손맛(시작 지연·고스트 위치)이 RN과 같다
- [ ] 스크롤과 드래그가 서로 방해하지 않는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- 없음. `PressDim`(I-29c `Features/Custom/Selected/`)을 같은 화면 도메인이라 그대로 썼다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료
- 만든 것(`Features/Custom/Pick/`):
  - `PickDrag(draft:)` — `@Observable`. 화면이 하나 만들어 넘긴다. `boundary`(global x) = 본문 왼쪽 끝 + `PickDrag.leftWidth(bodyWidth:)`, 패널은 `drag.dropping`, 맨 위에 `PickGhost(drag:)`. `commit(_:)`이 담기 + 햅틱(light/warning), 시작 햅틱은 medium.
  - `AugmentPickGrid(draft:drag:bottomInset:)`(티어 레일 + 3열), `ItemPickGrid(draft:drag:bottomInset:)`(`ItemFilterBar` + 8열). 둘 다 그리드 폭을 스스로 잰다.
  - `.dragCell(_:enabled:drag:)` — UIKit `UILongPressGestureRecognizer`(0.18s)를 셀 위에 얹는다. 빠른 모드면 안 얹고 버튼 탭(눌림 0.7)이 담는다.
- 쌓은 곳: native/I-29c(#111) — 그 아래 #92·#98·#96·#89.
- 주의점: SwiftUI `LongPress.sequenced(Drag)`는 손가락이 움직이기 전엔 위치가 없어 시작 햅틱·고스트가 늦어서 UIKit 롱프레스로 갔다(RNGH와 같은 바탕). 드래그 중엔 그리드 `scrollDisabled`. 좌표는 전부 global — 화면이 `boundary`도 global로 내야 한다.
