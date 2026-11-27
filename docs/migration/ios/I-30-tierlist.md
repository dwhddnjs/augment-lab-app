---
id: I-30
title: 티어리스트 탭 + TopTierSection
wave: W2
status: done
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
- [x] 검색(스크롤 시 숨김), S~D 섹션, TierMark 헤더, 2열 셀, 빈 셀 채우기, 빈 상태, footer 치환
- [x] `TopTierSection`(I-06a 스텁 채우기)

## 완료 기준
- [x] `make -C native/ios build` 통과
- [x] `bash docs/migration/status.sh diff I-30` → 소유 경로 밖 변경 없음
- [x] frontmatter `status: done`, 아래 진행 기록 작성 → 커밋 → push → `gh pr create --base dev`

## 사용자 확인 (사용자가 시뮬레이터에서 보고 체크)
- [ ] 검색해도 티어가 바뀌지 않는다
- [ ] 홈 S티어 → 챔피언 모달

## 승격 후보
<!-- 공용 파일(다른 작업 소유)을 바꿔야 했던 것. 임시로 자기 폴더에 구현하고 여기에 적는다. -->
- **`CancelEmptySearchOnDrag`**: 스크롤을 시작하면 빈 검색을 끄는 modifier. I-23(`Launch/ChampionSelectScreen.swift`)에도 같은 코드가 private으로 있다. `UI/Common`으로 옮길 후보.

## 진행 기록
<!-- 세션마다 아래에 추가: ### YYYY-MM-DD · 한 일 / 다음 단계 / 주의점 -->
### 2026-11-27 · 티어리스트 탭·TopTierSection 완료 (세션 5d)
**한 일** (`make -C native/ios build` 통과, 경고 0)
- `TierlistScreen`
  - 셸이 큰 제목 "티어리스트"를 단다. 여기서는 `.searchable`(drawer, 스크롤 시 숨김)을 붙인다.
  - 섹션: `Tierlist.sections(data.tierlist.aram, match: matchName)`. 검색은 숨기기만 하고 빈 섹션은 뺀다.
  - 배너: `TierMark(.heading, Radius.full)`, 높이 32. 밑에 `surface.raised` 캡슐을 깐다.
  - 2열 행: 덜 찬 칸은 `Color.clear`로 채운다. `championsByKey`에 없는 챔피언은 RN처럼 빈칸 없이 건너뛴다.
  - 빈 상태 문구, 출처 footer(`formatSource`로 `{patch}`·`{date}` 치환)
  - 셀: 46 아이콘(radius md, 티어색 테두리 1.5) + 이름(label) + 승률(accent) · 픽률(caption tertiary). 누르면 `router.presentTierlistChampion(key)`
- `TopTierSection`
  - "지금 S티어"(heading 크기, weight 800) + `MoreLink("티어리스트")` → `router.selectTab(.tierlist)`
  - S티어 가로 캐러셀: 56 원형 아바타, S색 테두리 2, 칸 폭 64, gap 4. 좌우 -16으로 홈 본문 여백을 넘어 화면 끝까지 간다.

**주의점**
- **브랜치**: `native/I-06a`(#93) + `native/I-05`(#89, `RemoteImage`) 위에 쌓았다. 작업 파일의 depends에는 I-05가 없지만, RN 셀과 아바타가 `RemoteImage`를 쓴다. 머지 순서: #88 → #93, #89 → 이 PR.
- `TopTierSection`은 홈(I-20) 본문의 좌우 16 여백 안에 놓인다고 본다(RN과 같다). I-20은 따로 여백을 줄 필요 없이 그대로 넣으면 된다.
- 스크롤을 시작하면 빈 검색을 끄는 동작은 iOS 18+만 된다(I-23과 같다).

**사용자가 볼 것**: 위 **사용자 확인** 2줄. 홈 S티어는 I-20이 `TopTierSection()`을 넣은 뒤에 볼 수 있다.
