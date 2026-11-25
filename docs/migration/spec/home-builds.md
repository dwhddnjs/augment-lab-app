# 홈 · 내 빌드 · 빌드 상세 명세

RN 원본: `src/features/builds/**`, `src/features/tierlist/components/top-tier-section.tsx`, `src/app/(tabs)/(home)/*`, `src/app/build/[id].tsx`, `src/lib/review.ts`.
시각 수치는 `design-system.md`를 따른다.

## 1. 홈 (`home-screen.tsx`)

루트는 ScrollView다(큰 제목이 접히도록). 위에서부터 다음 순서로 그린다.

### 1.1 StartCard (`start-card.tsx`)
- 헤드라이너 타일을 가로로 늘어놓는다.
  - 드래프트를 바꾸는 헤드라이너(`DRAFT_EVENT_IDS`)가 먼저, 설명만 있는 것(`LINEUP`)이 뒤.
- 타일을 누르면 `presentChampionSelect(mode: aram, headliner: id)`.
  - 연타 방지 플래그를 두고, 화면에 다시 들어오면 푼다.
- "무작위" 타일은 **없다**. 무작위 시작은 `+` → 칼바람으로 한다.
- 배경: #0A0B0D, 무대 조명 4겹, 타일 radial(design-system §4).

### 1.2 최근 빌드
- 최대 8개 `BuildCard`, 폭 148, 가로 캐러셀.
- 누르면 `push(.build(id))`. 길게 누르면 삭제 확인 → `removeBuild`.
- "전체 보기"(MoreLink) → `push(.builds)`.
- 빌드가 없으면 `EmptyBuildCard`. 누르면 `showModeSelect()`.

### 1.3 TopTierSection ("지금 S티어")
- 소유는 티어리스트 작업이고, 홈은 끼워 넣기만 한다.
- S티어 행 전부를 아바타로 가로 나열한다. 누르면 `presentTierlistChampion(key)`.
- "티어리스트" 링크 → `selectTab(.tierlist)`.

## 2. BuildCard (공용, `build-card.tsx`)
- 아트 위에 scrimDark를 깐다. 헤드라이너·커스텀 빌드면 모서리 scrim을 더한다.
- 커스텀 빌드는 `Theme.dark.accent`. 눌림 opacity 0.92.
- 글로우 `0 6px 14px -8px C4D`.
- 날짜 라벨은 `dayLabel`(`builds/utils/date.ts`).
- 쓰는 데이터: 챔피언·증강·로케일.

## 3. 내 빌드 (`build-list-screen.tsx`)
- 2열 그리드. 카드 폭 = (화면폭 − 2·16 − 12) / 2.
- 헤더에 세그먼트 필터. **빌드가 1개 이상일 때만** 보인다.

  | 필터 | 조건 |
  |---|---|
  | 전체 | – |
  | 최근 7일 | `isWithinWeek` — 로컬 자정 기준 7일 미만 |
  | 프리즘 | augmentId 중 하나라도 prismatic |
  | 커스텀 | `custom === true` |

- 누르면 상세로, 길게 누르면 삭제 확인.
- 빈 상태 2종
  - 빌드 자체가 없음: "빌드를 완료하면…"
  - 필터 결과가 없음: "조건에 맞는 빌드가 없어요"

## 4. 빌드 상세 (`build-detail-screen.tsx`)

**로딩과 없음**
- 로딩 중에는 빈 화면이다.
- 빌드가 없으면 "빌드를 찾을 수 없어요".

**배너·헤더**
- 배너: 챔피언 스플래시 300 높이, 아래 그라데이션.
  - 당기면 최대 +140 확대, 올리면 276에 걸쳐 0으로 접힌다(design-system §3.8).
- 헤더 배경(GlassSurface)과 챔피언 이름은 접힘 45%~80% 구간에서 페이드 인.

**시트 (위에서부터)**
1. `BuildChampionHeader`: 아이콘·이름·태그·날짜
2. `HeadlinerSummary`
3. `BuildAugmentList`: `DetailCardRow` + `AugmentTile`
   - 이름은 `useAugmentName`(전환이면 "전환: " 접두사), 설명은 `cleanAugmentDescription`
4. `BuildItemRow`(아이템이 있을 때만): `formatItemStats`, `cleanItemDescription`
5. `ItemStatPanel`: 챔피언 기본 스탯 + 아이템 스탯

**동작**
- 전환 여부는 `build.transmutedIds`로 되살린다.
- 휴지통 → 확인 → `removeBuild` 완료를 기다린 뒤 → `back()`.
- `saved`면 1초 뒤 리뷰 요청(storage.md §6).
- 저장으로 들어왔을 때의 전환·회전은 app-shell.md §3을 따른다.

**쓰는 데이터**: `getBuild`, 챔피언, 증강(전체), 아이템(전체 조회용), 헤드라이너 텍스트, 챔피언 스펠
