# Picked Drawer 시너지 티어/그리드/아이콘 개선

## Context
드래프트의 우측 "내 빌드" 드로어(`picked-drawer.tsx`)는 현재 ① 시너지를 단일 설명으로만 보여주고(스택 티어 개념 없음), ② 증강 셀이 2열 그리드로 커서 한 화면에 안 들어오며, ③ landscape에서 `insets.right`를 패딩으로 더해 우측이 붕 뜨고, ④ 시너지/버튼 아이콘이 `expo-image`의 `sf:` 심볼이라 **Android에서 렌더되지 않는다**(SF Symbols는 iOS 전용).

이번 작업은 이 네 가지를 해결한다. 시너지 효과를 **스택 breakpoint(2/3/4...)별 설명**으로 보여주되 현재 보유 스택에 도달한 티어는 정상색, 미도달 티어는 disabled색으로 렌더한다.

## 사전 결정 (사용자 확인 완료)
- 티어별 설명: 위키에서 우선 수집(아래 표), 부족분은 사용자가 텍스트 제공 예정 → 데이터 구조부터 만들고 채운다.
- 아이콘: `@expo/vector-icons`(MaterialCommunityIcons 중심) 사용.
- 아이콘 교체 범위: **draft 화면 전체의 모든 `sf:` 심볼**.

## 수집한 티어 데이터 (League Wiki, patch 26.x)
`(Unchanged)` = 이전 티어 효과 유지(새 효과 없음). `?` = 위키 미기재 → **사용자 확인 필요**.

| set | 2 | 3 | 4 | maxStacks |
|---|---|---|---|---|
| firecracker | 2회 튕김, 25% 위력 | (유지) | 3회 튕김, 50% 위력 | 6 |
| archmage | 쿨다운 30% 환급 | (유지) | (유지) | 4 |
| dive-bomb | 사망 타이머 25% 단축 | (유지) | (유지) | 4 |
| fully-automated | 쿨다운 30% 감소 | 자동 증강 쿨다운이 스킬가속에 비례 | (유지) | 9 |
| high-roller | 골드/프리즘 모루 선택 확률 +20% | 누적 +50%(총 70%) | ? | 7 |
| make-it-rain | 코인 6개(총 30골드) | 코인 12개(총 60골드) | (유지) | 8 |
| snowday | 피해 +30%, 가속 50 | 피해 +50%, 가속 100 | 피해 +100%, 가속 150 | 5 |
| stackosaurus-rex | 스택 +50% | 스택 +100% | 스택 +200% | 10 |
| wee-woo | 650 범위 내 저체력 아군에게 이속 +50% | 다음 힐/실드가 잃은 체력 12% 추가 회복(10s) | (유지) | 8 |

> 비고: 사용자의 폭죽 예시(2/3/4)와 실제 데이터(breakpoint 2·4, max 6)가 다름. 데이터를 `tiers` 배열로 모델링해 set별 임의 breakpoint를 그대로 표현한다. `(유지)`/`?` 항목은 실행 중 사용자 확정 텍스트로 채운다.

## 변경 사항

### 1. 데이터 구조 — `src/features/augments/types.ts`, `synergies.json`, `gen-synergies.mjs`
- `Synergy` 타입에 `tiers: { count: number; description: { ko: string; en: string } }[]` 추가, `maxStacks: number` 추가.
- 기존 `icon`(sf 문자열) → `icon`을 MaterialCommunityIcons 글리프 이름으로 교체:
  firecracker `firework` · archmage `auto-fix` · dive-bomb `arrow-down-bold-circle` · fully-automated `cog` · high-roller `dice-multiple` · make-it-rain `weather-pouring` · snowday `snowflake` · stackosaurus-rex `layers-triple` · wee-woo `medical-bag`.
- `minCount`은 `tiers[0].count`로 의미 유지(첫 breakpoint). 기존 단일 `description`은 제거하거나 `tiers[0]`로 대체.
- `gen-synergies.mjs`의 `defs`에 `tiers`/`maxStacks`/새 `icon` 추가하고 출력 매핑 갱신(데이터는 위 표 + 사용자 확정분).

### 2. 시너지 표시 + 스택 티어 — `src/features/augments/hooks/use-synergies.ts`, `picked-drawer.tsx`
- `useSynergies`는 `count` 그대로 반환(이미 contributing 수 계산). 티어 활성 판정은 `tier.count <= count`.
- `picked-drawer.tsx`: "증강 N/5" 라벨 아래(증강 그리드 다음)에 활성 시너지 블록 렌더. 각 시너지 카드:
  - 헤더: 벡터 아이콘 + 시너지 이름 + `count/maxStacks`.
  - 본문: `synergy.tiers`를 순회하며 각 티어 한 줄 `(스택수) 설명`. `tier.count <= count`면 `color="secondary"`(정상), 아니면 `color="disabled"`.
- 폭죽 예시 검증: typhoon+fan-the-hammer(=2) → 2 정상, 4 disabled. 폭죽 계열 4개 → 2·4 모두 정상.

### 3. 그리드 3열 축소 — `picked-drawer.tsx`
- `cellSize = (width - padLeft - padRight - Spacing.two * 2) / 3` (3열, gap 2개).
- `styles.grid`는 그대로 `flexWrap: 'row'` → 5칸이 3 + 2로 배치. 셀/아이콘/폰트가 자동으로 작아짐.

### 4. safe-area-right 제거 — `picked-drawer.tsx`
- `padRight = Spacing.three` 로 변경(`insets.right` 가산 제거). `useSafeAreaInsets`/`insets` 미사용 시 import 정리. `SafeAreaView` edges는 `['top','bottom']` 유지.

### 5. SF 심볼 → @expo/vector-icons 전면 교체 (draft 전체)
- 설치: `npx expo install @expo/vector-icons`.
- 공용 아이콘 컴포넌트 신설: `src/features/draft/components/synergy-icon.tsx` (또는 `components/ui`로 승격) — `name/size/color`를 받아 MaterialCommunityIcons 렌더. 단일 import 지점으로 통일.
- 교체 대상(모두 `expo-image` `source="sf:..."` → 벡터 아이콘):
  - `picked-drawer.tsx` 시너지 아이콘 (`source={synergy.icon}`)
  - `draft-card-frame.tsx` 시너지 배지 (`source={s.icon}`)
  - `reroll-button.tsx` `sf:arrow.counterclockwise` → `refresh`
  - `draft-screen.tsx` `sf:xmark` → `close`, `sf:list.bullet` → `format-list-bulleted`
  - `draft-result-screen.tsx` `sf:arrow.counterclockwise` → `refresh`, `sf:house.fill` → `home`
- `augment-icon.tsx`의 `fallbackSymbol`(sf:) 처리: 현재 `expo-image` Image로 sf 렌더 → 벡터 아이콘 fallback으로 변경. 호출부 `RARITY_SF`(picked-drawer, draft-card-frame)도 MaterialCommunityIcons 이름으로: silver `shield` · gold `star` · prismatic `shimmer`(또는 `star-four-points`).
  - 주의: `AugmentIcon`은 원격 이미지 우선, 실패 시에만 fallback. 벡터 아이콘은 tint=`tint` prop 적용.

## 영향 파일
- `src/features/augments/types.ts`
- `src/features/augments/data/synergies.json`
- `scripts/gen-synergies.mjs`
- `src/features/augments/hooks/use-synergies.ts`
- `src/features/draft/components/picked-drawer.tsx`
- `src/features/draft/components/draft-card-frame.tsx`
- `src/features/draft/components/augment-icon.tsx`
- `src/features/draft/components/reroll-button.tsx`
- `src/features/draft/components/draft-screen.tsx`
- `src/features/draft/components/draft-result-screen.tsx`
- 신규 `src/features/draft/components/synergy-icon.tsx`
- `package.json` (@expo/vector-icons)

## 실행 전 메모
- CLAUDE.md 규칙: 이 플랜을 `docs/plans/2026-06-04-picked-drawer-synergy-tiers.md`에도 저장(실행 첫 단계).
- 디자인 토큰 준수: 색상은 `useTheme().colors`, 간격/반경은 `Spacing.*`/`Radius.*`. 하드코딩 금지.
- i18n: 신규 사용자 노출 문구(스택 라벨 등)는 `t` dictionary에 ko/en 추가.
- `(유지)`/`?` 티어 텍스트는 사용자 확정분으로 최종 채움.

## 검증
1. `npx expo install @expo/vector-icons` 후 `npm run lint` 통과.
2. iOS 시뮬레이터 + Android 에뮬레이터 양쪽에서 draft 진입 → 모든 아이콘(닫기/리롤/픽목록/시너지/희귀도 fallback)이 **두 OS 모두** 보이는지 확인.
3. 드로어 열기: 증강 그리드가 3+2로 한 화면에 들어오는지, 우측 여백이 붕 뜨지 않는지.
4. 시너지 스택 케이스: 폭죽 2개 → 2티어 정상/상위 disabled, 폭죽 4개 → 2·4 정상 확인.
