# 아레나(Arena) 모드 추가 — 단계적 구현 플랜

## Context (배경)

증강연구소 앱은 **칼바람나락 무작위총격전:아수라장(ARAM Mayhem)** 모드를 완성한 상태이며, 두 번째 모드로 **리그 오브 레전드 아레나(Arena / "Cherry")**를 추가한다.

아레나는 칼바람과 게임 방식이 크게 다르다:
- 12라운드 구조(증강 / 골드 상점 / 재련 라운드 교차)
- 증강 **레벨업** 개념(실버·골드 최대 2렙, 프리즘 최대 3렙)
- **프리즘 아이템**, **능력치/전설/프리즘 모루** 등 아레나 전용 아이템
- 라운드마다 다른 선택지

규모가 커서 **3단계 PR로 분리**하고, 폴더/네이밍을 **칼바람(`features/draft`)과 아레나(`features/arena`)로 확실히 분리**한다.

## 데이터 소스 (검증 완료)

| 데이터 | 소스 | 확정 사항 |
|---|---|---|
| 아레나 증강 | `cdragon/arena/{ko_kr,en_us}.json`의 `augments` | 228개. `rarity` 숫자: **0=silver, 1=gold, 2=prismatic (203개)**. `iconSmall`은 `assets/ux/cherry/...` |
| 특수 증강 | 위 데이터의 **rarity 4 (25개)** | 재련 craft 옵션("증강 강화", "증강 슬롯 획득", "프리즘 능력치 모루") + 시즌변형. 아이콘 변형 suffix(`.arena_2026_s2`)가 여기 집중 → **별도 파일로 분리** |
| 프리즘 아이템 | `plugins/.../v1/items.json`의 **id 447100~447123 (23개)** | `inStore:true`, `price` 2500~2750, `description`은 기존 `Item`과 동일한 `<mainText>` HTML. 달빛 마법검=447110 |
| 전설급 아이템 | 기존 `items.{ko,en}.json` 재사용 | 아레나 전설 화이트리스트 추출은 **2단계(상점 UI)로 이관** |
| 능력치 모루(스탯) | 별도 데이터 없음 | **수동 정의**(`stat-shards.{ko,en}.json`) |

> 아이콘 URL: 증강은 `iconSmall` 앞에 `/lol-game-data/assets/`를 붙여 기존 `augmentImageUrl()` 호환. 프리즘 아이템은 ddragon에 없어 신규 `cdragonItemIconUrl()` 헬퍼 사용.
> fetch 주의: 기존 `scripts/fetch-data/*`는 `src/data/`로 출력하는 outdated 버전 → 신규 스크립트는 실제 위치 `src/features/arena/data/`로 직접 출력.

## 전체 로드맵

| 단계 | 범위 |
|---|---|
| **1단계(이번 PR)** | 데이터 인프라 + 진입 흐름: 아레나 데이터 JSON·검수 페이지, `features/arena` 골격, 모드 선택 오버레이, 챔피언 선택 랜덤 분기, 빌드 저장 `mode` 필드 |
| **2단계** | 아레나 게임 화면(가로): 12라운드 엔진, 증강 카드(레벨업/별), 프리즘 카드, 골드 상점(전설/모루), 재련, drawer |
| **3단계** | 결과 상세 화면(세로), 백버튼→메인, 목록 카드 |

## 1단계 상세

1. **fetch 스크립트** `scripts/fetch-data/fetch-arena.ts` (신규) — `index.ts`에 연결. 아레나 증강(rarity 0/1/2 → `augments`, rarity 4 → `special-augments`), 프리즘 아이템(447xxx) 추출. 의존성 없는 인라인 타입 사용.
2. **`src/features/arena/`** 골격: `types.ts`, `data/`(생성 JSON + 수동 `stat-shards`), `hooks/use-arena-augments.ts`·`use-arena-items.ts`(기존 `use-augments.ts` 패턴 복제), `screens/`·`components/`(2단계).
3. **이미지 헬퍼**: `src/lib/ddragon.ts`에 `cdragonItemIconUrl()` 추가.
4. **모드 선택 오버레이**: `src/components/navigation/mode-selector-overlay.tsx` + `(tabs)/_layout.tsx`·`app-tabs.{ios,}.tsx` 연결. `+` 누르면 아레나/칼바람 원형 버튼.
5. **챔피언 선택 분기**: `champion-select-screen.tsx`에 `mode` 수신, 맨 앞 물음표(랜덤) 박스, `mode==='arena'`이면 `/arena`(플레이스홀더)로.
6. **빌드 저장**: `build-storage.ts` `SavedBuild.mode`(`'aram'|'arena'`, 폴백 `'aram'`). `build-list-screen.tsx` 모드 탭 필터.
7. **검수 페이지**: `gen-arena-check.mjs` → `docs/arena-check.html`.
8. **i18n**: 신규 UI 텍스트는 `const t = { ko, en }` + `useTranslation`.

## 검증 (1단계)

1. `npm run data:refresh` → `src/features/arena/data/` JSON 생성, 콘솔로 개수·rarity 분포 확인.
2. `node scripts/gen-arena-check.mjs` → `docs/arena-check.html` 아이콘·이름·등급 육안 검수.
3. `npm run ios`: `+`→오버레이, 아레나→물음표 박스·랜덤, 칼바람→기존 `/draft` 회귀 없음, 빌드 목록 모드 탭.
4. `npm run lint` 통과.
