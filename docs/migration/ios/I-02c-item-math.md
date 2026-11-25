---
id: I-02c
title: 아이템 스탯·필터 계산
wave: W0
status: todo
depends: I-02a
owns: native/ios/AugmentCore/Sources/AugmentCore/Items/, native/ios/AugmentCore/Tests/AugmentCoreTests/Items/
spec: data.md §6
rn: src/features/items/stats.ts, src/features/items/item-filters.ts
---

# I-02c 아이템 스탯·필터 계산

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
빌드 상세·아이템 선택·커스텀이 함께 쓰는 아이템 계산을 옮긴다.

## 체크리스트
- [ ] `computeStats(base, items)` — `{base, added, total}`, 규칙 표 그대로
- [ ] `STAT_DISPLAY_ORDER`(핵심 13 + 추가), `STAT_LABELS`(라벨·단위·자릿수, ko/en)
- [ ] `formatItemStats`
- [ ] `ITEM_CATEGORIES` 오버라이드 32개 + 카테고리 판정 7종(79~208행 그대로) + `filter(category)`
- [ ] 테스트: 챔피언 3명 × 아이템 조합 계산, 카테고리별 아이템 개수. 기대값은 RN 함수를 `npx tsx -e`로 직접 실행해 뽑은 골든 값으로 비교한다(손으로 계산하지 않는다).

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-02c` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
