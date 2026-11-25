# 아이템 선택 명세

RN 원본: `src/features/items/screens/item-select-screen.tsx`, `src/features/items/hooks/use-item-select.ts`, `src/features/items/components/*` (`item-grid`, `item-slot-grid`, `item-detail-panel`, `augment-card`, `item-filter-bar`, `filter-icon`, `item-stat-panel`), `src/features/items/{stats,item-filters}.ts`, `src/hooks/{use-landscape-ready,use-alive,use-close-draft}.ts`.

## 1. 파라미터 (방어적으로 파싱)
- `picked`: `Augment[]` JSON. 파싱에 실패하면 `[]`.
- `headliner`: JSON → `parseBuildHeadliner`. 깨졌으면 없음.
- `championId`, `mode`

## 2. 가로 준비 가드
- 가로 크기와 좌우 inset이 도착할 때까지 렌더를 미룬다.
- **한 번 준비되면 다시 숨기지 않는다.** 언마운트하면 선택이 사라지기 때문이다.

## 3. 구성

**헤더**
- glass X → 나가기
- 가운데: "아이템 선택" + "n / 6"
- glass ✓ 저장(tint)

**왼쪽 7 비율**
- 세로 `ItemFilterBar`(폭 44)
  - 탭: 전체 / 전사 / 원딜 / 암살자 / 마법사 / 탱커 / 서포터 / 신발
  - 활성 탭이나 "전체"를 다시 누르면 필터가 풀린다.
- 8열 `ItemGrid`
  - 누르면 담기·빼기가 토글된다. 최대 `MAX_ITEMS = 6`.
- 떠 있는 `ItemSlotGrid` 트레이: 6칸, 칸을 누르면 그 아이템을 뺀다(glass 수치는 design-system §4).

**오른쪽 3 비율 `ItemDetailPanel`**
- 챔피언
- `ItemStatPanel`(data.md §6)
- `HeadlinerSummary compact`
- `AugmentCard` 그리드
  - 라이트 모드에서는 증강 이름을 `text.secondary`로 쓴다.

## 4. 데이터·동작
- **풀**: `useItemPool('aram')` — `aram-item-ids.json` 111개
- **저장**
  1. `saveBuild({mode, championId, augmentIds, transmutedIds, itemIds, headliner})`. 아이템 0개도 허용한다.
  2. 실패하면 알림 "빌드 저장에 실패했어요".
  3. await 뒤 화면이 살아 있는지 확인한다(`useAlive`).
  4. `openBuild(id)`
- **나가기**: `confirmExit("저장하지 않고 나갈까요?")`
- **prefetch**: 화면에 들어오면 아이템 아이콘
