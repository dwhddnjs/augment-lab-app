# 칼바람 드래프트 명세 (엔진 · 화면 · 카드 · 연출 · 서랍)

RN 원본: `src/features/aram/**` (`aram-screen.tsx`, `hooks/use-aram.ts`, `rarity-odds.ts`, `transmute.ts`, `components/*`), `src/features/headliners/{rules,assets,marked}.ts`, `src/components/ui/{pick-card,reroll-button,rarity-card-frame}.tsx`, `src/hooks/{use-card-pick-anim,use-landscape-size,use-close-draft}.ts`.
애니메이션 수치는 `design-system.md` §3.4(등장 연출) · §3.5(카드) · §3.10(서랍).

## 1. 파라미터
- `championId`
- `mode`(aram)
- `headliner?` — `isHeadlinerId`로 검증한다. 없거나 유효하지 않으면 무작위.

## 2. 엔진 (순수 로직 → AugmentCore `Aram/` · `Headliners/`)

### 2.1 헤드라이너 규칙 (`headliners/rules.ts`) — 테스트: `scripts/check-headliners.ts`
- `HEADLINER_IDS` 13개, `STICKER_IDS` 6개. 강제 지정이 없으면 `rollHeadliner`로 무작위(균등).
- **라운드 수 `roundsFor`**
  - `ARAM_ROUNDS = 4`. kda·worlds는 5(보너스 픽).
  - 라운드 표시: worlds는 5, kda는 4/4에서 멈춘다.
- **카드 수 `cardsFor`**: maestro 4, 나머지 3.
- `nextRarity`: silver → gold → prismatic → null.
- **pentakill 스킬 선택**
  - 1라운드 전에 한 번(Q/W/E), 4라운드 뒤에 남은 키(R 포함)에서 한 번 더 고른다(`skillChoices`, `needsSkillPick`).
  - 두 번째 스킬을 골라야(`pickSkill`) 판이 끝난다.
- **heartsteel 스티커**
  - 라운드마다 무작위 슬롯 2개에 서로 다른 멤버, 1개는 빈칸(`rollRoundStickers`).
  - 리롤할 때 빈 슬롯은 50% 확률로 남은 멤버를 받는다(`rerollSlotSticker`).
  - 스티커 카드를 고르면 `progress.stickers`에 더한다.
  - `anvilCount`: aphelios 1개당 2.
- **command-line**: 50/50 확률표 + 라운드 첫 리롤에 희귀도가 한 단계 오른다("해킹", 점멸 아트).
- 나머지(true-damage, disco, cafe-cuties, bees, arcade, debonair, la-ilusion)는 설명만 있고 규칙은 없다.
- 텍스트 검증: ko/en에 모든 ID·스티커·스킬이 있고, `{spell}`·`{n}` 치환자가 있으며, 마크 태그가 짝이 맞아야 한다.

### 2.2 희귀도·뽑기 (`rarity-odds.ts`, `transmute.ts`) — 테스트: `check-rarity-odds.mjs`, `check-transmute.ts`
- **확률표**
  - `RARITY_ODDS`: silver 0.3, gold 0.3, prismatic 0.4
  - `COMMAND_LINE_ODDS`: silver 0.5, gold 0.5 (prismatic 없음)
- **라운드 희귀도**: 라운드마다 하나를 뽑고 그 라운드의 모든 카드가 같은 희귀도다(`rollRarity`).
- **`drawOfRarity`**: 해당 희귀도로 `count`장을 뽑는다. 모자라면 아무 희귀도로 채운다.
- **`cardPool`**: `taken`(이번 판에 고르거나 받은 것 전부)과 현재 카드를 뺀다. 아직 아무것도 안 골랐으면 `pandora-s-box`도 뺀다.
- **리롤**: 라운드당 **카드 슬롯마다 1회**.
  - 풀에서 `taken`, 현재 카드 전부, 리롤 대상 자신을 뺀다. 희귀도는 그대로 둔다(command-line 해킹 예외).
  - heartsteel 스티커는 슬롯에 그대로 남는다.

### 2.3 선택·전환 (`applyPick`)

| 고른 증강 | 결과 |
|---|---|
| `transmute-gold` | gold 1개를 준다 |
| `transmute-prismatic` | prismatic 1개를 준다 |
| `transmute-chaos` | 아무 희귀도 2개를 준다 |
| `pandora-s-box` | 지금까지 고른 증강을 같은 수의 서로 다른 prismatic으로 바꾼다 |

- 전환 증강은 다른 전환 증강을 주지 않는다(연쇄 없음).
- 받은 증강에는 `transmuted: true`를 붙인다. 전환 카드 자체는 빌드에 넣지 않는다.
- 원본 객체는 바꾸지 않는다.

### 2.4 끝
- 판이 끝나면(`done`) `pushItems(picked: Augment[], headliner: BuildHeadliner, championId, mode)`.
- **교체가 아니라 쌓는다**(app-shell §3).

## 3. 화면 구성

**서랍**
- 오른쪽 front 서랍(design-system §3.10). 가장자리 스와이프는 등장 연출이 끝난 뒤부터.

**헤더**
- 왼쪽: glass X → `confirmExit("칼바람을 종료할까요?")`
- 가운데: 헤드라이너 로고 + "라운드 n / total" pill(`RoundIndicator`). 펜타킬 스킬 선택 중에는 "스킬 강화".
- 오른쪽: glass 목록 버튼 → 서랍 열기

**등장 연출 `HeadlinerReveal`**
- 먼저 화면을 덮는다. 2600ms 유지 → 300ms 페이드, 탭으로 건너뛸 수 있다.
- 카드는 연출이 끝난 뒤(`introDone`) 마운트한다.

**CardRow**
- `AramCard` 3장(maestro 4장). 펜타킬 스킬 선택 중에는 `SkillCard`.
- 카드를 누르면 선택한다: 380ms 애니메이션 뒤 확정. 고른 카드는 튀고 나머지는 사라진다.
- 카드마다 `RerollButton`: 220ms 페이드 교체, 라운드당 카드마다 1회.
- 애니메이션 중에는 모든 입력을 막는다(busy 가드, 두 손가락 동시 탭 포함).
- 보너스 카드에는 `KdaBadge` / `WorldsBadge`. heartsteel은 `StickerMark` + `StickerLabel`.
- **마지막 라운드**: 고른 카드를 다시 뒤집지 않는다. 고른 모습 그대로 멈춘 채 아이템 화면으로 넘어간다.

**서랍 내용 `PickedDrawer`**
- `ChampionSummary`
- `HeadlinerSummary compact`
- 3열 증강 그리드. 슬롯 수 `max(6, picked.length)`, 라벨 "n/6".

**prefetch**
- 현재 카드 아이콘(`augmentImageUrls` 체인)
- 펜타킬 스펠 아이콘

## 4. 카드 (`AramCard`, `SkillCard`, `CardMarks`)
- `AramCard`: `RarityCardFrame` + `RerollButton` + 마크
- `SkillCard`: 스킬 아이콘·키·이름 + `skill-card-swirl` / `skill-card-icon-frame` 에셋, SkillCardColors
- **CardMarks**
  - kda·worlds 보너스 배지
  - heartsteel 스티커 초상화 + 라벨
  - command-line 해킹 아트(라이트 모드 변형 포함)
