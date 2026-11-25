---
id: I-29a
title: 커스텀 상태 로직
wave: W2
status: todo
depends: I-02a, I-02b
owns: native/ios/AugmentCore/Sources/AugmentCore/Custom/, native/ios/AugmentCore/Tests/AugmentCoreTests/Custom/
spec: custom.md §3
rn: src/features/custom/hooks/use-custom-draft.ts
---

# I-29a 커스텀 상태 로직

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
커스텀 화면의 상태와 규칙을 UI 없이 만든다.

## 체크리스트
- [ ] 필터(티어 + matchName), 정렬 3종(`RARITY_RANK` → 이름)
- [ ] `toggleTarget`(질의 비움), `add`/`addItem` 결과 3종(이전 값 기준 판정), 한도 5/6, 제거, `clear`, `setChampionId`(담은 것 유지)
- [ ] 저장 검증과 저장 페이로드
- [ ] 테스트: 빠른 연타(연속 add) 시 한도·중복이 정확한지

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-29a` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
