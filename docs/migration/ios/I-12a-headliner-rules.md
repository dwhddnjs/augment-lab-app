---
id: I-12a
title: 헤드라이너 규칙
wave: W1
status: todo
depends: I-02a
owns: native/ios/AugmentCore/Sources/AugmentCore/Headliners/, native/ios/AugmentCore/Tests/AugmentCoreTests/Headliners/
spec: aram.md §2.1
rn: src/features/headliners/rules.ts, scripts/check-headliners.ts
---

# I-12a 헤드라이너 규칙

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
헤드라이너 13종의 규칙을 순수 함수로 옮긴다. 난수 생성기를 주입할 수 있게 해 테스트를 결정적으로 만든다.

## 체크리스트
- [ ] ID 목록, `cardsFor`, `roundsFor`, `nextRarity`, `skillChoices`, `needsSkillPick`, `rollHeadliner`, `rollRoundStickers`, `rerollSlotSticker`, `anvilCount`
- [ ] 테스트: `check-headliners.ts` 항목 전부. 통계 검사는 20만 번 ±1%.

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-12a` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
