---
id: I-29c
title: 커스텀 선택 패널·오버레이
wave: W2
status: todo
depends: I-13, I-29a
owns: native/ios/AugmentLab/Features/Custom/Selected/
spec: custom.md §2
rn: src/features/custom/components/{selected-panel,selected-champion-row,pick-column,champion-change-overlay,champion-stat-overlay}.tsx
---

# I-29c 커스텀 선택 패널·오버레이

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
오른쪽 패널과 화면 안 오버레이 2개를 만든다.

## 체크리스트
- [ ] `SelectedChampionRow` + pill 3개(정보·변경·재시작 — 확인창 없음)
- [ ] 5:5 두 열, 열 전환(selection 햅틱), x 배지
- [ ] 드롭 강조 베일
- [ ] `ChampionChangeOverlay`(100%×90%, 검색 + 그리드), `ChampionStatOverlay`(42%×90%)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-29c` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 챔피언을 바꿔도 담은 것이 남는다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
