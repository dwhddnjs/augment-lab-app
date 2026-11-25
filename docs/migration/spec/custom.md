# 커스텀 모드 명세

RN 원본: `src/features/custom/**` (`screens/custom-screen.tsx`, `hooks/use-custom-draft.ts`, `components/*`), `src/hooks/{use-landscape-ready,use-alive,use-close-draft}.ts`.
애니메이션과 드래그 수치는 `design-system.md` §3.6 · §3.9 · §3.10.

## 1. 파라미터
- `championId`: 초기값일 뿐이다. 모르는 ID면 champion = null(유효한 상태).
- 가로 준비 가드는 아이템 선택과 같다(item-select §2).

## 2. 레이아웃 (본문 11등분: 왼쪽 6.5 / 오른쪽 4.5)

**헤더**
- X: 확인창 "담은 증강과 아이템은 저장되지 않습니다" → 나가기
- 가운데: `AugmentSearchField` + `PickTargetToggle`
  - 검색 필드: 지우기 버튼 있음, placeholder는 대상(증강/아이템)에 따라 다르다
  - 토글: 증강 ↔ 아이템 노브, 햅틱
- 오른쪽: ✓ 저장, ⚙ 설정
  - ⚙은 오른쪽 서랍을 연다. 서랍 스와이프는 꺼 둔다 — 카드를 오른쪽 가장자리로 끌 때 서랍이 열리지 않게.

**왼쪽**
- 대상 = 증강: `AugmentPickGrid`
  - `TierRail`: 전체 / silver / gold / prismatic 토글
  - 3열 `RarityCardFrame`. 담긴 카드는 표시한다.
- 대상 = 아이템: `ItemPickGrid` = `ItemFilterBar` + 아이템 아이콘 그리드

**담기**
- 드래그(`DragCell`): 180ms 길게 누르기 → 끌기
  - 드롭 x > inset.left + 왼쪽 폭이면 추가. 취소는 −1로 온다.
  - 손가락이 경계를 넘은 동안 오른쪽 패널을 강조한다.
- 빠른 모드: 탭으로 추가하고 드래그는 끈다.
- 햅틱: 시작 medium, 추가 light, 중복·가득 참 warning

**오른쪽 `SelectedPanel`**
- `SelectedChampionRow`: 아이콘·이름·태그 + pill 3개
  - "정보" → `ChampionStatOverlay`
  - "변경" → `ChampionChangeOverlay`
  - 재시작 아이콘 → 증강·아이템 전부 비우기(**확인창 없음**)
- 5:5 두 열: 증강(최대 5) / 아이템(최대 6)
  - 열·행·빈 안내를 누르면 대상이 바뀐다(selection 햅틱).
  - x 배지를 누르면 뺀다.

**설정 서랍 `CustomSettingsDrawer`** (SwiftUI List)
- 빠른 모드 Toggle
- 정렬 segmented: 기본 / 이름순 / 티어순 — 증강에만 적용

**오버레이** (라우트가 아니라 화면 안에 띄운다 → 담은 것이 사라지지 않음)
- `ChampionChangeOverlay`: 검색 + 그리드. 고르면 `setChampionId`, 담은 것은 유지한다.
- `ChampionStatOverlay`: 고른 아이템을 반영한 `ItemStatPanel`

## 3. 상태 로직 (`use-custom-draft.ts` → AugmentCore `Custom/`)
- **증강 목록**: 희귀도 tier 필터 && `matchName`
  - 정렬: `RARITY_RANK`(prismatic 0, gold 1, silver 2) → 이름
- `toggleTarget`: 이전 상태를 기준으로 뒤집고 질의도 비운다.
- **`add` / `addItem`**: `'added' | 'duplicate' | 'full'`을 돌려준다.
  - 판정은 상태 갱신 안(이전 값 기준)에서 한다 → 빠른 연타에도 정확해야 한다.
- 한도: `MAX_AUGMENTS = 5`, `MAX_ITEMS = 6`
- **저장**
  - 챔피언이 없거나 아무것도 안 담았으면 알림 "저장할 내용이 없어요".
  - 아니면 `saveBuild({mode:'aram', custom:true, championId, augmentIds, itemIds})` — 헤드라이너·transmutedIds 없음 → `openBuild(id)`
