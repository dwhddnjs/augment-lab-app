---
id: I-41-02
title: 티어리스트 검색창 노출
wave: W3
status: done
depends: I-41
owns: native/ios/AugmentLab/Features/Tierlist/List/
spec: tierlist.md
rn: src/features/tierlist/screens/tierlist-screen.tsx
---

# I-41-02 티어리스트 검색창 노출

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
네이티브는 큰 제목 아래 검색창이 늘 보여 목록이 ≈60pt 아래에서 시작한다(RN y 0.292 → 네이티브 0.36). RN은 처음엔 숨겨 두고 끌어내려야 보인다.

## 체크리스트
- [x] 검색창을 RN처럼 처음엔 숨김(`searchable` 배치·스크롤 연동 확인)
- [x] S 티어 띠가 RN과 같은 높이에서 시작

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-41-02` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 티어리스트 첫 화면에 검색창이 없고, 끌어내리면 나온다

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · c1
- 원인: RN(react-native-screens)은 화면이 뜬 뒤 검색창을 붙여(`hideWhenScrolling: true`) 처음엔 접혀 있다. SwiftUI `.navigationBarDrawer(.automatic)`는 처음에 펼쳐 둬서 목록이 검색창 높이(≈60pt)만큼 내려갔다.
- 한 일: `TierlistScreen`에 `DeferredSearchable` — 첫 `onAppear` 뒤에 `.searchable`을 붙인다. 검색창이 사라지는 게 아니라 RN처럼 접힌 채 붙으므로 S 띠도 RN 높이에서 시작해야 한다.
- 검증: `make -C native/ios build` 통과. 시뮬레이터는 c1 규칙상 안 돌림 → **사용자 확인 필요**.
- 주의: 첫 프레임에 검색창이 잠깐 보이면 붙이는 시점을 한 프레임 더 늦춘다(ponytail 주석).
