# 모드 선택 · 챔피언 선택 명세

RN 원본: `src/components/navigation/mode-select-overlay.tsx`, `src/constants/game-modes.ts`, `src/features/champions/**` (`champion-select-screen.tsx`, `use-champion-select.ts`, `champion-select-grid.tsx`, `champion-select-icons.tsx`).

## 1. 모드 선택 오버레이
- 딤 배경(`surface.overlay`). 누르면 `back()`.
- `+` 위 오른쪽 아래에 60 원 버튼 2개.
  - `LAUNCH_MODES`를 뒤집은 순서: +에 가장 가까운 것이 칼바람(snowflake), 그 위가 커스텀(tune-variant).
- 고르면 오버레이를 **교체하며** `presentChampionSelect(mode)`.
- 등장 애니메이션과 배치는 design-system §3.3. 버튼 accent는 항상 다크 민트.

## 2. 챔피언 선택

**파라미터**: `mode`(모르면 aram), `headliner?`, `close`(내부용)

**헤더**
- X → `back()`
- ✓ → 시작. 챔피언을 고르기 전에는 비활성(40% opacity).

**검색**
- 시스템 검색창, placeholder "챔피언 검색 (초성 가능)". 초성 규칙은 data.md §5.
- 스크롤 드래그를 시작하면: 질의가 비었으면 검색을 취소하고, 아니면 키보드만 내린다.

**역할 칩** (리스트 헤더)
- "All"(SF `square.grid.2x2.fill`) + 역할 6개(CDragon 역할 아이콘).
- 활성 칩을 다시 누르면 필터가 풀린다.

**그리드**
- 4열, `localeCompare(locale)` 정렬.
- 누르면 선택이 토글된다(accent 테두리). 눌림 0.7.

**시작** (`handleStart`)
1. 연타 가드
2. 시트를 "전환 없이 닫힘"으로 표시한다(RN: `close=cut`)
3. 시트를 교체하지 않고 **그 위에** 드래프트를 띄운다
   - 칼바람: `startDraft(.aram(championId, mode, headliner?))`
   - 커스텀: `startDraft(.custom(championId))`

**prefetch**: 화면에 들어오면 챔피언 square 전부와 역할 아이콘을 받는다.
