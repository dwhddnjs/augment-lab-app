---
id: I-31
title: 티어리스트 챔피언 모달
wave: W2
status: done
depends: I-02d, I-06a, I-11, I-15
owns: native/ios/AugmentLab/Features/Tierlist/Champion/
spec: tierlist.md §2, design-system.md §3.7
rn: src/features/tierlist/screens/tierlist-champion-screen.tsx, src/features/tierlist/components/*, src/features/tierlist/hooks/{use-staged-expand,use-scroll-top-anchor,use-tierlist-items}.ts
---

# I-31 티어리스트 챔피언 모달

> 시작 전에 `docs/migration/README.md`의 **세션 규칙**을 읽는다. 수정은 `owns` 경로와 이 파일만 한다.

## 목표
챔피언 상세 모달을 만든다.

## 체크리스트
- [x] 헤더, 증강 그룹(6개 미리보기 → 맨 위로 스크롤 → 50ms마다 12개씩 펼치기, FadeIn 220, 다시 접기)
- [x] 스펠 pill, 빌드 순서·상황별 아이템
- [x] 닫기: 뒤로 갈 곳이 없으면 티어리스트 탭
- [x] 없음 안내

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-31` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 펼치기 중 스크롤이 튀지 않는다
- [ ] 딥링크로 열고 닫기

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- **`LargeTitleSize`**(화면별 큰 제목 28): I-23 `ChampionSelectScreen`과 이 화면에 같은 private 코드가 있다. `UI/Common`으로 옮긴다.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 티어리스트 챔피언 모달 완료 (세션 5d)
**한 일** (`make -C native/ios build` 통과, 경고 0)
- `TierlistChampionScreen(key:)`
  - 자체 `NavigationStack`: 큰 제목 28 "챔피언 정보", 왼쪽 X 18(hitSlop 12)
  - 본문은 `.id(key)`로 둔다. 다른 챔피언으로 다시 열면 펼침 개수와 스크롤 위치가 새로 시작된다.
  - 닫기 = `router.back()`. 딥링크로 열면 Router가 이미 티어리스트 탭을 골라 둔다(I-06a). 그래서 "뒤로 갈 곳이 없으면 티어리스트 탭"이 따로 분기하지 않아도 된다.
  - 헤더
    - 초상화(radius lg, 티어색 1.5): 옆 글 세 줄 높이(64 + gap 8, Dynamic Type을 따름)
    - 이름 줄: TierMark 배지 26 + 이름(heading)
    - 역할(`championTagLabel`, ` · `로 잇는다)
    - 승률(accent) · 픽률(secondary)
  - 챔피언이나 행이 없으면 "티어 정보가 없습니다"를 보여 준다.
- `TierlistAugmentSection`
  - `Tierlist.augmentGroups`(prismatic → gold → silver)를 그룹마다 6개씩 보여 준다.
  - 펼치기: `onExpand`(ScrollViewReader로 맨 위)를 부르고 limit을 18로 둔다. 이후 `.task(id: limit)`가 50ms마다 12개씩 더 붙여 가장 큰 그룹까지 간다. 접거나 limit이 바뀌면 예약이 취소된다.
  - 새 카드(인덱스 ≥ 6)는 `opacity` 220ms로 들어온다. 동작 줄이기가 켜져 있으면 바로 붙는다(RN reanimated 기본과 같다).
  - 카드
    - `AugmentTile` 40(배경 cardBase)
    - 하단 티어 배지 18: sunken 배경, 희귀도(다크) 테두리, 10/14/800
    - 이름 caption 2줄
    - 오른쪽 2.5 티어색 선
- `TierlistItemSection`
  - 제목 + `SpellPill`: 스펠 아이콘 24 두 개 + 픽률(accent). VoiceOver는 "추천 스펠, 픽률 x"로 묶어 읽는다. 아이콘이 없으면 숨긴다.
  - 빌드 순서·상황별 격자: `tierItemsById`, 44 아이콘(adaptive 열), 이름은 VoiceOver 라벨. 비면 숨기고, 셋 다 비면 섹션째 뺀다.

**RN과 다를 수 있는 점**
- 증강 카드 2열: RN은 `flexBasis 48%`(오른쪽에 약 7pt 남음). 여기서는 RN 주석의 의도(gap을 뺀 절반)대로 균등 2열로 만들었다. 오른쪽 끝이 "모든 증강 보기" 버튼과 맞는다.
- 맨 위로 스크롤: RN은 드래그 시작 위치를 기록해 큰 제목이 펼쳐진 진짜 맨 위로 간다. 여기서는 `ScrollViewReader.scrollTo(top)`라서 큰 제목이 접힌 채로 첫 줄이 보이는 위치가 될 수 있다. 사용자 확인 1번에서 함께 본다.

**주의점**
- **브랜치**: `native/I-06a`(#93) + `native/I-11`(#96, #89 포함) 위에 쌓았다. 머지 순서: #88 → #93, #89 → #96 → 이 PR.

**사용자가 볼 것**: 위 **사용자 확인** 2줄. 딥링크는 `xcrun simctl openurl booted 'augmentlab://tierlist-champion-modal?key=266'`(아트록스)로 연다.
