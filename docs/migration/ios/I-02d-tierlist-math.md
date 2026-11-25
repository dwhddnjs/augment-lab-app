---
id: I-02d
title: 티어리스트 계산
wave: W0
status: todo
depends: I-02a
owns: native/ios/AugmentCore/Sources/AugmentCore/Tierlist/, native/ios/AugmentCore/Tests/AugmentCoreTests/Tierlist/
spec: data.md §7·§8
rn: src/features/tierlist/tiers.ts, src/features/tierlist/hooks/use-augment-groups.ts, scripts/check-tierlist.ts
---

# I-02d 티어리스트 계산

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
티어 섹션과 증강 그룹 계산을 옮긴다.

## 체크리스트
- [ ] `TIERS`, `augTierOf`, `pct`, `tierSections(match:)`, `findTierRow(key:)`
- [ ] `augmentGroups(row:pool:)` — 희귀도 순서, 안정 정렬
- [ ] 테스트: `check-tierlist.ts` 항목 전부

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-02d` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
