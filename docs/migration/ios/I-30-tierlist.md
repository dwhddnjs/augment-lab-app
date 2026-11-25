---
id: I-30
title: 티어리스트 탭 + TopTierSection
wave: W2
status: todo
depends: I-02d, I-06a, I-15
owns: native/ios/AugmentLab/Features/Tierlist/List/
spec: tierlist.md §1
rn: src/features/tierlist/screens/tierlist-screen.tsx, src/features/tierlist/components/{tierlist-champion-cell,top-tier-section}.tsx, src/features/tierlist/hooks/use-tier-colors.ts
---

# I-30 티어리스트 탭 + TopTierSection

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
티어리스트 탭과 홈에 끼우는 S티어 조각을 만든다.

## 체크리스트
- [ ] 검색(스크롤 시 숨김), S~D 섹션, TierMark 헤더, 2열 셀, 빈 셀 채우기, 빈 상태, footer 치환
- [ ] `TopTierSection`(I-06a 스텁 채우기)

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-30` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 검색해도 티어가 바뀌지 않는다
- [ ] 홈 S티어 → 챔피언 모달

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
