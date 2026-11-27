---
id: I-41-06
title: 칼바람 카드 크기
wave: W3
status: todo
depends: I-41
owns: native/ios/AugmentLab/UI/Cards/
spec: design-system.md §2.5
rn: src/components/ui/rarity-card-frame.tsx (cardWidth)
---

# I-41-06 칼바람 카드 크기

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
같은 기기(iPhone 17 Pro 가로)에서 칼바람 카드가 RN보다 ≈4% 작다(폭 120 vs 125, 높이 185 vs 195 — 760px 축소 캡처 기준). `CardLayout.cardWidth` 입력(화면 크기·안전 영역)이 RN과 다른지 확인.

## 체크리스트
- [ ] RN `cardWidth`와 같은 입력으로 같은 폭이 나오는지 숫자로 비교(골든)
- [ ] 다르면 맞춘다

## 완료 기준
- [ ] `make -C native/ios build` 통과
- [ ] `bash docs/migration/status.sh diff I-41-06` → 소유 경로 밖 변경 없음
- [ ] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 칼바람 카드 크기가 RN과 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
