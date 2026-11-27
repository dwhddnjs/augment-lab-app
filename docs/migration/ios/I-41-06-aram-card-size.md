---
id: I-41-06
title: 칼바람 카드 크기
wave: W3
status: done
depends: I-41
owns: native/ios/AugmentLab/UI/Cards/, native/ios/AugmentLab/Features/Aram/Screen/
spec: design-system.md §2.5
rn: src/components/ui/rarity-card-frame.tsx (cardWidth)
---

# I-41-06 칼바람 카드 크기

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
같은 기기(iPhone 17 Pro 가로)에서 칼바람 카드가 RN보다 ≈4% 작다(폭 120 vs 125, 높이 185 vs 195 — 760px 축소 캡처 기준). `CardLayout.cardWidth` 입력(화면 크기·안전 영역)이 RN과 다른지 확인.

## 체크리스트
- [x] RN `cardWidth`와 같은 입력으로 같은 폭이 나오는지 숫자로 비교(골든)
- [x] 다르면 맞춘다

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-41-06` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 칼바람 카드 크기가 RN과 같다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->

### 2026-11-27 · 완료 (세션 5d)
- **골든**: 계산식(`CardLayout.cardWidth`)은 RN `cardWidthFor`와 같다. 차이는 입력에서 났다.

  | iPhone 17 Pro 가로 | 입력 화면 | 카드 폭×높이 | 760px 캡처 기준 |
  |---|---|---|---|
  | RN | 874×402(창 전체) | 144×224 | 125×195 |
  | 고치기 전 네이티브 | 750×381(안전 영역 뺌) | 137×213 | 119×185 |

  캡처 기준 열이 검수에서 잰 수치(RN 125×195, 네이티브 120×185)와 맞는다. fd의 ax 프레임 실측(144×224 vs 137×213)과도 같다.
- **원인**: `AramScreen`(I-25b)이 화면 크기를 `background { Color.clear.ignoresSafeArea() }`에서 쟀다. 이 방식으로는 안전 영역을 뺀 크기가 왔다.
- **고침**: 화면 뷰 자체의 `size + safeAreaInsets`로 창 크기를 되돌린다. 카드 계산(UI/Cards)은 그대로 두었다. 원인이 화면 쪽이라 owns에 `Features/Aram/Screen/`을 더했다.
- 확인: `make -C native/ios build`가 통과했다. 골든 비교 스크립트(python, assert)로 144와 137을 확인했다.
- 참고: 아이템 선택·커스텀은 `GeometryReader`의 `safeAreaInsets`를 직접 쓰고, 카드 폭 계산에는 이 경로를 타지 않는다.
