# PickedDrawer 개편: 챔피언 정보 + 증강 5슬롯 + 시너지

## Context

드래프트 화면 우측 drawer(`picked-drawer.tsx`)가 현재 "뽑은 증강"만 2열 그리드로 보여준다. 사용자는 이 패널을 **"내 빌드 요약"** 패널로 확장하길 원한다:

1. 타이틀이 증강 전용이라 부적절 — 챔피언 + 증강을 함께 담는 타이틀 필요
2. 선택한 챔피언 정보(아이콘/이름/클래스/핵심 스탯)가 전혀 노출되지 않음
3. 증강 슬롯이 4개인데 5개로 보여야 함 (UI 표기만 5칸, 픽 로직은 4픽 유지)
4. 우측에 safe-area inset 때문에 콘텐츠가 좌측으로 쏠려 오른쪽이 붕 뜸
5. 증강 시너지 개념(예: 폭죽/화상 계열)을 표시하는 기능이 없음

목표: drawer 하나에서 "지금 이 챔피언이 어떤 증강을 모았고, 어떤 시너지가 활성화됐는지"를 한눈에 보여준다.

## 확정된 결정 (사용자 확인 완료)

- 증강 슬롯: **UI만 5칸**, 드래프트 로직(4픽)은 변경하지 않음
- 시너지: **직접 정의한 매핑 JSON**을 신규 작성 (주요 조합 위주)
- 챔피언 정보: 아이콘 + 이름 + 클래스 + 핵심 스탯(체력/공격력/방어력/마저/이속) 요약

## 조사 결과 (재사용 자산)

- `src/features/champions/types.ts` — `Champion`에 `tags`(클래스), `stats`(전체), `imageKey`, `name`, `title` 보유
- `src/features/champions/hooks/use-champions.ts` — `useChampions()` 로케일 분기 목록
- `src/lib/ddragon.ts` — `championSquareUrl(imageKey)`, `championClassIconUrl(tag)` 존재
- `src/features/draft/components/draft-screen.tsx` — 이미 `championId`를 `useLocalSearchParams`로 보유. 현재 `PickedDrawer`엔 `picked`, `width`만 전달
- 증강 데이터(`augments.ko.json`, 202개)에 `<keywordMajor>화상</keywordMajor>` 등 **공유 키워드** 존재 → 시너지 큐레이션 근거: 화상(10), 자동 사용(7), 고추기름(3), 무적(3), 폭죽(태풍 등) 등

## 변경 사항

### 1. championId를 PickedDrawer로 전달
- `draft-screen.tsx`: `renderDrawerContent`에서 `<PickedDrawer ... championId={championId} />` 전달

### 2. `picked-drawer.tsx` 재구성
레이아웃을 위→아래 3섹션으로: **챔피언 카드 / 증강 슬롯(5칸) / 활성 시너지**. 작은 폭이라 전체를 `ScrollView`(또는 단일 FlatList의 header/footer)로 감싸 세로 스크롤 허용.

- **타이틀**: `뽑은 증강` → `내 빌드` / `My Build` (i18n `t` 사전 수정)
- **챔피언 카드 섹션** (신규 `ChampionSummary` 내부 컴포넌트):
  - `useChampions().find(c => c.id === championId)`로 조회
  - `expo-image`의 `Image` + `championSquareUrl(champion.imageKey)`로 아이콘 (Radius.md, accent 테두리)
  - 이름(`ThemedText type="heading"`) + 클래스 칩: `champion.tags`를 한글/영문 라벨로 매핑(`Assassin→암살자` 등, `t` 사전에 추가) + 선택적으로 `championClassIconUrl(tag)` 아이콘
  - 핵심 스탯 칩 5개: `stats.hp / attackdamage / armor / spellblock / movespeed` — SF Symbol + 값. 토큰 색상 사용
  - championId 없을 때 섹션 미표시(방어)
- **증강 슬롯**: `BASE_SLOTS = 4 → 5`. 기존 2열 그리드 유지(5개 = 2+2+1행). `AugmentCell` 재사용
- **카운터**: `picked.length / 5` 표기

### 3. safe-area 우측 빈 공간 수정
- 원인: `SafeAreaView edges={[...,'right']}`의 right inset이 컨테이너 패딩으로 들어가 콘텐츠가 좌측 쏠림 + `cellSize`를 `width - insets.right`로 줄여 우측 공백 발생
- 수정: 컨테이너 배경(`colors.surface.base`)은 **full-bleed**로 화면 우측 끝까지 채우고, right inset은 **콘텐츠 paddingRight로만** 적용. `cellSize`는 가용 폭(=width - 좌우 패딩 - gap) 기준으로 재계산해 그리드가 폭을 꽉 채우도록 함. 세로 노치 보호는 top/bottom edge로 유지

### 4. 시너지 데이터 + 탐지 + 표시
- **타입**: `src/features/augments/types.ts`에 추가
  ```ts
  export interface Synergy {
    id: string;
    name: { ko: string; en: string };
    description: { ko: string; en: string };
    augmentIds: string[]; // 이 시너지에 기여하는 증강 id
    minCount: number;      // 활성화에 필요한 최소 개수 (기본 2)
    icon: string;          // SF Symbol 또는 키워드 아이콘
  }
  ```
- **데이터**: `src/features/augments/data/synergies.json` 신규. 증강 description의 공유 키워드를 근거로 주요 시너지 4~5종 큐레이션(예: 폭죽, 화상, 고추기름, 자동 사용). 각 시너지의 `augmentIds`는 `augments.ko.json`에서 해당 키워드를 가진 증강 id를 grep으로 추출해 채움
- **탐지 로직**: `src/features/augments/hooks/use-synergies.ts` — 순수 함수 `detectSynergies(pickedIds, synergies)`를 export하는 훅(로케일은 표시 시 적용). picked id 집합과 각 시너지 `augmentIds` 교집합 ≥ `minCount`면 활성, 보유 개수도 반환
- **표시**: `picked-drawer.tsx` 하단에 활성 시너지 칩 리스트(아이콘 + 이름 + `보유 n/필요 m`). 활성 시 accent 강조, 미달 조합은 표시 안 함(또는 흐리게 — 우선 활성만). 로케일은 `useLocale()`로 `name[locale]` 선택

## 비변경 (주의)
- `use-draft.ts`의 4픽/4라운드 로직, `nextRound >= 4` 종료 조건은 **건드리지 않음**
- 색상/간격/반경은 전부 `theme.ts` 토큰 사용 (하드코딩 금지)
- 모든 사용자 노출 텍스트는 `useTranslation` 또는 데이터 로케일 분기

## 작업 첫 단계
- CLAUDE.md 규칙에 따라 이 플랜을 `docs/plans/2026-06-03-picked-drawer-champion-synergy.md`로 복사 저장

## 검증
1. `npm run lint` 통과
2. `npm start`(또는 `npm run ios`)로 드래프트 진입 → 우측 drawer 열기:
   - 상단 타이틀이 "내 빌드"로 표시, 선택한 챔피언 아이콘/이름/클래스/스탯 노출
   - 증강 슬롯 5칸 표시, 픽할 때 채워짐, 우측 공백 없이 폭에 꽉 참
   - 폭죽/화상 계열 증강을 minCount 이상 픽하면 하단 시너지 칩 활성화
3. 가로모드 노치 단말에서 콘텐츠가 노치/홈바에 가리지 않는지 확인
4. 4픽 완료 시 기존대로 `/draft-result`로 정상 이동(로직 미변경 확인)
