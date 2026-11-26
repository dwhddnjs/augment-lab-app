---
id: I-13
title: 아이템 공용 UI
wave: W1
status: todo
depends: I-01, I-02c, I-05
owns: native/ios/AugmentLab/UI/Items/
spec: item-select.md §3, data.md §6
rn: src/features/items/components/{item-stat-panel,item-filter-bar,filter-icon}.tsx
---

# I-13 아이템 공용 UI

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
아이템 화면 3곳이 쓰는 패널과 필터 바를 만든다.

## 체크리스트
- [ ] `ItemStatPanel`(핵심 13 + 0이 아닌 추가 스탯, base·added·total 표시)
- [ ] `ItemFilterBar`(세로 44, 탭 8, 재탭 해제)
- [x] `FilterIcon`

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-13` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 스탯 패널 숫자가 RN과 같다(같은 챔피언·아이템으로 비교)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
