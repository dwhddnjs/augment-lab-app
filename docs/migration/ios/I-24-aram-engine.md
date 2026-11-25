---
id: I-24
title: 칼바람 엔진
wave: W2
status: todo
depends: I-02a, I-12a
owns: native/ios/AugmentCore/Sources/AugmentCore/Aram/, native/ios/AugmentCore/Tests/AugmentCoreTests/Aram/
spec: aram.md §2
rn: src/features/aram/{rarity-odds,transmute}.ts, src/features/aram/hooks/use-aram.ts, scripts/{check-rarity-odds.mjs,check-transmute.ts}
---

# I-24 칼바람 엔진

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
드래프트 규칙 전체를 UI 없는 상태 머신으로 만든다. 화면(I-25b)은 이 상태만 그린다.

## 체크리스트
- [ ] 확률표 2종, `rollRarity`, `drawOfRarity`, `cardPool`(판도라 첫 라운드 제외)
- [ ] 리롤: 슬롯마다 라운드당 1회, 희귀도 유지, command-line 첫 리롤 승급, heartsteel 스티커 유지·빈칸 50%
- [ ] `applyPick`: 전환 3종, 판도라, 연쇄 없음, transmuted 표시, 원본 불변
- [ ] 상태 머신: 라운드 수, 펜타킬 스킬 선택 2회, 스티커 진행, `done` → 아이템 화면 파라미터
- [ ] 난수 주입
- [ ] 테스트: `check-rarity-odds.mjs` + `check-transmute.ts` 항목 전부 + 헤드라이너별 한 판 시뮬레이션(끝까지 진행되는지)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `make -C native/ios test` 통과
- [ ] `bash docs/migration/status.sh diff I-24` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- (없음 — 단위 테스트로 검증)

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
