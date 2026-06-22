# 증강 드래프트 화면

## Context

`select-champion-modal`에서 챔피언을 고르고 "시작하기"를 누르면, **가로모드 전용 증강 드래프트 화면**으로 진입한다. 사용자는 무작위로 뽑힌 카드 3장 중 하나를 골라야 하고, 이 사이클을 **4라운드** 반복해 총 4개의 증강을 확정한다. 각 라운드에서 카드는 뒤집혀 등장하고, 리롤 버튼으로 카드를 바꿀 수 있다. 진행 중 언제든 드로어를 열어 지금까지 픽한 증강을 그리드로 확인할 수 있고, 4라운드가 끝나면 별도 결과 화면으로 이동한다.

LoL 클라이언트의 증강 선택 UI를 모바일 가로모드에서 재현하는 것이 목표 — 카드 뒤집힘/사라짐 애니메이션과 rarity별 카드 프레임 스타일이 핵심 디테일이다.

## 의존성 추가

```bash
npx expo install expo-screen-orientation @react-navigation/drawer expo-linear-gradient
```

- `expo-screen-orientation` — 드래프트/결과 화면 진입 시 landscape 락, 이탈 시 portrait 복귀
- `@react-navigation/drawer` — 픽 현황 드로어 (expo-router `Drawer` 래퍼 사용)
- `expo-linear-gradient` — Prismatic 카드 무지개 테두리 / 결과 화면 배경

`app.json`의 `orientation: "portrait"`은 유지 (글로벌 디폴트는 portrait, draft/result만 코드에서 lock).

## 데이터 보강 — iconPath 채우기

현재 `src/features/augments/data/augments.{ko,en}.json` 의 202개 항목 모두 `iconPath: ""`.

CDragon ARAM 증강 아이콘 경로 패턴(추정): `game/assets/ux/cherry/augments/icons/<kebab-id>.png` — `src/lib/ddragon.ts:20` 의 `augmentImageUrl()`이 이 경로를 받아 풀 URL로 만든다.

작업:
1. CDragon에서 ARAM augment 아이콘 목록 fetch — `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json` (또는 ARAM 전용 경로 확인 필요)
2. `id` 매칭 + 폴백 규칙(찾지 못하면 빈 문자열 유지)으로 한 번에 양쪽 JSON 갱신
3. 갱신 스크립트는 일회성이므로 `scripts/fill-augment-icons.mjs`에 저장하고 `node scripts/fill-augment-icons.mjs` 로 실행 후 결과만 커밋. (script 자체는 후속 데이터 fetch에 재사용 가능하도록 보존)

UI는 `iconPath`가 비어있을 때 rarity별 SF Symbol 폴백을 그대로 표시 (방어 코드).

## 라우팅 / 화면 구조

새 라우트 파일 (얇은 wrapper):

- `src/app/draft.tsx` → `DraftScreen` (from features/draft/components)
- `src/app/draft-result.tsx` → `DraftResultScreen`

새 feature 디렉토리:

```
src/features/draft/
├── components/
│   ├── draft-screen.tsx           # 라운드 컨테이너 + Drawer 래핑
│   ├── draft-card.tsx             # 카드 1장 (flip + exit 애니메이션)
│   ├── draft-card-frame.tsx       # rarity별 프레임 (silver/gold/prismatic)
│   ├── reroll-button.tsx
│   ├── round-indicator.tsx        # 1/4 · 2/4 ...
│   ├── picked-augments-drawer.tsx # Drawer 본문 (그리드)
│   └── draft-result-screen.tsx
├── hooks/
│   ├── use-draft.ts               # 게임 상태 머신
│   └── use-landscape-lock.ts      # mount 시 가로 락 / unmount 복귀
└── types.ts                       # DraftRound, DraftState
```

`src/app/_layout.tsx` Stack에 두 화면 등록 (`headerShown: false`, `gestureEnabled: false` — 가로모드 중 dismiss 방지).

## 챔피언 선택 → 드래프트 연결

`src/features/champions/components/champion-select-modal.tsx:62-64`

```tsx
const handleStart = () => {
  router.dismissTo("/");          // 모달 닫고
  router.push({ pathname: "/draft", params: { championId: selectedId! } });
};
```

`/draft`에서 `useLocalSearchParams<{ championId: string }>()`로 받음. 결과 화면 헤더 등에서 챔피언 스플래시로 활용.

## 상태 머신 — `use-draft.ts`

```ts
type DraftState = {
  round: 0 | 1 | 2 | 3;             // 현재 라운드 (0-indexed)
  currentCards: Augment[];          // 길이 3
  picked: Augment[];                // 길이 0~4
  rerollsRemaining: number[];       // 각 카드별 리롤 가능 횟수 (옵션: 무제한)
};

actions:
  reroll(cardIndex)   // 해당 인덱스만 새 augment로 교체 (현재 화면+picked에 없는 풀에서)
  pick(cardIndex)     // picked.push(...) → round++ → 다음 3장 추첨 → round===4 면 router.replace("/draft-result")
```

규칙:
- 풀: 전체 augments에서 `picked` 와 `currentCards` 의 id 를 제외한 뒤 셔플 → 앞 3개
- Rarity 가중치: silver 0.7 / gold 0.25 / prismatic 0.05 (라운드별 약간 상향 가능 — round 4면 prismatic 0.15)
- 매 라운드 새 셔플

## 카드 디자인 (이미지 톤 매칭)

`DraftCardFrame` — rarity 별 프레임:

| rarity | 테두리 | 배경 | 글로우 |
|---|---|---|---|
| silver | `#9BA3AE` 1.5px | `#1B1E22` (raised보다 어둡게) | shadow opacity 0.2 |
| gold | `#E8B339` 1.5px | radial 느낌 (그라데이션 안 가능하므로 단색 + 안쪽 border) | gold glow |
| prismatic | `expo-linear-gradient` 무지개 (각도 130°, stops: `#FF9ECE → #C6A1FF → #6EE7FF → #9FFFC9`) 2px | `#0E0F12` 위에 prismatic subtle overlay | 강한 multi-color shadow |

카드 컨텐츠 (세로 카드):
1. 상단: rarity 글로우 박스 + augment 아이콘 (square, 96~120pt)
2. 가운데: `ThemedText type="heading"` 으로 이름
3. rarity 배지 (silver/gold/prismatic 칩)
4. 하단: description (`ThemedText type="caption"`, 3~4줄, 토큰 정리 별도 — 후술)

## 애니메이션 (reanimated 4)

### 카드 등장 (flip-in)
- 라운드 시작 시 3장이 순차적으로 0.1s stagger
- `rotateY: 180deg → 0deg` (0.5s, ease-out)
- `opacity: 0 → 1` , `scale: 0.92 → 1`
- 뒷면(빈 카드 백) → 앞면 으로 전환되는 느낌. 90°에서 컨텐츠가 시각적으로 swap 되도록 `interpolate`로 백/프론트 visible 분기

### 리롤 (out → in)
- 해당 카드만 `opacity: 1 → 0`, `translateY: 0 → -20` (0.25s)
- 데이터 교체 후 flip-in 재실행

### 픽 (라운드 종료)
- 픽한 카드: `scale: 1 → 1.06 → 0.9` + accent glow 잠깐
- 다른 두 카드: `opacity: 1 → 0`, `translateY: 0 → 30` (0.3s)
- 그 다음 새 라운드 카드 stagger flip-in

전부 `Animated.View` + `useSharedValue` + `withTiming`/`withSequence`.

## 화면 레이아웃 (가로모드, 예: 844x390 iPhone)

```
┌────────────────────────────────────────────────────────────┐
│  ← 닫기   라운드 2 / 4   [picked: ● ● ○ ○]      [📋 확인] │  ← 상단바 (44pt)
├────────────────────────────────────────────────────────────┤
│                                                            │
│     ┌──────┐    ┌──────┐    ┌──────┐                       │
│     │      │    │      │    │      │                       │
│     │ CARD │    │ CARD │    │ CARD │                       │
│     │      │    │      │    │      │                       │
│     └──────┘    └──────┘    └──────┘                       │
│       [↻]        [↻]        [↻]                            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- 카드 사이즈: `(screenW - padding*4) / 3` 너비, 종횡비 9:14
- 리롤 버튼: 카드 아래 16pt, 박스(Radius.md, surface.raised, border.default) + SF Symbol `arrow.counterclockwise`
- 상단바 우측 "확인" 버튼이 드로어 열기 (`navigation.openDrawer()`)
- 왼쪽 ✕ 버튼: 확인 alert 후 `router.dismissTo("/")` + portrait 복원

## 드로어 — `picked-augments-drawer.tsx`

`expo-router`의 `<Drawer>` (from `expo-router/drawer`) 로 `/draft` 라우트를 감싸기:

```tsx
// src/app/_layout.tsx 안에서 처리할지, draft.tsx 자체를 Drawer로 만들지 결정
// → draft.tsx 만 Drawer 가지도록 분리 (다른 화면 영향 X)
```

Drawer 컨텐츠:
- 상단: `ThemedText type="heading"` "뽑은 증강 N/4"
- `FlatList numColumns={2}` 그리드, 각 셀:
  - augment 아이콘 (rarity 글로우 프레임)
  - 이름 (label)
  - rarity 배지
- 빈 슬롯: dashed border + "?" 아이콘
- 드로어 너비: `min(380, screenW * 0.45)`
- 위치: `drawerPosition: 'right'` (가로모드에서 오른쪽 슬라이드 인이 자연스러움)

## 결과 화면 — `draft-result-screen.tsx`

- 가로모드 유지
- 상단: 챔피언 스플래시 (`championLoadingUrl`) blur 배경
- 중앙: 4장 증강 카드 가로 배열 (실제 드래프트 카드 컴포넌트 재사용, flip-in 1회)
- 하단 버튼: "다시 시작" → champion-select-modal 재오픈, "홈으로" → portrait 복귀 + tabs root

## i18n

`src/features/draft/components/draft-screen.tsx` 상단:

```ts
const t = {
  ko: {
    round: "라운드",
    of: " / ",
    reroll: "리롤",
    confirm: "확인",
    silver: "실버",
    gold: "골드",
    prismatic: "프리즘",
    pickedTitle: "뽑은 증강",
    emptySlot: "비어있음",
    restart: "다시 시작",
    home: "홈으로",
    result: "드래프트 완료",
  },
  en: { round: "Round", of: " / ", reroll: "Reroll", confirm: "Picks", silver: "Silver", gold: "Gold", prismatic: "Prismatic", pickedTitle: "Picked Augments", emptySlot: "Empty", restart: "Restart", home: "Home", result: "Draft Complete" },
};
```

## Description 토큰 정리 (별건)

`augments.ko.json` description 에 `|ap`, `<br>`, `;value;value;` 같은 게임 클라이언트 템플릿 토큰이 남아있다. 카드 표시 시 보기 흉하므로 `src/lib/augment-text.ts` 신설:

```ts
export function cleanAugmentDescription(raw: string): string {
  return raw
    .replace(/<br>/gi, "\n")
    .replace(/\|[a-z]+/gi, "")        // |ap, |AD 토큰 제거
    .replace(/;[^;]+;[^;]+/g, "")     // 다단계 값 제거
    .replace(/\s+/g, " ")
    .trim();
}
```

이 함수는 카드/드로어/결과 모두에서 사용.

## 수정/생성 파일 요약

**수정:**
- `src/app/_layout.tsx` — Stack.Screen 2개 추가 (`draft`, `draft-result`)
- `src/features/champions/components/champion-select-modal.tsx:62-64` — handleStart 라우팅 수정
- `src/constants/theme.ts` — `augmentRarity: { silver, gold, prismatic: { gradient: [...] } }` 토큰 추가 (dark/light)
- `src/features/augments/data/augments.{ko,en}.json` — iconPath 일괄 채움
- `app.json` — `orientation` 그대로 (portrait), 단 `expo-screen-orientation` 플러그인 추가

**생성:**
- `src/app/draft.tsx`, `src/app/draft-result.tsx` (얇은 re-export)
- `src/features/draft/` 전체 (위 구조)
- `src/lib/augment-text.ts`
- `scripts/fill-augment-icons.mjs` (일회성 데이터 스크립트)

## 검증

1. `npm run ios` → home 탭에서 "챔피언 선택" 모달 열기 → 챔피언 선택 → 시작하기 → 가로모드 회전 + 드래프트 화면 진입 확인
2. 카드 3장이 flip-in 으로 등장하는지, rarity 별 프레임이 다른지 시각 확인
3. 리롤 버튼 → 해당 카드만 사라졌다 다른 augment 로 등장
4. 픽 → 라운드 indicator 1→2 진행, 새 3장 등장
5. 상단 "확인" 버튼 → 오른쪽에서 드로어 슬라이드 인, 현재까지 픽한 증강이 그리드로 보임 (빈 슬롯은 dashed)
6. 4라운드 완료 → `/draft-result` 자동 이동, 4장 표시, 가로모드 유지
7. "홈으로" → portrait 복귀, 탭 루트로 이동
8. 한국어/영어 로케일 전환 시 모든 UI 텍스트 + augment 이름/설명 분기 확인
9. iconPath 가 빈 augment 가 있으면 rarity SF Symbol 폴백이 깨지지 않고 표시되는지 확인
10. `npm run lint` 통과
