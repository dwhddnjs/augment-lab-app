---
id: I-29b
title: 커스텀 픽 그리드·드래그
wave: W2
status: todo
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
- [ ] `TierRail` + 3열 카드 그리드(담김 표시), 아이템 그리드
- [ ] 드래그: 180ms 길게 누르기 → 고스트 64, 리스트 스크롤 차단, 드롭 경계(6.5/11), 넘은 동안 강조 콜백, 취소 −1
- [ ] 햅틱 3종, 빠른 모드(탭 추가)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-29b` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 드래그 손맛(시작 지연·고스트 위치)이 RN과 같다
- [ ] 스크롤과 드래그가 서로 방해하지 않는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
