# 티어리스트 명세

RN 원본: `src/features/tierlist/**` (`screens/tierlist-screen.tsx`, `screens/tierlist-champion-screen.tsx`, `components/*`, `hooks/*`, `tiers.ts`).
계산 규칙은 `data.md` §7.

## 1. 티어리스트 탭

**검색**
- 시스템 검색창, 스크롤하면 숨는다.
- 스크롤 드래그 시작 동작은 챔피언 선택과 같다(launch.md §2).

**목록**
- S/A/B/C/D 섹션
  - 섹션 헤더: `TierMark` 그라데이션 캡슐 배너
  - 행마다 `TierlistChampionCell` 2개
    - 티어 색 테두리 아이콘, 이름, 승률 %(accent) · 픽률 %
    - 누르면 `presentTierlistChampion(key)`
  - 마지막 행이 홀수면 빈 셀로 채운다.
- 빈 상태 문구가 있다.
- footer: 데이터 출처 + `{patch}`·`{date}` 치환

**계산**
- **앱은 티어를 계산하지 않는다.** aram.gg 결과를 그대로 보여 준다.
- 검색은 챔피언을 숨기기만 한다. 결과가 없는 섹션은 뺀다.

**TopTierSection** (홈에 끼워 넣는 조각, 이 피처 소유)
- "지금 S티어": S티어 아바타를 가로로 나열한다.
- MoreLink "티어리스트" → `selectTab(.tierlist)`

## 2. 티어리스트 챔피언 모달 (`key`)
- `key`가 바뀌면 화면을 새로 만든다.
- **닫기**: 뒤로 갈 곳이 있으면 `back()`, 없으면 티어리스트 탭으로(콜드 스타트 딥링크 대비).

**헤더 `TierlistChampionHeader`**
- 아이콘·이름·태그·`TierMark`·승률·픽률

**증강 `TierlistAugmentSection`**
- 그룹: prismatic → gold → silver(data.md §7)
- 그룹마다 6개 미리보기(`PREVIEW_COUNT`)
- "모든 증강 보기" 펼치기
  1. 먼저 진짜 맨 위로 스크롤한다(`useScrollTopAnchor`).
  2. 50ms마다 그룹당 12개씩 붙인다(`useStagedExpand`). 새 카드는 FadeIn 220ms.
  - 다시 접을 수 있다.

**아이템 `TierlistItemSection`**
- `TierlistSpellPill`: 가장 많이 쓰는 스펠 조합 + 픽률
- "빌드 순서" 그리드
- "상황별 아이템" 그리드
- 이름은 별도 사전 `tierlist-items.{ko,en}.json`에서 가져온다.

**없음**: 챔피언이나 행이 없으면 안내 문구를 보여 준다.

**공용**: `TierMark`, 티어 색(`useTierColors`) — 목록·모달·TopTierSection이 함께 쓴다.
